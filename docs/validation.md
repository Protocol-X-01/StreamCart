# Validation record and remaining gates

Updated: 2 November 2026.

Earlier results below record separate release checkpoints. Their deployment, subscription, package, and test-count facts are historical measurements; the current Render static-site checkpoint at the end supersedes earlier public-origin and proof-version status.

## Recorded validation evidence

- All three workspaces build successfully.
- Automated suite: 12 tests passing, covering EventSub signature/challenge handling, broadcaster-only chat commands, duplicate delivery, identity-free intent, CORS, JWT channel binding, creator approval removal, collection-scoped browsing, short-query failure safety, production fail-closed configuration, optional development credentials, Postgres/Blob/file store selection, cohort privacy, and catalogue safety policy.
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
- Historical preview EventSub subscription `f6721d8f-bee4-4e3b-9bf2-a702fea18cfc` was live and `enabled` for `channel.chat.message`, bound to broadcaster/chat user `1600116434`, with webhook transport to the public preview. Its replacement is recorded below.
- Real Twitch end-to-end command proof completed on 1 November 2026: broadcaster `protocolx76` sent `!gear streaming microphone` in their own channel chat; the public discovery topic changed from `stream setup` to `streaming microphone` and returned 20 Channel3 results, led by an AI-discovered ECM-S1 Wireless Streaming Microphone.
- Public Vercel preview is anonymously reachable at `https://streamcart-twitchcon-57nrbqad1-protocol-x.vercel.app`: `/health` reports live mode and SafeSearch enabled; public discovery returns 20 normalized Channel3 products.
- Owner-approved stable production deployment `dpl_HZnKmxPx39MSR8b5QKs9VtADJEdy` is `READY` and aliased at `https://streamcart-twitchcon.vercel.app`. It supersedes `dpl_8miwsQawe1nUGCts3kupix6FCy6o` without changing the stable origin. Anonymous checks prove live/SafeSearch health, the public proof slate, 20-product discovery with the persisted `streaming microphone` topic, panel/config/catalogue HTTP 200 responses, the stable origin embedded in the browser bundle, and CORS access for `https://3z76w1eigzegdllmz3ud4l2q8bwjly.ext-twitch.tv`.
- The stable root redirect and rendered production overlay were inspected in-browser. The live Channel3 product image, direct product action, stable catalogue action, creator control, and movable panel render correctly.
- Private Vercel Blob persistence was exercised on an isolated validation channel: creator approval persisted and a five-save cohort became visible without storing a viewer identity.
- The rendered overlay was rechecked after the final interaction pass: the fallback product opens the StreamCart catalogue, and the expanded overlay can be dragged, keyboard-nudged, and reset. The true Twitch panel remains fixed to avoid iframe clipping.
- Release validator passes the build/test, dependency audit, file-boundary, credential-scan, Codex-evidence, documentation, Twitch-config, and public-origin gates.
- Vercel Blob quota exhaustion was reproduced as the cause of the 2 November API 500s. The owner-approved recovery deployed a free Frankfurt Render Postgres instance (`dpg-dbk36kec6qcc73ddaca0-a`, expires 2 December) and Docker API service (`srv-dbk37eoae00c73fmv2a0`) with autodeploy disabled and no public database allowlist.
- The Postgres store preserves creator topics, approvals, and identity-free aggregate metrics under a row lock. A real local PostgreSQL 18 concurrency test preserved all 10 simultaneous intent writes, and the isolated Render validation topic survived a full service redeploy.
- Render deployment `dep-dbk39enlk1mc73ani7j0` is live at `https://streamcart-twitchcon-api.onrender.com`. It passed signed EventSub challenge/notification handling, Twitch-origin CORS, 20-product discovery, 30-item `Twitch` collection browse, and Channel3-only product-link checks. GitHub workflow `Keep StreamCart Demo Warm` passed run `41404151695` and checks `/health` every 10 minutes to avoid free-service cold starts during judging.
- Vercel deployment `dpl_CKeGhQ59hrAU3KvRtR2ktiKG7hYW` is promoted at `https://streamcart-twitchcon.vercel.app`; `/health` and `/v1/*` proxy to the validated Render service while the public origin, Twitch CSP contract, and EventSub callback remain unchanged. Full stable `npm run demo:preflight` passed with 12 tests, 22 listing checks, live/SafeSearch health, 20 `streaming microphone` discoveries, 30 collection items, reachable panel, and enabled EventSub `ab5ae7f1-4642-4208-835c-13a84471d602`.
- Stable browser inspection rendered the movable capsule with drag, arrow-key, and reset affordances; expanding it showed the Sony ECM-S1 result, a direct Channel3 product action, zero fabricated viewer metrics, and the **No personal tracking** boundary. The `/proof/` slate retained Hosted Test 0.0.2 and Codex session `01a193cc-90fd-7643-9517-dfd3517e1d11`.

## Historical release checkpoints

- Owner-approved EventSub migration completed: preview subscription `f6721d8f-bee4-4e3b-9bf2-a702fea18cfc` was replaced by production subscription `ab5ae7f1-4642-4208-835c-13a84471d602`, which is `enabled` at `https://streamcart-twitchcon.vercel.app/v1/twitch/eventsub`.
- Full `npm run demo:preflight` passes against stable production: all builds, 9 automated tests, live/SafeSearch health, `streaming microphone` discovery with 20 products, catalogue, Twitch panel, and matching enabled EventSub.
- Expanded Channel3 collection check returned 20 microphone results across 13 named brands (including Sony, Logitech, Sennheiser, JBL, MSI, Yamaha, and others). StreamCart now preserves every returned brand, displays the primary brand in Twitch, and builds dynamic zero-round-trip brand filters in the catalogue.
- The product image/title block is now a first-class direct link: live Channel3 products open their product URL, while deterministic placeholder products fall back to the StreamCart catalogue. The existing explicit action remains available.
- Twitch package `streamcart-twitch-extension.zip` was built only after Git publication, strict validation, production deployment, and rendered checks passed. It contains `panel.html`, `config.html`, `index.html`, and two hashed assets; uncompressed payload is 236,521 bytes. SHA-256: `f9a9e3b00a8c8eecc4b82d3bde88579bb5a01d3b07696bfe7c0fd177481f4d20`.
- Archive audit proved all Twitch entrypoints are at the ZIP root, the stable production origin is embedded, and none of the real Channel3/Twitch secret values occur in the browser package.
- Twitch accepted the owner-approved upload for Extension `3z76w1eigzegdllmz3ud4l2q8bwjly`, version `0.0.1`. The console-reported MD5 `213c0fb1dacbedb7c44bd002b9787f0d` exactly matches the local archive.
- Twitch reports `Current Status: Hosted Test` and serves the extension from `https://3z76w1eigzegdllmz3ud4l2q8bwjly.ext-twitch.tv/`, with `config.html` and `panel.html` as the configured entrypoints. Public review was not submitted.
- Owner-approved Twitch version `0.0.2` was created without altering `0.0.1`. Twitch accepted `streamcart-twitch-extension-0.0.2-candidate-r2.zip`; its console MD5 `602ce02ea77c7b0f0b17f5837bbfcd39` exactly matches the local archive, whose SHA-256 is `2e08a500c1ace0ed6219b8cccc1323ae8fb53e5198cabe1e90088d20fe412d20`.
- Version `0.0.2` is in Hosted Test with the stable Vercel API fetch origin, stable catalogue and Channel3 product-link origins, and both observed Channel3 image origins (`cdn.trychannel3.com` and `www.adorama.com`) allowlisted. Twitch exposes the test build as version `0.0.2`; public review was deliberately not submitted.
- Owner-approved channel installation completed on 1 November: Twitch Extension Manager reports StreamCart `0.0.2` as the active extension in Panel 1, while `0.0.1` remains installed but inactive for rollback. The `protocolx76` About page loads the exact 0.0.2 CDN path with MD5 `602ce02ea77c7b0f0b17f5837bbfcd39` and renders the capsule-first **Finds from the stream** control. Browser logs contain no StreamCart, CSP, API, or product-image errors.
- Stable production deployment `dpl_H425di9LeRLTYz8nTqbUNVkE2sbM` is `READY` and aliased at `https://streamcart-twitchcon.vercel.app`. Live browser verification showed 29 collection-scoped Channel3 finds with only API-returned `buy.trychannel3.com` product links, safe one-character validation, and the capsule-first panel expanding to the live Sony microphone find.
- GitHub Actions run `41362260826` passed for commit `fb899dcc0cc6797c5b88c5c10a9370b2e024a1b5`, including the bounded 15-second Channel3 browse timeout correction.
- Twitch Version Details now retain the validated summary, chat-command disclosure, privacy boundary, viewer summary, `Viewer Engagement` category, 100x100 logo, 24x24 taskbar icon, opaque 300x200 discovery image, and 1024x768 screenshot. After the owner-approved Local Test edit, Twitch returned version `0.0.1` to Hosted Test without the previous missing-information alert; `Submit For Review` is enabled but was deliberately not selected.
- The public `/proof/` recording slate renders the primary Codex session, validated Twitch-to-Channel3 path, 11 API tests, 22 listing checks, 20 live results, and zero high production vulnerabilities in a single 720p viewport. No credentials or private account data are present.
- The local Docker service was unavailable, but Render built and started the committed Dockerfile successfully; the first startup exposed and then verified the workspace-dependency copy fix in commit `da5610c`.
- Final video and Devpost submission do not exist yet.
- GitHub Actions runs `41310597302`, `41312379918`, and `41312583175` completed successfully: clean checkout/install, workspace builds, all 9 tests, and the production dependency audit passed.
- Public repository published at `https://github.com/Protocol-X-01/StreamCart`, initial validated commit `b90f8dddccd10743d014e9565b2e9baf8eec286a`.
- Earlier zero-step billing-lock failures are superseded by the successful reruns of `41310597302`; GitHub-hosted CI is operational again.

The remaining gates are an installed-channel Hosted Test recording rehearsal, final YouTube recording/upload, signed-out video validation, and final Devpost submission. Twitch public review is not required for the hackathon and was not submitted.

## 2026-11-02 — Twitch 0.0.4 checkpoint

- Approved archive `streamcart-twitch-extension-0.0.4-translucent-candidate-r2.zip` has SHA-256 `56cdb23f9dd757c6c3303b38c62c272af3d7b084c10bb0d95cb794d9d6f7bd18` and MD5 `43d67c06b8b4bca0ed2fb102cd0b5252`. Twitch accepted it with the matching MD5 and reports version 0.0.4 as Hosted Test.
- Extension Manager confirms 0.0.4 active in Panel 1; 0.0.3 remains installed and inactive for rollback. The channel About page loaded the exact hosted path `0.0.4/43d67c06b8b4bca0ed2fb102cd0b5252/panel.html`.
- Live read-only discovery still reports topic `streaming microphone`; both ECM-S1 entries return zero bucketed saves and views. The local listing screenshot and source now label the panel as a sample and omit live counts; Twitch 0.0.4 still has the earlier listing image, so updating Twitch's listing requires a new version and separately approved upload.
- The expanded Twitch `Stream Chat` column exposes `Send a message` and `Send Chat`. The broadcaster command and creator approval remain pending.
- At this earlier checkpoint, the local proof slate, submission URL, checklist, and active runbook named 0.0.4, while public `/proof/` still served 0.0.3 and deployment approval was pending. That proof-deployment status is superseded by the verified Render static-site checkpoint below. Recording, YouTube upload, signed-out validation, and Devpost submission remain incomplete.

## 2026-11-02 09:25 UTC — Current Render static-site and proof checkpoint

- Read-only public checks returned HTTP 200 for `https://streamcart-twitchcon-site-20261102.onrender.com/`, following its redirect to `/extension/index.html`, and for `/proof/` on the same Render static site.
- The Render `/proof/` response names Twitch Hosted Test `0.0.4`, 12 API tests, 22 listing checks, and primary Codex session `01a193cc-90fd-7643-9517-dfd3517e1d11`. The existing Vercel `/proof/` response returned HTTP 200 with the same markers; no further proof deployment is pending.
- `https://streamcart-twitchcon-api.onrender.com/health` and the existing Vercel `/health` proxy both returned HTTP 200 with `ok: true`, `mode: live`, and `safeSearch: true`. Render hosts the public application and API; the stable Vercel origin remains the existing Twitch API and EventSub callback proxy.
- Public application, judge-walkthrough, and proof links in the submission and YouTube upload copy now use the Render static-site origin. This documentation correction does not change the installed Twitch package, CSP, or EventSub callback.
- These HTTP checks verify public availability and proof-slate text, not a new test run or a fresh real-chat rehearsal. Actual broadcaster chat, creator approval, a final short recording, YouTube upload and signed-out validation, and Devpost Submitted confirmation remain the next gates.

## 2026-11-02 — Twitch 0.0.6 viewer access and release candidate

- The uploaded archive is `/home/protocol-x/Documents/Codex/2026-10-31/referenced-chatgpt-conversation-this-is-an/outputs/streamcart-evidence/2026-11-02-video-overlay/streamcart-twitch-extension-0.0.6-video-overlay-candidate-r2.zip`; current SHA-256 is `c7dbdfac4e9b9784383ce945d943cc271861f688bd532c4caa71dbe30fb38b93` and MD5 is `fdeb3f2663c06bfc11c56f1a80f9bdc3`.
- Twitch Console reports version `0.0.6` as Hosted Test with Panel `panel.html` and Video - Fullscreen `overlay.html`. The channel Extension Manager confirms `0.0.6` active in Overlay 1; 0.0.5, 0.0.4, 0.0.3, 0.0.2, and 0.0.1 remain installed but inactive.
- With Protocol-X's approval, added a separate viewer account beside the broadcaster in version 0.0.6's Testing Account Allowlist. Twitch required a temporary transition to Local Test; the allowlist was saved, the version was returned to Hosted Test, and the saved entry was confirmed after reloading the Access page. No public-review submission occurred.
- The exact Twitch CDN path `/0.0.6/fdeb3f2663c06bfc11c56f1a80f9bdc3/overlay.html` returned HTTP 200. This proves the hosted overlay asset is reachable, not that it renders in the Twitch video player.
- `node --env-file=.env scripts/validate-release.mjs --strict` passed all 12 release checks: workspace build/tests, production dependency audit, release-file and credential-assignment checks, submission/proof/caption consistency, configured Twitch credentials and HTTPS origins, and Git remote.
- `node --env-file=.env scripts/demo-preflight.mjs` passed: public health is `mode: live` with SafeSearch enabled; discovery returned 20 products for `streaming microphone`; the Channel3-backed `Twitch` collection returned 28 items; panel and exact hosted overlay assets are reachable; EventSub `ab5ae7f1-4642-4208-835c-13a84471d602` is enabled.
- The current local proof-slate candidate says Hosted Test 0.0.6 and 15 API tests. Public Render `/proof/` still says 0.0.5 and 12 API tests; the Vercel proof page says 0.0.4 and 12 tests. Neither was deployed in this checkpoint.
- Twitch remains offline and no Firefox session was available in the browser inventory. Actual overlay visibility, expansion, broadcaster approval, and the viewer's explicit save action remain unverified. Do not present the hosted asset response as in-player proof.
- Primary Codex session remains `01a193cc-90fd-7643-9517-dfd3517e1d11`.

## 2026-11-02 18:34 UTC — privacy fix and current Render verification

- Protocol-X approved the aggregate-ranking privacy fix. Ranking uses the same five-action view/save buckets returned to callers; exact totals do not affect ordering inside a bucket. Regression coverage checks hidden 0–4 counts and equivalent 5–9 buckets.
- Commit `8532393b04a1277a2cef093225d6e540d2942c18` is published on `main`; GitHub Actions run `41500595006` passed. Render API deployment `dep-dbkdc4g473hc73fcileg` and static-site deployment `dep-dbkdd3vlk1mc73fe2oc0` are live for this commit.
- `npm run demo:preflight` passed: 15 API tests, 22 listing checks, live health/SafeSearch, 20 contextual discovery results, 29 Twitch collection products, reachable panel and overlay, and enabled EventSub. Strict release validation passed 12/12.
- Direct checks returned HTTP 200 for the Render API health route, Render `/proof/`, the Twitch extension page, and catalogue. The proof page displays Hosted Test 0.0.6, 15 API tests, 22 listing checks, and the primary Codex session ID. Client bundles use `https://streamcart-twitchcon-api.onrender.com`; the catalogue exposes SafeSearch controls.
- At 18:32 UTC the channel was offline and OBS was closed. No fresh live footage, recording, video upload, or Devpost submission has been completed. Actual in-player overlay visibility and the live creator/viewer interaction remain unverified.

## 2026-11-02 — Hosted Test 0.0.7 and catalogue-label candidate

- Twitch Hosted Test 0.0.7 uses the approved archive SHA-256 `c3066684378b782591cf8ab4b6c66764156420673d10fc8e6dc7b815e8438056`; Twitch's reported MD5 `901cb2e0619a35fdfdb04e3646a0bc27` matched the archive. Video Overlay 1 was active, and the URL Fetching Domains included the Render API after the approved configuration change.
- A fresh live Twitch recording showed the Sony ECM-S1 recommendation over the stream and the separate viewer's **Saved** state. The actual save click was not recorded. The broadcaster's `!gear streaming microphone` message remained visible in Twitch chat, and Render discovery returned the matching topic and 20 products.
- Broadcaster approval remains unverified: the live discovery response returned no creator-approved product and the Twitch dashboard configuration view was blank. Do not claim a production approval until that path is verified.
- The catalogue previously displayed a suppressed public count as `0 saves`. The local candidate instead says `Save count hidden for privacy` below the threshold and uses five-action lower bounds above it. An isolated demo catalogue visually rendered the new label; 17 automated tests and 22 listing checks passed locally, including regression coverage against the API's privacy buckets.
- The candidate proof slate and preflight defaults now identify Hosted Test 0.0.7. These source changes have not yet been deployed to Render. The fresh Twitch and Codex recordings are edit sources; the final video, YouTube upload, and Devpost submission remain outstanding.
