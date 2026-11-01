import crypto from 'node:crypto';
import http from 'node:http';

const mode = process.argv[2] ?? 'combined';
const scopesByMode = {
  chat: ['user:read:chat', 'user:bot'],
  broadcaster: ['channel:bot'],
  combined: ['user:read:chat', 'user:bot', 'channel:bot'],
};
const scopes = scopesByMode[mode];
if (!scopes) throw new Error('Mode must be chat, broadcaster, or combined');

const clientId = process.env.TWITCH_CLIENT_ID?.trim();
const clientSecret = process.env.TWITCH_CLIENT_SECRET?.trim();
const redirect = process.env.TWITCH_OAUTH_REDIRECT?.trim() || 'http://localhost:3000/twitch/callback';
if (!clientId || !clientSecret) throw new Error('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are required');
const redirectUrl = new URL(redirect);
if (redirectUrl.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(redirectUrl.hostname)) throw new Error('TWITCH_OAUTH_REDIRECT must use local HTTP for this helper');

const state = crypto.randomBytes(24).toString('hex');
const authorizeUrl = new URL('https://id.twitch.tv/oauth2/authorize');
authorizeUrl.search = new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  redirect_uri: redirectUrl.toString(),
  scope: scopes.join(' '),
  state,
  force_verify: 'true',
}).toString();

const server = http.createServer(async (request, response) => {
  try {
    const incoming = new URL(request.url || '/', redirectUrl);
    if (incoming.pathname !== redirectUrl.pathname) return response.writeHead(404).end('Not found');
    if (incoming.searchParams.get('state') !== state) return response.writeHead(403).end('Invalid OAuth state');
    if (incoming.searchParams.get('error')) return response.writeHead(400).end('Twitch authorization was not granted');
    const code = incoming.searchParams.get('code');
    if (!code) return response.writeHead(400).end('Missing authorization code');

    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUrl.toString() }),
    });
    const token = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok || !token?.access_token) throw new Error(`token exchange failed (${tokenResponse.status})`);

    const validationResponse = await fetch('https://id.twitch.tv/oauth2/validate', { headers: { authorization: `OAuth ${token.access_token}` } });
    const validation = await validationResponse.json().catch(() => null);
    if (!validationResponse.ok || !validation?.user_id) throw new Error(`token validation failed (${validationResponse.status})`);
    const granted = new Set(validation.scopes ?? []);
    if (!scopes.every((scope) => granted.has(scope))) throw new Error('Twitch did not grant every required scope');

    response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end('StreamCart Twitch authorization verified. You may close this tab.');
    console.log(JSON.stringify({ ok: true, mode, userId: validation.user_id, login: validation.login, scopes: validation.scopes, expiresIn: validation.expires_in }));
    server.close();
  } catch (error) {
    response.writeHead(500).end('Twitch authorization could not be verified. Check the terminal.');
    console.error(error instanceof Error ? error.message : 'authorization failed');
    process.exitCode = 1;
    server.close();
  }
});

server.listen(Number(redirectUrl.port || 80), '127.0.0.1', () => {
  console.log(JSON.stringify({ ready: true, mode, redirect: redirectUrl.toString(), authorizeUrl: authorizeUrl.toString() }));
});
setTimeout(() => { console.error('Twitch authorization timed out'); process.exitCode = 1; server.close(); }, 300_000).unref();
