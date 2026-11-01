import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

type Role = 'broadcaster' | 'viewer';
type AuthOptions = { demoMode?: boolean; secret?: string; roles: Role[] };

export function extensionAuth(options: AuthOptions): RequestHandler {
  return (request, response, next) => {
    if (options.demoMode) {
      response.locals.channelId = String(request.body?.channelId ?? request.query.channelId ?? 'demo');
      return next();
    }
    try {
      const token = request.headers['x-extension-jwt'] ?? request.headers.authorization?.replace(/^Bearer /, '');
      const secret = options.secret ?? config.TWITCH_EXTENSION_SECRET;
      if (typeof token !== 'string' || !secret) throw new Error('missing_token');
      const payload = jwt.verify(token, Buffer.from(secret, 'base64'), { algorithms: ['HS256'] }) as jwt.JwtPayload;
      const role = String(payload.role ?? '') as Role;
      const channelId = String(payload.channel_id ?? '');
      if (!options.roles.includes(role)) return response.status(403).json({ error: 'role_required' });
      if (!channelId) return response.status(401).json({ error: 'channel_required' });
      response.locals.channelId = channelId;
      response.locals.extensionRole = role;
      next();
    } catch {
      return response.status(401).json({ error: 'invalid_token' });
    }
  };
}

export function eventSub(headers: Record<string, string>, raw: Buffer, secret = config.TWITCH_WEBHOOK_SECRET) {
  if (!secret) return false;
  const id = headers['twitch-eventsub-message-id'] ?? '';
  const timestamp = headers['twitch-eventsub-message-timestamp'] ?? '';
  const signature = headers['twitch-eventsub-message-signature'] ?? '';
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(id + timestamp).update(raw).digest('hex');
  const age = Math.abs(Date.now() - Date.parse(timestamp));
  return Number.isFinite(age) && age < 600_000 && signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
