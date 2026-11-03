import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'false';
process.env.CHANNEL3_API_KEY = 'test-channel3-key';
process.env.CHANNEL3_COLLECTION_ID = 'test-twitch-collection';
process.env.IMAGE_URL_HOSTS = 'images.example.test';
process.env.PRODUCT_URL_HOSTS = 'buy.example.test';

const { browseCollectionPage, searchProductsPage } = await import('../src/channel3.js');

test('Channel3 collection browse forwards cursors and returns the next page token', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<Record<string, any>> = [];
  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, any>;
    requests.push(body);
    return new Response(JSON.stringify({
      products: [{
        id: 'streaming-mic',
        title: 'Streaming microphone',
        description: 'A microphone for a creator setup',
        brands: [{ name: 'Studio Audio' }],
        images: [{ url: 'https://images.example.test/mic.jpg' }],
        category: { title: 'Microphones', slug: 'microphones' },
        offers: [{ availability: 'InStock', url: 'https://buy.example.test/mic', price: { price: 99, currency: 'USD' } }],
      }],
      next_page_token: body.page_token ? null : 'cursor-next',
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  try {
    const first = await browseCollectionPage(true);
    assert.equal(first.items[0]?.id, 'streaming-mic');
    assert.equal(first.nextPageToken, 'cursor-next');
    assert.equal(requests[0].config.collection_id, 'test-twitch-collection');
    assert.equal(requests[0].page_token, undefined);

    const second = await browseCollectionPage(true, first.nextPageToken ?? undefined);
    assert.equal(second.items[0]?.id, 'streaming-mic');
    assert.equal(second.nextPageToken, null);
    assert.equal(requests[1].page_token, 'cursor-next');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Channel3 contextual search forwards cursors and returns the next page token', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<Record<string, any>> = [];
  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, any>;
    requests.push(body);
    return new Response(JSON.stringify({
      products: [{
        id: 'streaming-camera',
        title: 'Streaming camera',
        description: 'A camera for a creator setup',
        brands: [{ name: 'Studio Video' }],
        images: [{ url: 'https://images.example.test/camera.jpg' }],
        category: { title: 'Cameras', slug: 'cameras' },
        offers: [{ availability: 'InStock', url: 'https://buy.example.test/camera', price: { price: 249, currency: 'USD' } }],
      }],
      next_page_token: body.page_token ? null : 'search-cursor-next',
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  try {
    const first = await searchProductsPage('streaming camera', true);
    assert.equal(first.items[0]?.id, 'streaming-camera');
    assert.equal(first.nextPageToken, 'search-cursor-next');
    assert.equal(requests[0].query, 'streaming camera');
    assert.equal(requests[0].config.collection_id, 'test-twitch-collection');
    assert.equal(requests[0].page_token, undefined);

    const second = await searchProductsPage('streaming camera', true, first.nextPageToken ?? undefined);
    assert.equal(second.items[0]?.id, 'streaming-camera');
    assert.equal(second.nextPageToken, null);
    assert.equal(requests[1].page_token, 'search-cursor-next');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
