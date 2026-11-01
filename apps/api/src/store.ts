import fs from 'node:fs';
import path from 'node:path';
import { BlobPreconditionFailedError, get, put } from '@vercel/blob';

export type IntentAction = 'view' | 'save';
export type ProductMetrics = Record<IntentAction, number>;
type Data = { approved: Record<string, string[]>; topics: Record<string, string>; metrics: Record<string, Record<string, ProductMetrics>> };
const MAX_CHANNELS = 1_000;
const MAX_PRODUCTS_PER_CHANNEL = 500;
const EMPTY_DATA = (): Data => ({ approved: { demo: ['kb1'] }, topics: {}, metrics: {} });
type MaybePromise<T> = T | Promise<T>;

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
  approve(channelId: string, productId: string) { this.data.approved[channelId] = [...new Set([...(this.data.approved[channelId] ?? []), productId])]; this.save(); }
  unapprove(channelId: string, productId: string) { this.data.approved[channelId] = (this.data.approved[channelId] ?? []).filter((id) => id !== productId); this.save(); }
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

  private async mutate<T>(change: (data: Data) => T): Promise<T> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data, etag } = await this.read();
      const result = change(data);
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
  async approve(channelId: string, productId: string) { await this.mutate((data) => { data.approved[channelId] = [...new Set([...(data.approved[channelId] ?? []), productId])]; }); }
  async unapprove(channelId: string, productId: string) { await this.mutate((data) => { data.approved[channelId] = (data.approved[channelId] ?? []).filter((id) => id !== productId); }); }
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

export function createStore(): StorePort {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID ? new BlobStore() : new Store(process.env.DATA_FILE || './data/streamcart.json');
}
