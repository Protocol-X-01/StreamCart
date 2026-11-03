import fs from 'node:fs/promises';
import { config } from './config.js';
import { enforceCataloguePolicy } from './policy.js';
import type { Product } from './types.js';

let fixture: Product[];
type ProductPage = { items: Product[]; nextPageToken: string | null };
type CachedPage = { until: number; data: Product[]; nextPageToken: string | null; bytes: number };
export const MAX_CACHED_PAGES = 128;
export const MAX_CACHED_PAGE_BYTES = 16 * 1024 * 1024;
export const MAX_CACHED_PAGE_ENTRY_BYTES = 1024 * 1024;
export const MAX_CHANNEL3_REQUESTS_PER_MINUTE = 300;
export const MAX_CONCURRENT_CHANNEL3_REQUESTS = 8;
export const MAX_CHANNEL3_RESPONSE_BYTES = 2 * 1024 * 1024;
const PAGE_CACHE_TTL_MS = 900_000;
const cache = new Map<string, CachedPage>();
const inFlight = new Map<string, Promise<ProductPage>>();
let cacheBytes = 0;
let providerWindowStarted = Date.now();
let providerRequests = 0;
let activeProviderRequests = 0;

export class Channel3CapacityError extends Error {
  constructor() {
    super('channel3_capacity_limited');
    this.name = 'Channel3CapacityError';
  }
}

export class Channel3ResponseTooLargeError extends Error {
  constructor() {
    super('channel3_response_too_large');
    this.name = 'Channel3ResponseTooLargeError';
  }
}

function reserveChannel3Capacity() {
  const now = Date.now();
  if (now - providerWindowStarted >= 60_000) {
    providerWindowStarted = now;
    providerRequests = 0;
  }
  if (providerRequests >= MAX_CHANNEL3_REQUESTS_PER_MINUTE || activeProviderRequests >= MAX_CONCURRENT_CHANNEL3_REQUESTS) {
    throw new Channel3CapacityError();
  }
  providerRequests += 1;
  activeProviderRequests += 1;
  return () => { activeProviderRequests -= 1; };
}

function allowedUrl(value: unknown, hosts: string[]) {
  try {
    const url = new URL(String(value ?? ''));
    const hostAllowed = hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && hostAllowed ? url.toString() : '';
  } catch { return ''; }
}

async function readLimitedJson(response: Response): Promise<any> {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_CHANNEL3_RESPONSE_BYTES) {
    await response.body?.cancel().catch(() => undefined);
    throw new Channel3ResponseTooLargeError();
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Channel3 response body is empty');
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_CHANNEL3_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new Channel3ResponseTooLargeError();
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks, totalBytes).toString('utf8'));
}
function normalize(input: any): Product | null {
  const offer = input.offers?.find((value: any) => value.availability === 'InStock') ?? input.offers?.[0] ?? {};
  const id = String(input.id ?? input.product_id ?? '');
  const title = String(input.title ?? '');
  const imageUrl = allowedUrl(input.images?.[0]?.cleaned_url ?? input.images?.[0]?.url ?? input.image_url ?? input.imageUrl, config.IMAGE_URL_HOSTS);
  const productUrl = allowedUrl(offer.url ?? input.url ?? input.productUrl, config.PRODUCT_URL_HOSTS);
  const brands = (Array.isArray(input.brands) ? input.brands : [input.brand]).map((brand: any) => String(brand?.name ?? brand?.title ?? brand ?? '').trim()).filter(Boolean);
  if (!id || !title || !imageUrl || !productUrl) return null;
  return {
    id,
    title,
    description: String(input.description ?? ''),
    imageUrl,
    productUrl,
    price: Number(offer.price?.price ?? offer.price?.amount ?? offer.price ?? input.price ?? 0),
    currency: String(offer.price?.currency ?? input.currency ?? config.CHANNEL3_CURRENCY),
    available: typeof input.available === 'boolean' ? input.available : !['SoldOut', 'OutOfStock'].includes(offer.availability),
    tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
    quality: Number.isFinite(Number(input.quality)) ? Number(input.quality) : .8,
    brand: brands[0] ?? '',
    brands,
    category: String(input.category?.title ?? input.category?.slug ?? input.category ?? ''),
    age: input.age,
  };
}
async function fixtureProducts() {
  fixture ??= JSON.parse(await fs.readFile(new URL('../../../fixtures/products.json', import.meta.url), 'utf8'));
  return fixture.map(normalize).filter((item): item is Product => item !== null);
}
async function channel3Products(path: '/v1/search' | '/v1/browse', body: object): Promise<ProductPage> {
  const releaseCapacity = reserveChannel3Capacity();
  const controller = new AbortController();
  // Collection browse is materially slower than contextual search in Channel3.
  // Keep search snappy while allowing the bounded catalogue request to finish.
  const timer = setTimeout(() => controller.abort(), path === '/v1/browse' ? 15_000 : 7_000);
  try {
    const response = await fetch(new URL(path, config.CHANNEL3_BASE_URL), { method: 'POST', headers: { 'x-api-key': config.CHANNEL3_API_KEY!, 'content-type': 'application/json', 'x-user-id': 'streamcart-aggregate' }, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok) throw new Error(`Channel3 request failed (${response.status})`);
    const payload: any = await readLimitedJson(response);
    return {
      items: (payload.products ?? []).map(normalize).filter((item: Product | null): item is Product => item !== null),
      nextPageToken: typeof payload.next_page_token === 'string' && payload.next_page_token.length ? payload.next_page_token : null,
    };
  } finally { clearTimeout(timer); releaseCapacity(); }
}
function baseConfig() {
  return { country: config.CHANNEL3_COUNTRY, language: config.CHANNEL3_LANGUAGE, currency: config.CHANNEL3_CURRENCY, ...(config.CHANNEL3_COLLECTION_ID ? { collection_id: config.CHANNEL3_COLLECTION_ID } : {}) };
}
function policy(data: Product[], safeSearch: boolean) { return enforceCataloguePolicy(data, safeSearch); }

function pruneExpiredPages(now = Date.now()) {
  for (const [key, entry] of cache) {
    if (entry.until <= now) {
      cache.delete(key);
      cacheBytes -= entry.bytes;
    }
  }
}

function cachedPage(key: string): ProductPage | undefined {
  pruneExpiredPages();
  const hit = cache.get(key);
  if (!hit) return undefined;
  cache.delete(key);
  cache.set(key, hit);
  return { items: hit.data, nextPageToken: hit.nextPageToken };
}

function savePage(key: string, page: ProductPage) {
  pruneExpiredPages();
  const bytes = Buffer.byteLength(JSON.stringify({ items: page.items, nextPageToken: page.nextPageToken }), 'utf8');
  if (bytes > MAX_CACHED_PAGE_ENTRY_BYTES) return page;

  const previous = cache.get(key);
  if (previous) {
    cache.delete(key);
    cacheBytes -= previous.bytes;
  }
  while (cache.size >= MAX_CACHED_PAGES || cacheBytes + bytes > MAX_CACHED_PAGE_BYTES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    const oldest = cache.get(oldestKey);
    cache.delete(oldestKey);
    if (oldest) cacheBytes -= oldest.bytes;
  }
  cache.set(key, { until: Date.now() + PAGE_CACHE_TTL_MS, data: page.items, nextPageToken: page.nextPageToken, bytes });
  cacheBytes += bytes;
  return page;
}

async function cachedPageOrFetch(key: string, fetchPage: () => Promise<ProductPage>): Promise<ProductPage> {
  const hit = cachedPage(key);
  if (hit) return hit;
  const pending = inFlight.get(key);
  if (pending) return pending;
  if (inFlight.size >= MAX_CONCURRENT_CHANNEL3_REQUESTS) throw new Channel3CapacityError();

  const request = fetchPage().then((page) => savePage(key, page));
  inFlight.set(key, request);
  try { return await request; }
  finally { if (inFlight.get(key) === request) inFlight.delete(key); }
}

export async function searchProductsPage(query: string, safeSearch = config.SAFE_SEARCH, pageToken?: string): Promise<ProductPage> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return { items: [], nextPageToken: null };
  const key = `search:${config.CHANNEL3_COLLECTION_ID ?? 'all'}:${safeSearch}:${normalizedQuery.toLowerCase()}:${pageToken ?? 'first'}`;
  return cachedPageOrFetch(key, async () => {
    let page: ProductPage;
    if (config.DEMO_MODE || !config.CHANNEL3_API_KEY) {
      page = { items: await fixtureProducts(), nextPageToken: null };
    } else {
      page = await channel3Products('/v1/search', { query: normalizedQuery, limit: 20, filters: { availability: ['InStock', 'LimitedAvailability'] }, config: baseConfig(), ...(pageToken ? { page_token: pageToken } : {}) });
    }
    page.items = policy(page.items, safeSearch);
    return page;
  });
}

export async function searchProducts(query: string, safeSearch = config.SAFE_SEARCH) {
  return (await searchProductsPage(query, safeSearch)).items;
}

export async function browseCollectionPage(safeSearch = config.SAFE_SEARCH, pageToken?: string): Promise<ProductPage> {
  const key = `browse:${config.CHANNEL3_COLLECTION_ID ?? 'demo'}:${safeSearch}:${pageToken ?? 'first'}`;
  return cachedPageOrFetch(key, async () => {
    let page: ProductPage;
    if (config.DEMO_MODE || !config.CHANNEL3_API_KEY) {
      page = { items: await fixtureProducts(), nextPageToken: null };
    } else {
      page = await channel3Products('/v1/browse', { limit: 30, filters: { availability: ['InStock', 'LimitedAvailability'] }, config: baseConfig(), ...(pageToken ? { page_token: pageToken } : {}) });
    }
    page.items = policy(page.items, safeSearch);
    return page;
  });
}

export async function browseCollection(safeSearch = config.SAFE_SEARCH) {
  return (await browseCollectionPage(safeSearch)).items;
}
