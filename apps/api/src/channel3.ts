import fs from 'node:fs/promises';
import { config } from './config.js';
import { enforceCataloguePolicy } from './policy.js';
import type { Product } from './types.js';

let fixture: Product[];
const cache = new Map<string, { until: number; data: Product[] }>();
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
async function channel3Products(path: '/v1/search' | '/v1/browse', body: object) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7_000);
  try {
    const response = await fetch(new URL(path, config.CHANNEL3_BASE_URL), { method: 'POST', headers: { 'x-api-key': config.CHANNEL3_API_KEY!, 'content-type': 'application/json', 'x-user-id': 'streamcart-aggregate' }, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok) throw new Error(`Channel3 request failed (${response.status})`);
    const payload: any = await response.json();
    return (payload.products ?? []).map(normalize).filter((item: Product | null): item is Product => item !== null);
  } finally { clearTimeout(timer); }
}
function baseConfig() {
  return { country: config.CHANNEL3_COUNTRY, language: config.CHANNEL3_LANGUAGE, currency: config.CHANNEL3_CURRENCY, ...(config.CHANNEL3_COLLECTION_ID ? { collection_id: config.CHANNEL3_COLLECTION_ID } : {}) };
}
function policy(data: Product[]) { return enforceCataloguePolicy(data, config.SAFE_SEARCH); }

export async function searchProducts(query: string) {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];
  const key = `search:${config.CHANNEL3_COLLECTION_ID ?? 'all'}:${config.SAFE_SEARCH}:${normalizedQuery.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.data;
  let data: Product[];
  if (config.DEMO_MODE || !config.CHANNEL3_API_KEY) {
    data = await fixtureProducts();
  } else {
    data = await channel3Products('/v1/search', { query: normalizedQuery, limit: 20, filters: { availability: ['InStock', 'LimitedAvailability'] }, config: baseConfig() });
  }
  data = policy(data);
  cache.set(key, { until: Date.now() + 900_000, data });
  return data;
}

export async function browseCollection() {
  const key = `browse:${config.CHANNEL3_COLLECTION_ID ?? 'demo'}:${config.SAFE_SEARCH}`;
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.data;
  const data = policy(config.DEMO_MODE || !config.CHANNEL3_API_KEY
    ? await fixtureProducts()
    : await channel3Products('/v1/browse', { limit: 30, filters: { availability: ['InStock', 'LimitedAvailability'] }, config: baseConfig() }));
  cache.set(key, { until: Date.now() + 900_000, data });
  return data;
}
