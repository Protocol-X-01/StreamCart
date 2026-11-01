import jwt from 'jsonwebtoken';

const origin = process.env.SMOKE_ORIGIN;
const secret = process.env.TWITCH_EXTENSION_SECRET;
if (!origin || !secret) throw new Error('SMOKE_ORIGIN and TWITCH_EXTENSION_SECRET are required');
const channelId = 'streamcart-validation';
const token = jwt.sign({ role: 'broadcaster', channel_id: channelId, opaque_user_id: 'Uvalidation', exp: Math.floor(Date.now() / 1000) + 300 }, Buffer.from(secret, 'base64'), { algorithm: 'HS256' });
const headers = { 'content-type': 'application/json', 'x-extension-jwt': token };
const request = async (pathname, options = {}) => {
  const response = await fetch(new URL(pathname, origin), options);
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${pathname} failed (${response.status})`);
  return body;
};

const first = await request(`/v1/channels/${channelId}/discovery`);
const product = first.items?.[0];
if (!product?.id) throw new Error('No discovery product returned');
await request('/v1/creator/products', { method: 'POST', headers, body: JSON.stringify({ productId: product.id }) });
for (let index = 0; index < 5; index += 1) {
  await request('/v1/viewer/intent', { method: 'POST', headers, body: JSON.stringify({ channelId, productId: product.id, action: 'save' }) });
}
const verified = await request(`/v1/channels/${channelId}/discovery`);
const persisted = verified.items.find((item) => item.id === product.id);
console.log(JSON.stringify({
  ok: persisted?.provenance === 'creator_approved' && persisted?.aggregateIntent?.save >= 5,
  channelId, productId: product.id, provenance: persisted?.provenance,
  aggregateSave: persisted?.aggregateIntent?.save, itemCount: verified.items.length,
}));
