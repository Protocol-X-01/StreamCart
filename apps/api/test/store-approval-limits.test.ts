import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { MAX_APPROVAL_CHANNELS, MAX_APPROVALS_PER_CHANNEL, Store, StoreCapacityError } from '../src/store.js';

test('creator approvals have per-channel and active-channel limits with removable capacity', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'streamcart-approval-cap-'));
  const store = new Store(path.join(directory, 'state.json'));
  try {
    for (let index = 0; index < MAX_APPROVALS_PER_CHANNEL; index += 1) store.approve('approval-limit-channel', `product-${index}`);
    assert.equal(store.approved('approval-limit-channel').length, MAX_APPROVALS_PER_CHANNEL);
    assert.doesNotThrow(() => store.approve('approval-limit-channel', 'product-0'));
    assert.throws(() => store.approve('approval-limit-channel', 'one-too-many'), (error) => error instanceof StoreCapacityError && error.code === 'approval_product_limit');
    assert.equal(store.approved('approval-limit-channel').length, MAX_APPROVALS_PER_CHANNEL);
    store.unapprove('approval-limit-channel', 'product-0');
    store.approve('approval-limit-channel', 'replacement-product');
    assert.equal(store.approved('approval-limit-channel').length, MAX_APPROVALS_PER_CHANNEL);

    const channelStore = new Store(path.join(directory, 'channel-state.json'));
    for (let index = 0; index < MAX_APPROVAL_CHANNELS - 1; index += 1) channelStore.approve(`approval-channel-${index}`, 'one-product');
    assert.throws(() => channelStore.approve('channel-over-limit', 'one-product'), (error) => error instanceof StoreCapacityError && error.code === 'approval_channel_limit');
    assert.deepEqual(channelStore.approved('channel-over-limit'), []);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('creator approval cap returns a bounded conflict response', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'streamcart-approval-route-'));
  const channelId = 'approval-route-limit';
  const file = path.join(directory, 'state.json');
  const productId = 'kb1';
  fs.writeFileSync(file, JSON.stringify({
    approved: { [channelId]: Array.from({ length: MAX_APPROVALS_PER_CHANNEL }, (_, index) => `product-${index}`) },
    topics: { [channelId]: 'mechanical keyboard' },
    metrics: {},
  }));
  const store = new Store(file);
  const extensionSecret = Buffer.from('streamcart-test-extension-secret-32').toString('base64');
  const token = jwt.sign({ role: 'broadcaster', channel_id: channelId, exp: Math.floor(Date.now() / 1000) + 60 }, Buffer.from(extensionSecret, 'base64'), { algorithm: 'HS256' });
  const server = http.createServer(createApp(store, { demoMode: false, extensionSecret }));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/creator/products`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-extension-jwt': token },
      body: JSON.stringify({ productId }),
    });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: 'approval_product_limit' });
    assert.equal(store.approved(channelId).length, MAX_APPROVALS_PER_CHANNEL);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
