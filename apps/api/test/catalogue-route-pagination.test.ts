import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'false';
process.env.CHANNEL3_API_KEY = 'test-channel3-key';
process.env.CHANNEL3_COLLECTION_ID = 'test-twitch-collection';
process.env.IMAGE_URL_HOSTS = 'images.example.test';
process.env.PRODUCT_URL_HOSTS = 'buy.example.test';

const [{ createApp }, { Store }] = await Promise.all([
  import('../src/app.js'),
  import('../src/store.js'),
]);

test('catalogue browse route round-trips Channel3 page cursors', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<Record<string, any>> = [];
  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, any>;
    requests.push(body);
    const secondPage = body.page_token === 'route-cursor-next';
    const suffix = secondPage ? 'second' : 'first';
    return new Response(JSON.stringify({
      products: [{
        id: `product-${suffix}`,
        title: `Studio microphone ${suffix}`,
        description: 'A microphone for a creator setup',
        brands: [{ name: secondPage ? 'Studio Audio Two' : 'Studio Audio One' }],
        images: [{ url: `https://images.example.test/${suffix}.jpg` }],
        category: { title: 'Microphones', slug: 'microphones' },
        offers: [{ availability: 'InStock', url: `https://buy.example.test/${suffix}`, price: { price: 99, currency: 'USD' } }],
      }],
      next_page_token: secondPage ? null : 'route-cursor-next',
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'streamcart-pagination-'));
  const store = new Store(path.join(directory, 'data.json'));
  const server = http.createServer(createApp(store, { demoMode: false }));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');
  const localFetch = originalFetch;

  try {
    const base = `http://127.0.0.1:${address.port}/v1/catalogue/browse?channelId=demo`;
    const firstResponse = await localFetch(base);
    assert.equal(firstResponse.status, 200);
    const first = await firstResponse.json() as { items: Array<{ id: string }>; nextPageToken: string | null; source: string };
    assert.equal(first.source, 'channel3_api');
    assert.equal(first.items[0]?.id, 'product-first');
    assert.equal(first.nextPageToken, 'route-cursor-next');

    const secondResponse = await localFetch(`${base}&pageToken=${encodeURIComponent(first.nextPageToken ?? '')}`);
    assert.equal(secondResponse.status, 200);
    const second = await secondResponse.json() as { items: Array<{ id: string }>; nextPageToken: string | null };
    assert.equal(second.items[0]?.id, 'product-second');
    assert.equal(second.nextPageToken, null);
    assert.equal(requests[0].config.collection_id, 'test-twitch-collection');
    assert.equal(requests[1].page_token, 'route-cursor-next');
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
