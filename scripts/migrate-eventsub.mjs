const confirmed = process.argv.includes('--confirm-replace');
const callbackArgument = process.argv.find((argument) => argument.startsWith('https://'));
if (!callbackArgument) throw new Error('Provide the stable HTTPS callback URL');
const targetCallback = new URL(callbackArgument);
if (targetCallback.protocol !== 'https:' || targetCallback.pathname !== '/v1/twitch/eventsub' || targetCallback.search || targetCallback.hash) {
  throw new Error('Callback must be a public HTTPS URL ending exactly in /v1/twitch/eventsub');
}
if (!confirmed) throw new Error('Replacement is destructive. Re-run with --confirm-replace only after owner approval.');

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};
const clientId = required('TWITCH_CLIENT_ID');
const clientSecret = required('TWITCH_CLIENT_SECRET');
const broadcasterId = required('TWITCH_BROADCASTER_ID');
const chatUserId = process.env.TWITCH_CHAT_USER_ID?.trim() || broadcasterId;
const webhookSecret = required('TWITCH_WEBHOOK_SECRET');

const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
});
if (!tokenResponse.ok) throw new Error(`Twitch app-token request failed (${tokenResponse.status})`);
const { access_token: accessToken } = await tokenResponse.json();
const headers = { authorization: `Bearer ${accessToken}`, 'client-id': clientId };
const condition = { broadcaster_user_id: broadcasterId, user_id: chatUserId };

const listMatching = async () => {
  const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions?type=channel.chat.message', { headers });
  if (!response.ok) throw new Error(`Twitch subscription list failed (${response.status})`);
  const payload = await response.json();
  return payload.data.filter((item) =>
    item.type === 'channel.chat.message' &&
    item.condition?.broadcaster_user_id === broadcasterId &&
    item.condition?.user_id === chatUserId &&
    item.transport?.method === 'webhook'
  );
};

const create = async (callback) => {
  const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({
      type: 'channel.chat.message',
      version: '1',
      condition,
      transport: { method: 'webhook', callback, secret: webhookSecret },
    }),
  });
  const payload = await response.json().catch(() => null);
  return { response, subscription: payload?.data?.[0] };
};

const remove = async (id) => {
  const response = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers });
  if (response.status !== 204) throw new Error(`Twitch subscription deletion failed (${response.status})`);
};

const waitForEnabled = async (id) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const match = (await listMatching()).find((item) => item.id === id);
    if (match?.status === 'enabled') return match;
    if (match && match.status !== 'webhook_callback_verification_pending') throw new Error(`Replacement entered status ${match.status}`);
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error('Replacement did not become enabled within 20 seconds');
};

const existing = await listMatching();
const alreadyEnabled = existing.find((item) => item.status === 'enabled' && item.transport.callback === targetCallback.href);
if (alreadyEnabled) {
  console.log(JSON.stringify({ ok: true, changed: false, subscriptionId: alreadyEnabled.id, status: alreadyEnabled.status, callbackHost: targetCallback.host }));
  process.exit(0);
}

const oldEnabled = existing.filter((item) => item.status === 'enabled');
let created = await create(targetCallback.href);
if (created.response.status === 409 && oldEnabled.length) {
  for (const item of oldEnabled) await remove(item.id);
  created = await create(targetCallback.href);
  if (!created.response.ok || !created.subscription) {
    for (const item of oldEnabled) await create(item.transport.callback);
    throw new Error(`Replacement creation failed after deletion (${created.response.status}); rollback requested`);
  }
} else if (!created.response.ok || !created.subscription) {
  throw new Error(`Replacement creation failed without deleting the existing subscription (${created.response.status})`);
}

const enabled = await waitForEnabled(created.subscription.id);
for (const item of oldEnabled) {
  if (item.id !== enabled.id && (await listMatching()).some((candidate) => candidate.id === item.id)) await remove(item.id);
}
console.log(JSON.stringify({ ok: true, changed: true, subscriptionId: enabled.id, status: enabled.status, callbackHost: targetCallback.host }));
