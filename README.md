# StreamCart

Creator-controlled, AI-assisted product discovery for Twitch. StreamCart combines visibly creator-approved products with Channel3-powered discoveries, using only explicit viewer intent and identity-free aggregate metrics.

## Local demo

Requires Node.js 20 or newer.

```bash
cp .env.example .env
npm ci
npm run check
npm run dev:api
npm run dev:extension
npm run dev:catalogue
```
Open `http://localhost:5173?channel=demo`. Trigger context:
```bash
curl -X POST http://localhost:8787/v1/demo/channels/demo/trigger -H 'content-type: application/json' -d '{"topic":"mechanical keyboard"}'
```

## Live Channel3

Put `CHANNEL3_API_KEY` and the optional `CHANNEL3_COLLECTION_ID` in `.env`, then run a credential-safe contract check:

```bash
node --env-file=.env scripts/smoke.mjs "streaming microphone"
```

The smoke output contains only status, result count, and an optional request ID. It never prints the key or product payload. Live product and image domains must also be listed in `PRODUCT_URL_HOSTS` and `IMAGE_URL_HOSTS`; unapproved URLs are discarded.

## Policy
US/en/USD defaults. SafeSearch is on by default. Channel3 `age: adult` is treated as product audience metadata, not inherently unsafe. Weapons and weapon-specific accessories remain blocked even if SafeSearch is off.

## Twitch and deployment

See [Twitch Hosted Test setup](docs/twitch-setup.md). Browser code never receives Channel3 or Twitch secrets. Production requires `DEMO_MODE=false`, explicit origins/URL hosts, and all server-side Twitch verification secrets.

Build and test everything with `npm run check`. Build the Twitch upload only after final public origins are configured with `npm run package:twitch`. The API container is defined by `Dockerfile`; deployment is intentionally not performed by repository scripts.

The repository's GitHub Actions workflow repeats the clean install, workspace build, automated suite, and production dependency audit without requiring deployment credentials.

Run `npm run validate:release` for all locally provable gates. Run `npm run validate:release -- --strict` only when Twitch credentials, public HTTPS origins, and the publication remote are configured; strict mode fails while any release gate is pending.

Immediately before rehearsing or recording, run `npm run demo:preflight`. It builds and tests the workspaces, then performs read-only checks against the configured public API, catalogue, Twitch panel, Channel3-backed discovery, and matching enabled EventSub subscription. Its output is credential-safe.

## Submission evidence

- [Three-minute demo runbook](docs/demo-script.md)
- [Security and privacy boundary](docs/security.md)
- [Architecture](docs/architecture.md)
- [Codex session evidence](docs/codex-sessions.md)
- [Submission copy](docs/submission.md)
- [Validation record](docs/validation.md)
