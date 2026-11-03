import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'false';
process.env.CHANNEL3_API_KEY = 'test-channel3-key';
process.env.CHANNEL3_COLLECTION_ID = 'test-twitch-collection';
process.env.IMAGE_URL_HOSTS = 'images.example.test';
process.env.PRODUCT_URL_HOSTS = 'buy.example.test';

const originalNow = Date.now;
let mockNow = originalNow();
Date.now = () => mockNow;
const { Channel3CapacityError, MAX_CHANNEL3_REQUESTS_PER_MINUTE, MAX_CONCURRENT_CHANNEL3_REQUESTS, searchProductsPage } = await import('../src/channel3.js');

test('Channel3 upstream work has per-process request and concurrency budgets', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  const deferred: Array<(response: Response) => void> = [];
  let holdResponses = true;
  globalThis.fetch = (async () => {
    calls += 1;
    if (holdResponses) return new Promise<Response>((resolve) => { deferred.push(resolve); });
    return new Response(JSON.stringify({ products: [], next_page_token: null }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  try {
    const concurrent = Array.from({ length: MAX_CONCURRENT_CHANNEL3_REQUESTS + 1 }, (_, index) => searchProductsPage(`concurrency budget ${index}`, true));
    assert.equal(calls, MAX_CONCURRENT_CHANNEL3_REQUESTS);
    await assert.rejects(concurrent[MAX_CONCURRENT_CHANNEL3_REQUESTS], Channel3CapacityError);
    for (const resolve of deferred) resolve(new Response(JSON.stringify({ products: [], next_page_token: null }), { status: 200, headers: { 'content-type': 'application/json' } }));
    await Promise.all(concurrent.slice(0, MAX_CONCURRENT_CHANNEL3_REQUESTS));

    holdResponses = false;
    for (let index = MAX_CONCURRENT_CHANNEL3_REQUESTS; index < MAX_CHANNEL3_REQUESTS_PER_MINUTE; index += 1) {
      await searchProductsPage(`request budget ${index}`, true);
    }
    assert.equal(calls, MAX_CHANNEL3_REQUESTS_PER_MINUTE);
    await assert.rejects(searchProductsPage('request budget exceeded', true), Channel3CapacityError);
    assert.equal(calls, MAX_CHANNEL3_REQUESTS_PER_MINUTE);

    mockNow += 60_001;
    await searchProductsPage('request budget reset', true);
    assert.equal(calls, MAX_CHANNEL3_REQUESTS_PER_MINUTE + 1);
  } finally {
    for (const resolve of deferred) resolve(new Response(JSON.stringify({ products: [], next_page_token: null }), { status: 200, headers: { 'content-type': 'application/json' } }));
    globalThis.fetch = originalFetch;
    Date.now = originalNow;
  }
});
