import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { BlobStore, createStore, PostgresStore, Store } from '../src/store.js';

const secret = '0123456789abcdef0123456789abcdef';
function signedHeaders(id: string, type: string, body: string) {
  const timestamp = new Date().toISOString();
  const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(id + timestamp + body).digest('hex');
  return { 'content-type': 'application/json', 'twitch-eventsub-message-id': id, 'twitch-eventsub-message-timestamp': timestamp, 'twitch-eventsub-message-signature': signature, 'twitch-eventsub-message-type': type };
}
async function withApi(run: (base: string, store: Store) => Promise<void>, options: { demoMode?: boolean; extensionSecret?: string } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'streamcart-test-'));
  const store = new Store(path.join(directory, 'data.json'));
  const server = http.createServer(createApp(store, { eventSubSecret: secret, demoMode: options.demoMode ?? true, extensionSecret: options.extensionSecret }));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');
  try { await run(`http://127.0.0.1:${address.port}`, store); }
  finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); fs.rmSync(directory, { recursive: true }); }
}

test('EventSub verifies challenge and rejects invalid signatures', () => withApi(async (base) => {
  const body = JSON.stringify({ challenge: 'proof', subscription: { type: 'channel.chat.message' } });
  const verified = await fetch(`${base}/v1/twitch/eventsub`, { method: 'POST', headers: signedHeaders('challenge-1', 'webhook_callback_verification', body), body });
  assert.equal(verified.status, 200); assert.equal(await verified.text(), 'proof');
  const rejected = await fetch(`${base}/v1/twitch/eventsub`, { method: 'POST', headers: { ...signedHeaders('bad-1', 'notification', body), 'twitch-eventsub-message-signature': 'sha256=invalid' }, body });
  assert.equal(rejected.status, 403);
}));

test('only broadcaster !gear commands update topic and duplicate delivery is idempotent', () => withApi(async (base, store) => {
  const event = (chatter: string, text: string) => JSON.stringify({ subscription: { type: 'channel.chat.message' }, event: { broadcaster_user_id: '42', chatter_user_id: chatter, message: { text } } });
  const viewerBody = event('99', '!gear invasive camera');
  assert.equal((await fetch(`${base}/v1/twitch/eventsub`, { method: 'POST', headers: signedHeaders('viewer-1', 'notification', viewerBody), body: viewerBody })).status, 204);
  assert.equal(store.topic('42'), 'stream setup');
  const creatorBody = event('42', '!gear mechanical keyboard');
  const headers = signedHeaders('creator-1', 'notification', creatorBody);
  assert.equal((await fetch(`${base}/v1/twitch/eventsub`, { method: 'POST', headers, body: creatorBody })).status, 204);
  assert.equal(store.topic('42'), 'mechanical keyboard');
  assert.equal((await fetch(`${base}/v1/twitch/eventsub`, { method: 'POST', headers, body: creatorBody })).status, 204);
  assert.equal(store.topic('42'), 'mechanical keyboard');
}));

test('viewer intent stores aggregate counts without viewer identity', () => withApi(async (base, store) => {
  const discovery = await fetch(`${base}/v1/channels/demo/discovery`).then((response) => response.json()) as { items: Array<{ id: string; price: number; currency: string; brand?: string; brands?: string[] }> };
  const keyboard = discovery.items.find((item) => item.id === 'kb1');
  assert.deepEqual(keyboard && { price: keyboard.price, currency: keyboard.currency }, { price: 79.99, currency: 'USD' });
  assert.equal(keyboard?.brand, 'KeyForge');
  assert.deepEqual(keyboard?.brands, ['KeyForge']);
  const response = await fetch(`${base}/v1/viewer/intent`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ channelId: 'demo', productId: 'kb1', action: 'save' }) });
  assert.equal(response.status, 201); assert.deepEqual(store.metrics('demo').kb1, { view: 0, save: 1 });
  const invalid = await fetch(`${base}/v1/viewer/intent`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ channelId: 'demo', productId: 'kb1', action: 'save', viewerId: 'should-not-be-required' }) });
  assert.equal(invalid.status, 201);
}));

test('signed creator and viewer roles drive hybrid discovery with grouped save-action counts', () => {
  const channelId = 'hybrid-regression';
  const extensionSecret = Buffer.from('streamcart-test-extension-secret-32').toString('base64');
  const signingKey = Buffer.from(extensionSecret, 'base64');
  const expiresAt = Math.floor(Date.now() / 1000) + 60;
  const broadcasterToken = jwt.sign({ role: 'broadcaster', channel_id: channelId, exp: expiresAt }, signingKey, { algorithm: 'HS256' });
  const viewerToken = jwt.sign({ role: 'viewer', channel_id: channelId, exp: expiresAt }, signingKey, { algorithm: 'HS256' });
  const authHeaders = (token: string) => ({ 'content-type': 'application/json', 'x-extension-jwt': token });
  return withApi(async (base, store) => {
    store.setTopic(channelId, 'mechanical keyboard');
    type DiscoveryResponse = { items: Array<{ id: string; provenance: string; aggregateIntent: { view: number; save: number } }> };
    const getDiscovery = () => fetch(`${base}/v1/channels/${channelId}/discovery`).then((response) => response.json() as Promise<DiscoveryResponse>);
    const initial = await getDiscovery();
    const initialKeyboard = initial.items.find((item) => item.id === 'kb1');
    assert.equal(initialKeyboard?.provenance, 'ai_discovered');

    const approval = await fetch(`${base}/v1/creator/products`, {
      method: 'POST', headers: authHeaders(broadcasterToken), body: JSON.stringify({ channelId: 'forged-channel', productId: 'kb1' }),
    });
    assert.equal(approval.status, 201);
    assert.deepEqual(await store.approved(channelId), ['kb1']);
    assert.deepEqual(await store.approved('forged-channel'), []);

    const unauthorizedApproval = await fetch(`${base}/v1/creator/products`, {
      method: 'POST', headers: authHeaders(viewerToken), body: JSON.stringify({ channelId, productId: 'forbidden' }),
    });
    assert.equal(unauthorizedApproval.status, 403);
    assert.deepEqual(await store.approved(channelId), ['kb1']);

    const afterApproval = await getDiscovery();
    const approvedKeyboard = afterApproval.items.find((item) => item.id === 'kb1');
    assert.equal(approvedKeyboard?.provenance, 'creator_approved');
    assert.ok(afterApproval.items.some((item) => item.id !== 'kb1' && item.provenance === 'ai_discovered'));

    const mismatchedSave = await fetch(`${base}/v1/viewer/intent`, {
      method: 'POST', headers: authHeaders(viewerToken), body: JSON.stringify({ channelId: 'forged-channel', productId: 'kb1', action: 'save' }),
    });
    assert.equal(mismatchedSave.status, 403);
    assert.deepEqual(await store.metrics(channelId), {});

    for (let action = 1; action <= 4; action += 1) {
      const save = await fetch(`${base}/v1/viewer/intent`, {
        method: 'POST', headers: authHeaders(viewerToken), body: JSON.stringify({ channelId, productId: 'kb1', action: 'save' }),
      });
      assert.equal(save.status, 201);
      assert.equal((await save.json() as { cohortVisible: boolean }).cohortVisible, false);
    }
    const afterFourSaves = await getDiscovery();
    const keyboardAfterFour = afterFourSaves.items.find((item) => item.id === 'kb1');
    assert.deepEqual(keyboardAfterFour?.aggregateIntent, { view: 0, save: 0 });
    assert.deepEqual(afterFourSaves.items.map((item) => item.id), afterApproval.items.map((item) => item.id));

    const fifthSave = await fetch(`${base}/v1/viewer/intent`, {
      method: 'POST', headers: authHeaders(viewerToken), body: JSON.stringify({ channelId, productId: 'kb1', action: 'save' }),
    });
    assert.equal(fifthSave.status, 201);
    assert.equal((await fifthSave.json() as { cohortVisible: boolean }).cohortVisible, true);
    const afterFiveSaves = await getDiscovery();
    const keyboardAfterFive = afterFiveSaves.items.find((item) => item.id === 'kb1');
    assert.equal(keyboardAfterFive?.provenance, 'creator_approved');
    assert.deepEqual(keyboardAfterFive?.aggregateIntent, { view: 0, save: 5 });
  }, { demoMode: false, extensionSecret });
});

test('catalogue browse is collection-scoped and short searches fail safely', () => withApi(async (base) => {
  const browse = await fetch(`${base}/v1/catalogue/browse?channelId=demo`);
  assert.equal(browse.status, 200);
  const payload = await browse.json() as { collectionName: string; source: string; items: unknown[]; nextPageToken: string | null };
  assert.equal(payload.collectionName, 'Twitch');
  assert.equal(payload.source, 'demo_fixture');
  assert.ok(payload.items.length > 0);
  assert.equal(payload.nextPageToken, null);
  const invalidPageToken = await fetch(`${base}/v1/catalogue/browse?channelId=demo&pageToken=${'x'.repeat(4097)}`);
  assert.equal(invalidPageToken.status, 400);
  for (const query of ['', 'a', ' ']) {
    const response = await fetch(`${base}/v1/catalogue/search?q=${encodeURIComponent(query)}&channelId=demo`);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'invalid_request' });
  }
}));

test('catalogue SafeSearch preference is per request and rejects invalid values', () => withApi(async (base) => {
  for (const setting of ['false', 'true', 'false']) {
    const response = await fetch(`${base}/v1/catalogue/browse?channelId=demo&safeSearch=${setting}`);
    assert.equal(response.status, 200);
    assert.equal((await response.json() as { safeSearch: boolean }).safeSearch, setting === 'true');
  }
  const invalid = await fetch(`${base}/v1/catalogue/browse?channelId=demo&safeSearch=maybe`);
  assert.equal(invalid.status, 400);
}));

test('CORS exposes responses only to configured browser origins', () => withApi(async (base) => {
  const allowed = await fetch(`${base}/health`, { headers: { origin: 'http://localhost:5173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  const denied = await fetch(`${base}/health`, { headers: { origin: 'https://evil.invalid' } });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
}));

test('live creator JWT is bound to its verified channel claim', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'streamcart-live-'));
  const store = new Store(path.join(directory, 'data.json'));
  const extensionSecret = Buffer.from('streamcart-test-extension-secret-32').toString('base64');
  const server = http.createServer(createApp(store, { demoMode: false, extensionSecret }));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); assert(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}`;
  const token = jwt.sign({ role: 'broadcaster', channel_id: 'channel-a', exp: Math.floor(Date.now() / 1000) + 60 }, Buffer.from(extensionSecret, 'base64'), { algorithm: 'HS256' });
  const viewerToken = jwt.sign({ role: 'viewer', channel_id: 'channel-a', exp: Math.floor(Date.now() / 1000) + 60 }, Buffer.from(extensionSecret, 'base64'), { algorithm: 'HS256' });
  try {
    const response = await fetch(`${base}/v1/creator/products`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-extension-jwt': token }, body: JSON.stringify({ channelId: 'channel-b', productId: 'kb1' }) });
    assert.equal(response.status, 201);
    assert.deepEqual(store.approved('channel-a'), ['kb1']);
    assert.deepEqual(store.approved('channel-b'), []);
    const viewerApproval = await fetch(`${base}/v1/creator/products`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-extension-jwt': viewerToken }, body: JSON.stringify({ channelId: 'channel-a', productId: 'forbidden' }) });
    assert.equal(viewerApproval.status, 403);
    assert.deepEqual(store.approved('channel-a'), ['kb1']);
    const removed = await fetch(`${base}/v1/creator/products/kb1`, { method: 'DELETE', headers: { 'x-extension-jwt': token } });
    assert.equal(removed.status, 204);
    assert.deepEqual(store.approved('channel-a'), []);
    const mismatch = await fetch(`${base}/v1/viewer/intent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-extension-jwt': viewerToken }, body: JSON.stringify({ channelId: 'channel-b', productId: 'kb1', action: 'save' }) });
    assert.equal(mismatch.status, 403);
    assert.deepEqual(store.metrics('channel-a'), {});
    assert.deepEqual(store.metrics('channel-b'), {});
  } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); fs.rmSync(directory, { recursive: true }); }
});

test('production configuration rejects demo mode', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', '-e', "import('./src/config.ts')"], {
    cwd: path.resolve(import.meta.dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DEMO_MODE: 'true',
      CHANNEL3_API_KEY: 'test-only',
      TWITCH_EXTENSION_SECRET: '0123456789abcdef',
      TWITCH_WEBHOOK_SECRET: '0123456789abcdef',
      ALLOWED_ORIGINS: 'https://extension.example',
      PRODUCT_URL_HOSTS: 'example.com',
      IMAGE_URL_HOSTS: 'images.example.com',
    },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsafe production configuration: DEMO_MODE=false/);
});

test('production configuration requires a curated Channel3 collection', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', '-e', "import('./src/config.ts')"], {
    cwd: path.resolve(import.meta.dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DEMO_MODE: 'false',
      CHANNEL3_API_KEY: 'test-only',
      CHANNEL3_COLLECTION_ID: '',
      TWITCH_EXTENSION_SECRET: '0123456789abcdef',
      TWITCH_WEBHOOK_SECRET: '0123456789abcdef',
      ALLOWED_ORIGINS: 'https://extension.example',
      PRODUCT_URL_HOSTS: 'buy.trychannel3.com',
      IMAGE_URL_HOSTS: 'cdn.trychannel3.com',
    },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsafe production configuration: CHANNEL3_COLLECTION_ID/);
});

test('development configuration accepts empty optional Twitch placeholders', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', '-e', "import('./src/config.ts')"], {
    cwd: path.resolve(import.meta.dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'development', DEMO_MODE: 'false', TWITCH_EXTENSION_SECRET: '', TWITCH_WEBHOOK_SECRET: '' },
  });
  assert.equal(result.status, 0, result.stderr);
});

test('store selection prefers Postgres over Vercel Blob and local files', () => {
  const previous = { database: process.env.DATABASE_URL, blob: process.env.BLOB_STORE_ID, token: process.env.BLOB_READ_WRITE_TOKEN };
  try {
    process.env.DATABASE_URL = 'postgresql://streamcart:local-test@127.0.0.1:5432/streamcart';
    process.env.BLOB_STORE_ID = 'store_test';
    assert.ok(createStore() instanceof PostgresStore);
    delete process.env.DATABASE_URL;
    assert.ok(createStore() instanceof BlobStore);
    delete process.env.BLOB_STORE_ID;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    assert.ok(createStore() instanceof Store);
  } finally {
    if (previous.database === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous.database;
    if (previous.blob === undefined) delete process.env.BLOB_STORE_ID; else process.env.BLOB_STORE_ID = previous.blob;
    if (previous.token === undefined) delete process.env.BLOB_READ_WRITE_TOKEN; else process.env.BLOB_READ_WRITE_TOKEN = previous.token;
  }
});
