import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'false';
process.env.CHANNEL3_API_KEY = 'test-channel3-key';
process.env.CHANNEL3_COLLECTION_ID = 'test-twitch-collection';
process.env.IMAGE_URL_HOSTS = 'images.example.test';
process.env.PRODUCT_URL_HOSTS = 'buy.example.test';

const { Channel3ResponseTooLargeError, MAX_CACHED_PAGES, MAX_CACHED_PAGE_ENTRY_BYTES, MAX_CHANNEL3_RESPONSE_BYTES, searchProductsPage } = await import('../src/channel3.js');

const emptyPage = () => new Response(JSON.stringify({ products: [], next_page_token: null }), { status: 200, headers: { 'content-type': 'application/json' } });

test('catalogue page cache evicts older keys after reaching its entry limit', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => { calls += 1; return emptyPage(); }) as typeof fetch;

  try {
    await searchProductsPage('cache eviction sentinel', true);
    for (let index = 0; index <= MAX_CACHED_PAGES; index += 1) {
      await searchProductsPage(`cache eviction query ${index}`, true);
    }
    const callsBeforeRepeat = calls;
    await searchProductsPage('cache eviction sentinel', true);
    assert.equal(calls, callsBeforeRepeat + 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('concurrent identical catalogue misses share one Channel3 request', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  let release!: (response: Response) => void;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Promise<Response>((resolve) => { release = resolve; });
  }) as typeof fetch;

  try {
    const first = searchProductsPage('coalesced catalogue query', true);
    const second = searchProductsPage('coalesced catalogue query', true);
    assert.equal(calls, 1);
    release(emptyPage());
    const [firstPage, secondPage] = await Promise.all([first, second]);
    assert.deepEqual(firstPage, secondPage);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('oversized pages are returned but not retained in the cache', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  const description = 'x'.repeat(MAX_CACHED_PAGE_ENTRY_BYTES);
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response(JSON.stringify({
      products: [{
        id: 'large-product',
        title: 'Large product record',
        description,
        images: [{ url: 'https://images.example.test/large.jpg' }],
        offers: [{ availability: 'InStock', url: 'https://buy.example.test/large', price: { price: 99, currency: 'USD' } }],
      }],
      next_page_token: null,
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  try {
    const first = await searchProductsPage('large product query', true);
    assert.equal(first.items[0]?.id, 'large-product');
    const second = await searchProductsPage('large product query', true);
    assert.equal(second.items[0]?.id, 'large-product');
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('oversized upstream bodies are cancelled before the full response is buffered', async () => {
  const originalFetch = globalThis.fetch;
  let cancelled = false;
  globalThis.fetch = (async () => {
    const chunk = new Uint8Array(64 * 1024).fill(0x20);
    const body = new ReadableStream<Uint8Array>({
      pull(controller) { controller.enqueue(chunk); },
      cancel() { cancelled = true; },
    });
    return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  try {
    await assert.rejects(searchProductsPage('oversized body query', true), Channel3ResponseTooLargeError);
    assert.equal(cancelled, true);
    assert.ok(MAX_CHANNEL3_RESPONSE_BYTES > MAX_CACHED_PAGE_ENTRY_BYTES);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
