import fs from 'node:fs';
import path from 'node:path';
import { BlobPreconditionFailedError, get, put } from '@vercel/blob';
import { Pool, type PoolClient } from 'pg';

export type IntentAction = 'view' | 'save';
export type ProductMetrics = Record<IntentAction, number>;
type Data = { approved: Record<string, string[]>; topics: Record<string, string>; metrics: Record<string, Record<string, ProductMetrics>> };
const MAX_CHANNELS = 1_000;
const MAX_PRODUCTS_PER_CHANNEL = 500;
export const MAX_APPROVAL_CHANNELS = MAX_CHANNELS;
export const MAX_APPROVALS_PER_CHANNEL = MAX_PRODUCTS_PER_CHANNEL;
const EMPTY_DATA = (): Data => ({ approved: { demo: ['kb1'] }, topics: {}, metrics: {} });
type MaybePromise<T> = T | Promise<T>;

export class StoreCapacityError extends Error {
  constructor(readonly code: 'approval_channel_limit' | 'approval_product_limit') {
    super(code);
    this.name = 'StoreCapacityError';
  }
}

function addApproval(data: Data, channelId: string, productId: string) {
  const current = data.approved[channelId] ?? [];
  if (current.includes(productId)) return false;
  const activeChannels = Object.values(data.approved).reduce((total, products) => total + (products.length > 0 ? 1 : 0), 0);
  if (current.length === 0 && activeChannels >= MAX_APPROVAL_CHANNELS) throw new StoreCapacityError('approval_channel_limit');
  if (current.length >= MAX_APPROVALS_PER_CHANNEL) throw new StoreCapacityError('approval_product_limit');
  data.approved[channelId] = [...current, productId];
  return true;
}

function removeApproval(data: Data, channelId: string, productId: string) {
  const current = data.approved[channelId] ?? [];
  if (!current.includes(productId)) return false;
  const remaining = current.filter((id) => id !== productId);
  if (remaining.length) data.approved[channelId] = remaining;
  else delete data.approved[channelId];
  return true;
}

export interface StorePort {
  approved(channelId: string): MaybePromise<string[]>;
  approve(channelId: string, productId: string): MaybePromise<void>;
  unapprove(channelId: string, productId: string): MaybePromise<void>;
  topic(channelId: string): MaybePromise<string>;
  setTopic(channelId: string, topic: string): MaybePromise<void>;
  recordIntent(channelId: string, productId: string, action: IntentAction): MaybePromise<ProductMetrics>;
  metrics(channelId: string): MaybePromise<Record<string, ProductMetrics>>;
}

export class Store {
  private data: Data = EMPTY_DATA();
  constructor(private readonly file: string) {
    try {
      const persisted = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<Data>;
      this.data = { approved: persisted.approved ?? this.data.approved, topics: persisted.topics ?? {}, metrics: persisted.metrics ?? {} };
    } catch { /* Missing data is the expected first-run state. */ }
  }
  private save() {
    const target = path.resolve(this.file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temporary = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(this.data, null, 2), { mode: 0o600 });
    fs.renameSync(temporary, target);
  }
  approved(channelId: string) { return this.data.approved[channelId] ?? []; }
  approve(channelId: string, productId: string) { if (addApproval(this.data, channelId, productId)) this.save(); }
  unapprove(channelId: string, productId: string) { if (removeApproval(this.data, channelId, productId)) this.save(); }
  topic(channelId: string) { return this.data.topics[channelId] ?? 'stream setup'; }
  setTopic(channelId: string, topic: string) { this.data.topics[channelId] = topic; this.save(); }
  recordIntent(channelId: string, productId: string, action: IntentAction) {
    if (!this.data.metrics[channelId] && Object.keys(this.data.metrics).length >= MAX_CHANNELS) throw new Error('metric_channel_limit');
    const channel = (this.data.metrics[channelId] ??= {});
    if (!channel[productId] && Object.keys(channel).length >= MAX_PRODUCTS_PER_CHANNEL) throw new Error('metric_product_limit');
    const product = (channel[productId] ??= { view: 0, save: 0 });
    product[action] += 1;
    this.save();
    return { ...product };
  }
  metrics(channelId: string) { return this.data.metrics[channelId] ?? {}; }
}

function normalized(input: Partial<Data> | undefined): Data {
  const initial = EMPTY_DATA();
  return { approved: input?.approved ?? initial.approved, topics: input?.topics ?? {}, metrics: input?.metrics ?? {} };
}

export class BlobStore implements StorePort {
  constructor(private readonly pathname = 'streamcart/state.json') {}

  private async read(): Promise<{ data: Data; etag?: string }> {
    const result = await get(this.pathname, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200) return { data: EMPTY_DATA() };
    const input = await new Response(result.stream).json() as Partial<Data>;
    return { data: normalized(input), etag: result.blob.etag };
  }

  private async mutate<T>(change: (data: Data) => T, isNoop?: (result: T) => boolean): Promise<T> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data, etag } = await this.read();
      const result = change(data);
      if (isNoop?.(result)) return result;
      try {
        await put(this.pathname, JSON.stringify(data), {
          access: 'private', addRandomSuffix: false, allowOverwrite: Boolean(etag),
          ...(etag ? { ifMatch: etag } : {}), contentType: 'application/json', cacheControlMaxAge: 60,
        });
        return result;
      } catch (error) {
        if (!(error instanceof BlobPreconditionFailedError) || attempt === 4) throw error;
      }
    }
    throw new Error('blob_write_conflict');
  }

  async approved(channelId: string) { return (await this.read()).data.approved[channelId] ?? []; }
  async approve(channelId: string, productId: string) { await this.mutate((data) => addApproval(data, channelId, productId), (added) => !added); }
  async unapprove(channelId: string, productId: string) { await this.mutate((data) => removeApproval(data, channelId, productId), (removed) => !removed); }
  async topic(channelId: string) { return (await this.read()).data.topics[channelId] ?? 'stream setup'; }
  async setTopic(channelId: string, topic: string) { await this.mutate((data) => { data.topics[channelId] = topic; }); }
  async recordIntent(channelId: string, productId: string, action: IntentAction) {
    return this.mutate((data) => {
      if (!data.metrics[channelId] && Object.keys(data.metrics).length >= MAX_CHANNELS) throw new Error('metric_channel_limit');
      const channel = (data.metrics[channelId] ??= {});
      if (!channel[productId] && Object.keys(channel).length >= MAX_PRODUCTS_PER_CHANNEL) throw new Error('metric_product_limit');
      const product = (channel[productId] ??= { view: 0, save: 0 });
      product[action] += 1;
      return { ...product };
    });
  }
  async metrics(channelId: string) { return (await this.read()).data.metrics[channelId] ?? {}; }
}

export class PostgresStore implements StorePort {
  private readonly pool: Pool;
  private ready?: Promise<void>;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 4, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000, allowExitOnIdle: true });
  }

  private initialize() {
    return (this.ready ??= this.pool.query(`
      CREATE TABLE IF NOT EXISTS streamcart_state (
        id smallint PRIMARY KEY CHECK (id = 1),
        payload jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `).then(() => undefined));
  }

  private async read(): Promise<Data> {
    await this.initialize();
    const result = await this.pool.query<{ payload: Partial<Data> }>('SELECT payload FROM streamcart_state WHERE id = 1');
    return normalized(result.rows[0]?.payload);
  }

  private async mutate<T>(change: (data: Data) => T, isNoop?: (result: T) => boolean): Promise<T> {
    await this.initialize();
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('INSERT INTO streamcart_state (id, payload) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING', [JSON.stringify(EMPTY_DATA())]);
      const selected = await client.query<{ payload: Partial<Data> }>('SELECT payload FROM streamcart_state WHERE id = 1 FOR UPDATE');
      const data = normalized(selected.rows[0]?.payload);
      const result = change(data);
      if (isNoop?.(result)) {
        await client.query('COMMIT');
        return result;
      }
      await client.query('UPDATE streamcart_state SET payload = $1::jsonb, updated_at = now() WHERE id = 1', [JSON.stringify(data)]);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async approved(channelId: string) { return (await this.read()).approved[channelId] ?? []; }
  async approve(channelId: string, productId: string) { await this.mutate((data) => addApproval(data, channelId, productId), (added) => !added); }
  async unapprove(channelId: string, productId: string) { await this.mutate((data) => removeApproval(data, channelId, productId), (removed) => !removed); }
  async topic(channelId: string) { return (await this.read()).topics[channelId] ?? 'stream setup'; }
  async setTopic(channelId: string, topic: string) { await this.mutate((data) => { data.topics[channelId] = topic; }); }
  async recordIntent(channelId: string, productId: string, action: IntentAction) {
    return this.mutate((data) => {
      if (!data.metrics[channelId] && Object.keys(data.metrics).length >= MAX_CHANNELS) throw new Error('metric_channel_limit');
      const channel = (data.metrics[channelId] ??= {});
      if (!channel[productId] && Object.keys(channel).length >= MAX_PRODUCTS_PER_CHANNEL) throw new Error('metric_product_limit');
      const product = (channel[productId] ??= { view: 0, save: 0 });
      product[action] += 1;
      return { ...product };
    });
  }
  async metrics(channelId: string) { return (await this.read()).metrics[channelId] ?? {}; }
}

export function createStore(): StorePort {
  if (process.env.DATABASE_URL) return new PostgresStore(process.env.DATABASE_URL);
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return new BlobStore();
  return new Store(process.env.DATA_FILE || './data/streamcart.json');
}
