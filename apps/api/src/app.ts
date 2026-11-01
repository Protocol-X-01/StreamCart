import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { browseCollection, searchProducts } from './channel3.js';
import { config } from './config.js';
import { rank } from './discovery.js';
import { eventSub, extensionAuth } from './security.js';
import { createStore, type StorePort } from './store.js';

type AppOptions = { eventSubSecret?: string; extensionSecret?: string; demoMode?: boolean };
const intentSchema = z.object({ channelId: z.string().min(1).max(80), productId: z.string().min(1).max(160), action: z.enum(['view', 'save']) });
function fixedWindowLimiter(limit: number, windowMs: number): express.RequestHandler {
  const buckets = new Map<string, { count: number; until: number }>();
  return (request, response, next) => {
    const key = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    if (buckets.size >= 10_000) {
      for (const [source, value] of buckets) if (value.until <= now) buckets.delete(source);
      if (buckets.size >= 10_000 && !buckets.has(key)) buckets.delete(buckets.keys().next().value ?? '');
    }
    const bucket = buckets.get(key);
    if (!bucket || bucket.until <= now) { buckets.set(key, { count: 1, until: now + windowMs }); return next(); }
    if (bucket.count >= limit) return response.status(429).json({ error: 'rate_limited' });
    bucket.count += 1;
    next();
  };
}

export function createApp(store: StorePort = createStore(), options: AppOptions = {}) {
  const app = express();
  const demoMode = options.demoMode ?? config.DEMO_MODE;
  const seenEventIds = new Map<string, number>();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin(origin, callback) { callback(null, !origin || config.ALLOWED_ORIGINS.includes(origin)); } }));
  app.post('/v1/twitch/eventsub', express.raw({ type: 'application/json', limit: '64kb' }), async (request, response) => {
    const headers = Object.fromEntries(Object.entries(request.headers).map(([key, value]) => [key, Array.isArray(value) ? value[0] ?? '' : String(value ?? '')]));
    const raw = Buffer.isBuffer(request.body) ? request.body : Buffer.from(request.body ?? '');
    if (!eventSub(headers, raw, options.eventSubSecret)) return response.status(403).json({ error: 'invalid_eventsub_signature' });
    const messageId = headers['twitch-eventsub-message-id'];
    const now = Date.now();
    for (const [id, receivedAt] of seenEventIds) if (now - receivedAt >= 600_000) seenEventIds.delete(id);
    if (seenEventIds.has(messageId)) return response.sendStatus(204);
    seenEventIds.set(messageId, now);
    if (seenEventIds.size > 10_000) seenEventIds.delete(seenEventIds.keys().next().value ?? '');
    const payload = z.object({ challenge: z.string().optional(), subscription: z.object({ type: z.string() }).optional(), event: z.object({ broadcaster_user_id: z.string(), chatter_user_id: z.string(), message: z.object({ text: z.string() }) }).optional() }).parse(JSON.parse(raw.toString('utf8')));
    const messageType = headers['twitch-eventsub-message-type'];
    if (messageType === 'webhook_callback_verification' && payload.challenge) return response.type('text/plain').send(payload.challenge);
    const event = payload.event;
    if (messageType === 'notification' && payload.subscription?.type === 'channel.chat.message' && event && event.chatter_user_id === event.broadcaster_user_id) {
      const topic = event.message.text.match(/^!gear\s+(.{2,80})\s*$/i)?.[1];
      if (topic) await store.setTopic(event.broadcaster_user_id, topic.trim());
    }
    return response.sendStatus(204);
  });
  app.use(express.json({ limit: '64kb' }));
  app.get('/health', (_request, response) => response.json({ ok: true, mode: demoMode ? 'demo' : 'live', safeSearch: config.SAFE_SEARCH }));
  app.get('/v1/channels/:id/discovery', async (request, response, next) => { try { const channelId = String(request.params.id), topic = await store.topic(channelId); response.json({ channelId, topic, items: rank(await searchProducts(topic), topic, await store.approved(channelId), await store.metrics(channelId)) }); } catch (error) { next(error); } });
  app.get('/v1/catalogue/browse', async (request, response, next) => { try { const channelId = z.string().max(80).default('demo').parse(request.query.channelId); response.json({ channelId, topic: `${config.CHANNEL3_COLLECTION_NAME} collection`, collectionName: config.CHANNEL3_COLLECTION_NAME, source: demoMode ? 'demo_fixture' : 'channel3_api', items: rank(await browseCollection(), '', await store.approved(channelId), await store.metrics(channelId)) }); } catch (error) { next(error); } });
  app.get('/v1/catalogue/search', async (request, response, next) => { try { const term = z.string().trim().min(2).max(120).parse(request.query.q); const channelId = z.string().max(80).default('demo').parse(request.query.channelId); response.json({ channelId, topic: term, collectionName: config.CHANNEL3_COLLECTION_NAME, source: demoMode ? 'demo_fixture' : 'channel3_api', items: rank(await searchProducts(term), term, await store.approved(channelId), await store.metrics(channelId)) }); } catch (error) { next(error); } });
  const creatorAuth = extensionAuth({ roles: ['broadcaster'], demoMode, secret: options.extensionSecret });
  const viewerAuth = extensionAuth({ roles: ['viewer', 'broadcaster'], demoMode, secret: options.extensionSecret });
  app.post('/v1/creator/products', creatorAuth, async (request, response) => { const productId = z.string().min(1).max(160).parse(request.body.productId); await store.approve(response.locals.channelId, productId); response.status(201).json({ ok: true }); });
  app.delete('/v1/creator/products/:id', creatorAuth, async (request, response) => { await store.unapprove(response.locals.channelId, String(request.params.id)); response.status(204).send(); });
  app.post('/v1/viewer/intent', fixedWindowLimiter(30, 60_000), viewerAuth, async (request, response, next) => {
    try {
      const input = intentSchema.parse(request.body);
      const channelId = response.locals.channelId as string;
      if (!demoMode && input.channelId !== channelId) return response.status(403).json({ error: 'channel_mismatch' });
      const products = await searchProducts(await store.topic(channelId));
      if (!products.some((product) => product.id === input.productId)) return response.status(404).json({ error: 'unknown_product' });
      const aggregate = await store.recordIntent(channelId, input.productId, input.action);
      response.status(201).json({ ok: true, recorded: true, cohortVisible: aggregate.view >= 5 || aggregate.save >= 5 });
    } catch (error) { next(error); }
  });
  app.post('/v1/demo/channels/:id/trigger', async (request, response) => { if (!demoMode) return response.sendStatus(404); const input = z.object({ topic: z.string().min(2).max(80) }).parse(request.body); await store.setTopic(String(request.params.id), input.topic); response.json({ ok: true }); });
  app.use((error: unknown, _request: unknown, response: express.Response, _next: unknown) => response.status(error instanceof z.ZodError ? 400 : 500).json({ error: error instanceof z.ZodError ? 'invalid_request' : 'internal_error' }));
  return app;
}
