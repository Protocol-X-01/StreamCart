import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { browseCollectionPage, Channel3CapacityError, Channel3ResponseTooLargeError, searchProducts, searchProductsPage } from './channel3.js';
import { config } from './config.js';
import { rank } from './discovery.js';
import { eventSub, extensionAuth } from './security.js';
import { createStore, StoreCapacityError, type StorePort } from './store.js';

type AppOptions = { eventSubSecret?: string; extensionSecret?: string; demoMode?: boolean };
const intentSchema = z.object({ channelId: z.string().min(1).max(80), productId: z.string().min(1).max(160), action: z.enum(['view', 'save']) });
function fixedWindowLimiter(limit: number, windowMs: number, keyFor?: (request: express.Request, response: express.Response) => string): express.RequestHandler {
  const buckets = new Map<string, { count: number; until: number }>();
  return (request, response, next) => {
    const key = keyFor?.(request, response) ?? request.ip ?? request.socket.remoteAddress ?? 'unknown';
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

function globalFixedWindowLimiter(limit: number, windowMs: number): express.RequestHandler {
  let count = 0;
  let until = Date.now() + windowMs;
  return (_request, response, next) => {
    const now = Date.now();
    if (until <= now) { count = 0; until = now + windowMs; }
    if (count >= limit) return response.status(429).json({ error: 'rate_limited' });
    count += 1;
    next();
  };
}

export function createApp(store: StorePort = createStore(), options: AppOptions = {}) {
  const app = express();
  const demoMode = options.demoMode ?? config.DEMO_MODE;
  const seenEventIds = new Map<string, number>();
  const catalogueLimiter = globalFixedWindowLimiter(600, 60_000);
  const creatorMutationLimiter = fixedWindowLimiter(60, 60_000, (_request, response) => String(response.locals.channelId ?? 'unknown'));
  const viewerIntentLimiter = fixedWindowLimiter(30, 60_000, (request, response) => {
    const channelId = String(response.locals.channelId ?? 'unknown');
    const opaqueUserId = response.locals.extensionOpaqueUserId;
    const client = typeof opaqueUserId === 'string' && opaqueUserId ? `viewer:${opaqueUserId}` : `ip:${request.ip ?? request.socket.remoteAddress ?? 'unknown'}`;
    return `${channelId}:${client}`;
  });
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
    const payload = z.object({ challenge: z.string().optional(), subscription: z.object({ type: z.string() }).optional(), event: z.object({ broadcaster_user_id: z.string(), chatter_user_id: z.string(), message: z.object({ text: z.string() }) }).optional() }).parse(JSON.parse(raw.toString('utf8')));
    const messageType = headers['twitch-eventsub-message-type'];
    if (messageType === 'webhook_callback_verification' && payload.challenge) {
      seenEventIds.set(messageId, now);
      if (seenEventIds.size > 10_000) seenEventIds.delete(seenEventIds.keys().next().value ?? '');
      return response.type('text/plain').send(payload.challenge);
    }
    const event = payload.event;
    if (messageType === 'notification' && payload.subscription?.type === 'channel.chat.message' && event && event.chatter_user_id === event.broadcaster_user_id) {
      const topic = event.message.text.match(/^!gear\s+(.{2,80})\s*$/i)?.[1];
      if (topic) await store.setTopic(event.broadcaster_user_id, topic.trim());
    }
    // Keep failed persistence eligible for Twitch's retry with the same message ID.
    seenEventIds.set(messageId, now);
    if (seenEventIds.size > 10_000) seenEventIds.delete(seenEventIds.keys().next().value ?? '');
    return response.sendStatus(204);
  });
  app.use(express.json({ limit: '64kb' }));
  app.get('/health', (_request, response) => response.json({ ok: true, mode: demoMode ? 'demo' : 'live', safeSearch: config.SAFE_SEARCH }));
  app.get('/v1/channels/:id/discovery', async (request, response, next) => { try { const channelId = String(request.params.id), topic = await store.topic(channelId); response.json({ channelId, topic, items: rank(await searchProducts(topic), topic, await store.approved(channelId), await store.metrics(channelId)) }); } catch (error) { next(error); } });
  app.get('/v1/catalogue/browse', catalogueLimiter, async (request, response, next) => { try { const channelId = z.string().max(80).default('demo').parse(request.query.channelId); const pageToken = z.string().min(1).max(4096).optional().parse(request.query.pageToken); const safeSearch = request.query.safeSearch === undefined ? config.SAFE_SEARCH : z.enum(['true', 'false']).parse(request.query.safeSearch) === 'true'; const page = await browseCollectionPage(safeSearch, pageToken); response.json({ channelId, safeSearch, topic: `${config.CHANNEL3_COLLECTION_NAME} collection`, collectionName: config.CHANNEL3_COLLECTION_NAME, source: demoMode ? 'demo_fixture' : 'channel3_api', items: rank(page.items, '', await store.approved(channelId), await store.metrics(channelId)), nextPageToken: page.nextPageToken }); } catch (error) { next(error); } });
  app.get('/v1/catalogue/search', catalogueLimiter, async (request, response, next) => { try { const term = z.string().trim().min(2).max(120).parse(request.query.q); const channelId = z.string().max(80).default('demo').parse(request.query.channelId); const pageToken = z.string().min(1).max(4096).optional().parse(request.query.pageToken); const safeSearch = request.query.safeSearch === undefined ? config.SAFE_SEARCH : z.enum(['true', 'false']).parse(request.query.safeSearch) === 'true'; const page = await searchProductsPage(term, safeSearch, pageToken); response.json({ channelId, safeSearch, topic: term, collectionName: config.CHANNEL3_COLLECTION_NAME, source: demoMode ? 'demo_fixture' : 'channel3_api', items: rank(page.items, term, await store.approved(channelId), await store.metrics(channelId)), nextPageToken: page.nextPageToken }); } catch (error) { next(error); } });
  const creatorAuth = extensionAuth({ roles: ['broadcaster'], demoMode, secret: options.extensionSecret });
  const viewerAuth = extensionAuth({ roles: ['viewer', 'broadcaster'], demoMode, secret: options.extensionSecret });
  app.post('/v1/creator/products', creatorAuth, creatorMutationLimiter, async (request, response, next) => {
    try {
      const channelId = response.locals.channelId as string;
      const productId = z.string().min(1).max(160).parse(request.body.productId);
      const currentProducts = await searchProducts(await store.topic(channelId));
      if (!currentProducts.some((product) => product.id === productId)) return response.status(404).json({ error: 'unknown_product' });
      await store.approve(channelId, productId);
      response.status(201).json({ ok: true });
    } catch (error) { next(error); }
  });
  app.delete('/v1/creator/products/:id', creatorAuth, creatorMutationLimiter, async (request, response, next) => { try { await store.unapprove(response.locals.channelId, String(request.params.id)); response.status(204).send(); } catch (error) { next(error); } });
  app.post('/v1/viewer/intent', viewerAuth, viewerIntentLimiter, async (request, response, next) => {
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
  app.use((error: unknown, _request: unknown, response: express.Response, _next: unknown) => {
    if (error instanceof Channel3CapacityError) return response.status(503).json({ error: 'catalogue_capacity_limited' });
    if (error instanceof Channel3ResponseTooLargeError) return response.status(502).json({ error: 'catalogue_upstream_response_too_large' });
    if (error instanceof StoreCapacityError) return response.status(409).json({ error: error.code });
    return response.status(error instanceof z.ZodError ? 400 : 500).json({ error: error instanceof z.ZodError ? 'invalid_request' : 'internal_error' });
  });
  return app;
}
