import fs from 'node:fs/promises';
import { config } from './config.js';
import { enforceCataloguePolicy } from './policy.js';
import type { Product } from './types.js';

let fixture: Product[];
type ProductPage = { items: Product[]; nextPageToken: string | null };
const cache = new Map<string, { until: number; data: Product[]; nextPageToken: string | null }>();
function allowedUrl(value: unknown, hosts: string[]) {
  try {
    const url = new URL(String(value ?? ''));
    const hostAllowed = hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && hostAllowed ? url.toString() : '';
  } catch { return ''; }
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
  const controller = new AbortController();
  // Collection browse is materially slower than contextual search in Channel3.
  // Keep search snappy while allowing the bounded catalogue request to finish.
  const timer = setTimeout(() => controller.abort(), path === '/v1/browse' ? 15_000 : 7_000);
  try {
    const response = await fetch(new URL(path, config.CHANNEL3_BASE_URL), { method: 'POST', headers: { 'x-api-key': config.CHANNEL3_API_KEY!, 'content-type': 'application/json', 'x-user-id': 'streamcart-aggregate' }, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok) throw new Error(`Channel3 request failed (${response.status})`);
    const payload: any = await response.json();
    return {
      items: (payload.products ?? []).map(normalize).filter((item: Product | null): item is Product => item !== null),
      nextPageToken: typeof payload.next_page_token === 'string' && payload.next_page_token.length ? payload.next_page_token : null,
    };
  } finally { clearTimeout(timer); }
}
function baseConfig() {
  return { country: config.CHANNEL3_COUNTRY, language: config.CHANNEL3_LANGUAGE, currency: config.CHANNEL3_CURRENCY, ...(config.CHANNEL3_COLLECTION_ID ? { collection_id: config.CHANNEL3_COLLECTION_ID } : {}) };
}
function policy(data: Product[], safeSearch: boolean) { return enforceCataloguePolicy(data, safeSearch); }

function cachedPage(key: string): ProductPage | undefined {
  const hit = cache.get(key);
  return hit && hit.until > Date.now() ? { items: hit.data, nextPageToken: hit.nextPageToken } : undefined;
}
function savePage(key: string, page: ProductPage) {
  cache.set(key, { until: Date.now() + 900_000, data: page.items, nextPageToken: page.nextPageToken });
  return page;
}

export async function searchProductsPage(query: string, safeSearch = config.SAFE_SEARCH, pageToken?: string): Promise<ProductPage> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return { items: [], nextPageToken: null };
  const key = `search:${config.CHANNEL3_COLLECTION_ID ?? 'all'}:${safeSearch}:${normalizedQuery.toLowerCase()}:${pageToken ?? 'first'}`;
  const hit = cachedPage(key);
  if (hit) return hit;
  let page: ProductPage;
  if (config.DEMO_MODE || !config.CHANNEL3_API_KEY) {
    page = { items: await fixtureProducts(), nextPageToken: null };
  } else {
    page = await channel3Products('/v1/search', { query: normalizedQuery, limit: 20, filters: { availability: ['InStock', 'LimitedAvailability'] }, config: baseConfig(), ...(pageToken ? { page_token: pageToken } : {}) });
  }
  page.items = policy(page.items, safeSearch);
  return savePage(key, page);
}

export async function searchProducts(query: string, safeSearch = config.SAFE_SEARCH) {
  return (await searchProductsPage(query, safeSearch)).items;
}

export async function browseCollectionPage(safeSearch = config.SAFE_SEARCH, pageToken?: string): Promise<ProductPage> {
  const key = `browse:${config.CHANNEL3_COLLECTION_ID ?? 'demo'}:${safeSearch}:${pageToken ?? 'first'}`;
  const hit = cachedPage(key);
  if (hit) return hit;
  let page: ProductPage;
  if (config.DEMO_MODE || !config.CHANNEL3_API_KEY) {
    page = { items: await fixtureProducts(), nextPageToken: null };
  } else {
    page = await channel3Products('/v1/browse', { limit: 30, filters: { availability: ['InStock', 'LimitedAvailability'] }, config: baseConfig(), ...(pageToken ? { page_token: pageToken } : {}) });
  }
  page.items = policy(page.items, safeSearch);
  return savePage(key, page);
}

export async function browseCollection(safeSearch = config.SAFE_SEARCH) {
  return (await browseCollectionPage(safeSearch)).items;
}
