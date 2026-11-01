# Twitch Hosted Test setup

No Twitch secret belongs in the extension bundle or repository.

## Required Twitch values

- `TWITCH_EXTENSION_ID`: ID of a Video Component Extension.
- `TWITCH_EXTENSION_SECRET`: base64 Extension JWT signing secret from the Extension Console.
- `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`: server-only Developer Application credentials used when creating EventSub subscriptions.
- `TWITCH_BROADCASTER_ID`: numeric user ID of the demo broadcaster.
- `TWITCH_CHAT_USER_ID`: numeric ID of the authorized chat user/bot; defaults to the broadcaster ID when omitted.
- `TWITCH_OAUTH_REDIRECT`: registered local OAuth callback; the helper defaults to `http://localhost:3000/twitch/callback`.
- `TWITCH_WEBHOOK_SECRET`: random 32-byte server secret generated locally and supplied verbatim when creating the subscription.
- `TWITCH_EVENTSUB_CALLBACK`: complete public callback URL ending in `/v1/twitch/eventsub`.
- A deployed HTTPS API origin and an HTTPS catalogue origin.

## Configure and validate

1. In the Twitch Developer Console, select the existing StreamCart Panel Extension (`3z76w1eigzegdllmz3ud4l2q8bwjly`) and create or select a Developer Application.
2. Keep the Panel Viewer Path as `panel.html`; the extension build emits that Twitch entry point plus `index.html` for the standalone overlay preview. Configure the allowlist to include the API/catalogue origins.
3. Set the production API environment with `DEMO_MODE=false`, the Twitch/Channel3 secrets, explicit CORS origins, and explicit product/image hostname allowlists. CORS must include both the stable app origin and `https://<extension-id>.ext-twitch.tv`, which is the origin used by Twitch-hosted extension frames.
4. Deploy the API to a public HTTPS endpoint. Its EventSub callback is `/v1/twitch/eventsub` on port 443.
5. Add `TWITCH_OAUTH_REDIRECT` to the application's OAuth Redirect URLs. If the broadcaster is also the chat user, run `node --env-file=.env scripts/authorize-twitch.mjs combined`, visit the printed Twitch URL, and authorize once. For a separate chat user, run `chat` while signed into that account and `broadcaster` while signed into the broadcaster account; `channel:bot` may be omitted when the chat user is already a moderator. The helper verifies `state`, exchanges and validates the token locally, reports only user ID/scopes, and does not persist or print either token.
6. Run `node --env-file=.env scripts/register-eventsub.mjs`. For webhook transport, the helper obtains the required app access token and creates the broadcaster/chat-user-bound subscription without printing any credential.
7. Confirm Twitch's callback challenge succeeds. Send `!gear streaming microphone` as the broadcaster and verify that another viewer's same command is ignored.
8. Set `VITE_API_ORIGIN` and `VITE_CATALOGUE_ORIGIN` to their final public HTTPS origins, run `npm run package:twitch`, upload the ZIP to Local/Hosted Test, and test as both broadcaster and viewer. Packaging fails closed for localhost or non-HTTPS origins.

Twitch authorization supplies the Extension Helper's `channelId`, `userId`, and JWT token through `onAuthorized`. StreamCart sends the token to the API; the API trusts only its verified channel claim, never a browser-supplied channel ID.

Deployment, EventSub registration, and Twitch upload require explicit owner approval.

For the final callback migration, use the guarded helper only after explicit deletion approval:

```bash
npm run twitch:eventsub:migrate -- https://streamcart-twitchcon.vercel.app/v1/twitch/eventsub --confirm-replace
```

Without `--confirm-replace`, the helper exits before contacting Twitch. It attempts create-first, deletes the old subscription only when Twitch reports a duplicate, waits for the new callback to become enabled, and requests rollback if replacement creation fails.
