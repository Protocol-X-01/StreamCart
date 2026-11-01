const required = ['TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET', 'TWITCH_BROADCASTER_ID', 'TWITCH_WEBHOOK_SECRET', 'TWITCH_EVENTSUB_CALLBACK'];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) throw new Error(`Missing required Twitch configuration: ${missing.join(', ')}`);

const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: 'client_credentials',
  }),
});
const tokenPayload = await tokenResponse.json().catch(() => null);
if (!tokenResponse.ok || !tokenPayload?.access_token) throw new Error(`Twitch app-token request failed (${tokenResponse.status})`);

const subscriptionResponse = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
  method: 'POST',
  headers: {
    authorization: `Bearer ${tokenPayload.access_token}`,
    'client-id': process.env.TWITCH_CLIENT_ID,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    type: 'channel.chat.message',
    version: '1',
    condition: {
      broadcaster_user_id: process.env.TWITCH_BROADCASTER_ID,
      user_id: process.env.TWITCH_CHAT_USER_ID || process.env.TWITCH_BROADCASTER_ID,
    },
    transport: {
      method: 'webhook',
      callback: process.env.TWITCH_EVENTSUB_CALLBACK,
      secret: process.env.TWITCH_WEBHOOK_SECRET,
    },
  }),
});
const subscriptionPayload = await subscriptionResponse.json().catch(() => null);
const subscription = subscriptionPayload?.data?.[0];
console.log(JSON.stringify({
  ok: subscriptionResponse.ok,
  status: subscriptionResponse.status,
  subscriptionId: subscription?.id,
  subscriptionStatus: subscription?.status,
  type: subscription?.type,
}));
if (!subscriptionResponse.ok) process.exitCode = 1;
