const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const apiOrigin = new URL(required('VITE_API_ORIGIN'));
const catalogueOrigin = new URL(required('VITE_CATALOGUE_ORIGIN'));
const callback = new URL(required('TWITCH_EVENTSUB_CALLBACK'));
const clientId = required('TWITCH_CLIENT_ID');
const clientSecret = required('TWITCH_CLIENT_SECRET');
const broadcasterId = required('TWITCH_BROADCASTER_ID');
const chatUserId = process.env.TWITCH_CHAT_USER_ID?.trim() || broadcasterId;

for (const [name, url] of [['VITE_API_ORIGIN', apiOrigin], ['VITE_CATALOGUE_ORIGIN', catalogueOrigin], ['TWITCH_EVENTSUB_CALLBACK', callback]]) {
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw new Error(`${name} must use a public HTTPS origin`);
  }
}

const get = async (url, label) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return response;
};

const health = await get(new URL('/health', apiOrigin), 'Public health').then((response) => response.json());
if (health.mode !== 'live' || health.safeSearch !== true) throw new Error('Public API is not live with SafeSearch enabled');

const discovery = await get(new URL(`/v1/channels/${encodeURIComponent(broadcasterId)}/discovery`, apiOrigin), 'Public discovery').then((response) => response.json());
if (!Array.isArray(discovery.items) || discovery.items.length === 0) throw new Error('Public discovery returned no products');

const catalogue = await get(new URL(`/v1/catalogue/browse?channelId=${encodeURIComponent(broadcasterId)}`, apiOrigin), 'Curated catalogue').then((response) => response.json());
if (catalogue.collectionName !== 'Twitch' || catalogue.source !== 'channel3_api' || !Array.isArray(catalogue.items) || catalogue.items.length === 0) {
  throw new Error('Public catalogue is not backed by the Twitch Channel3 collection');
}
if (catalogue.items.some((item) => new URL(item.productUrl).hostname !== 'buy.trychannel3.com')) {
  throw new Error('Public catalogue contains a product link not returned through Channel3');
}

await get(catalogueOrigin, 'Public catalogue');
await get(new URL('/extension/panel.html', apiOrigin), 'Public Twitch panel');

const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
  signal: AbortSignal.timeout(20_000),
});
if (!tokenResponse.ok) throw new Error(`Twitch credential check returned HTTP ${tokenResponse.status}`);
const { access_token: accessToken } = await tokenResponse.json();

const subscriptionsResponse = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions?type=channel.chat.message', {
  headers: { 'Client-Id': clientId, Authorization: `Bearer ${accessToken}` },
  signal: AbortSignal.timeout(20_000),
});
if (!subscriptionsResponse.ok) throw new Error(`Twitch EventSub check returned HTTP ${subscriptionsResponse.status}`);
const subscriptions = (await subscriptionsResponse.json()).data;
const subscription = subscriptions.find((item) =>
  item.status === 'enabled' &&
  item.condition?.broadcaster_user_id === broadcasterId &&
  item.condition?.user_id === chatUserId &&
  item.transport?.method === 'webhook' &&
  item.transport?.callback === callback.href
);
if (!subscription) throw new Error('No enabled EventSub subscription matches the configured broadcaster, chat user, and callback');

console.log(JSON.stringify({
  ok: true,
  publicOrigin: apiOrigin.origin,
  health: { mode: health.mode, safeSearch: health.safeSearch },
  discovery: { topic: discovery.topic, itemCount: discovery.items.length },
  catalogue: { collection: catalogue.collectionName, source: catalogue.source, itemCount: catalogue.items.length },
  twitchPanel: 'reachable',
  eventSub: { id: subscription.id, status: subscription.status, type: subscription.type },
}, null, 2));
