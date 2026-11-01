# Validation record and remaining gates

Updated: 1 November 2026.

## Proven locally

- All three workspaces build successfully.
- Automated suite: 9 tests passing, covering EventSub signature/challenge handling, broadcaster-only chat commands, duplicate delivery, identity-free intent, CORS, JWT channel binding, creator approval removal, production fail-closed configuration, optional development credentials, cohort privacy, and catalogue safety policy.
- Production dependency audit: zero known vulnerabilities from `npm audit --omit=dev`.
- Live Channel3 credential smoke: HTTP 200 with three products.
- Live Channel3 through the StreamCart API: 20 normalized results for `streaming microphone`, including valid USD price and allowlisted `buy.trychannel3.com`/`cdn.trychannel3.com` URLs.
- Runtime demo: context trigger, discovery, explicit save intent, CORS behavior, creator approval transition, and cohort-hidden low counts.
- Configured Twitch Extension secret smoke: a synthetic HS256 broadcaster JWT approved a live Channel3 product only in its signed channel, while a viewer token with a mismatched body channel was rejected with HTTP 403. No token or secret was printed.
- Rendered extension and catalogue inspected at desktop size; responsive and reduced-motion rules are present.
- Extension packaging refuses missing, localhost, or non-HTTPS public origins.
- `.env`, data, logs, archives, dependencies, and build output are excluded from Git and Docker contexts.
- Primary Codex session and security scan identities are retained in `docs/codex-sessions.md`.
- Twitch OAuth completed for broadcaster `1600116434` with the minimum chat scopes used by the MVP. Tokens were validated transiently and were not printed or persisted by the helper.
- Twitch EventSub subscription `f6721d8f-bee4-4e3b-9bf2-a702fea18cfc` is live and `enabled` for `channel.chat.message`, bound to broadcaster/chat user `1600116434`, with webhook transport to the public preview.
- Real Twitch end-to-end command proof completed on 1 November 2026: broadcaster `protocolx76` sent `!gear streaming microphone` in their own channel chat; the public discovery topic changed from `stream setup` to `streaming microphone` and returned 20 Channel3 results, led by an AI-discovered ECM-S1 Wireless Streaming Microphone.
- Public Vercel preview is anonymously reachable at `https://streamcart-twitchcon-57nrbqad1-protocol-x.vercel.app`: `/health` reports live mode and SafeSearch enabled; public discovery returns 20 normalized Channel3 products.
- Owner-approved stable production deployment `dpl_8miwsQawe1nUGCts3kupix6FCy6o` is `READY` and aliased at `https://streamcart-twitchcon.vercel.app`. Anonymous checks prove live/SafeSearch health, 20-product discovery with the persisted `streaming microphone` topic, panel/config/catalogue HTTP 200 responses, the stable origin embedded in the browser bundle, and CORS access for `https://3z76w1eigzegdllmz3ud4l2q8bwjly.ext-twitch.tv`.
- The stable root redirect and rendered production overlay were inspected in-browser. The live Channel3 product image, direct product action, stable catalogue action, creator control, and movable panel render correctly.
- Private Vercel Blob persistence was exercised on an isolated validation channel: creator approval persisted and a five-save cohort became visible without storing a viewer identity.
- The rendered overlay was rechecked after the final interaction pass: the fallback product opens the StreamCart catalogue, and the expanded overlay can be dragged, keyboard-nudged, and reset. The true Twitch panel remains fixed to avoid iframe clipping.
- Release validator passes the build/test, dependency audit, file-boundary, credential-scan, Codex-evidence, documentation, Twitch-config, and public-origin gates.

## Not yet proven

- Owner-approved EventSub migration completed: preview subscription `f6721d8f-bee4-4e3b-9bf2-a702fea18cfc` was replaced by production subscription `ab5ae7f1-4642-4208-835c-13a84471d602`, which is `enabled` at `https://streamcart-twitchcon.vercel.app/v1/twitch/eventsub`.
- Full `npm run demo:preflight` passes against stable production: all builds, 9 automated tests, live/SafeSearch health, `streaming microphone` discovery with 20 products, catalogue, Twitch panel, and matching enabled EventSub.
- Expanded Channel3 collection check returned 20 microphone results across 13 named brands (including Sony, Logitech, Sennheiser, JBL, MSI, Yamaha, and others). StreamCart now preserves every returned brand, displays the primary brand in Twitch, and builds dynamic zero-round-trip brand filters in the catalogue.
- The product image/title block is now a first-class direct link: live Channel3 products open their product URL, while deterministic placeholder products fall back to the StreamCart catalogue. The existing explicit action remains available.
- Twitch package `streamcart-twitch-extension.zip` was built only after Git publication, strict validation, production deployment, and rendered checks passed. It contains `panel.html`, `config.html`, `index.html`, and two hashed assets; uncompressed payload is 236,521 bytes. SHA-256: `f9a9e3b00a8c8eecc4b82d3bde88579bb5a01d3b07696bfe7c0fd177481f4d20`.
- Archive audit proved all Twitch entrypoints are at the ZIP root, the stable production origin is embedded, and none of the real Channel3/Twitch secret values occur in the browser package. The ZIP has not yet been uploaded to Twitch.
- Container image build is not verified because the current account cannot access the local Docker service.
- Final video and Devpost submission do not exist yet.
- GitHub Actions runs `41310597302` and `41312379918` completed successfully: clean checkout/install, workspace builds, all 9 tests, and the production dependency audit passed.
- Public repository published at `https://github.com/Protocol-X-01/StreamCart`, initial validated commit `b90f8dddccd10743d014e9565b2e9baf8eec286a`.
- Earlier zero-step billing-lock failures are superseded by the successful reruns of `41310597302`; GitHub-hosted CI is operational again.

The remaining gates are Git publication, final validated Twitch Extension packaging/upload, and final recording/submission. They require separate owner approval and must not be represented as complete until directly verified.
