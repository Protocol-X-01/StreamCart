const key = process.env.CHANNEL3_API_KEY;
if (!key) throw Error('CHANNEL3_API_KEY required');
const body = { query: process.argv.slice(2).join(' ') || 'mechanical keyboard', limit: 3, filters: { availability: ['InStock'] }, config: { country: 'US', language: 'en', currency: 'USD' } };
if (process.env.CHANNEL3_COLLECTION_ID) body.config.collection_id = process.env.CHANNEL3_COLLECTION_ID;
const response = await fetch('https://api.trychannel3.com/v1/search', { method: 'POST', headers: { 'x-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(body) });
let payload;
try { payload = await response.json(); } catch { payload = null; }
const products = Array.isArray(payload?.products) ? payload.products : Array.isArray(payload?.results) ? payload.results : Array.isArray(payload?.data) ? payload.data : [];
const hostname = (value) => { try { return new URL(String(value ?? '')).hostname; } catch { return ''; } };
const productHosts = [...new Set(products.flatMap((product) => (product.offers ?? []).map((offer) => hostname(offer.url)).concat(hostname(product.url))).filter(Boolean))];
const imageHosts = [...new Set(products.flatMap((product) => (product.images ?? []).map((image) => hostname(image.cleaned_url ?? image.url))).filter(Boolean))];
console.log(JSON.stringify({ ok: response.ok, status: response.status, productCount: products.length, productHosts, imageHosts, requestId: response.headers.get('x-request-id') ?? undefined }));
if (!response.ok) process.exitCode = 1;
