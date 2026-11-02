# StreamCart: three-minute submission demo

Target runtime: 2:40. Hard stop: 2:55. Record at 1080p with the Twitch player, chat, and StreamCart panel readable.

The upload-ready caption and teleprompter track is `docs/demo-captions.srt`. Its cues match the run of show below and end at the 2:55 hard stop.

## Situation and proof

Livestream product discovery usually becomes either an unstructured link dump or invisible behavioural tracking. In under three minutes, prove the opposite: a creator changes the live shopping context from Twitch, AI finds relevant real products, the creator visibly approves one, and a viewer expresses interest without creating a viewer profile.

## Presenter run of show

| Time | Action on screen | Narration |
| --- | --- | --- |
| 0:00–0:18 | Start on the expanded Twitch 0.0.3 **Finds from the stream** card showing its actual current provenance and metric. | “This is StreamCart: relevant product discovery inside Twitch, with visible provenance and creator control. Viewers choose when to express interest.” |
| 0:18–0:38 | Collapse and reopen **Finds**; point to the provenance label and **View product** action. In the standalone judge view, briefly drag the compact capsule to show it can move out of the way. | “StreamCart combines creator picks with live Channel3 discovery. Every recommendation explains where it came from, and viewers can open the real product or the full catalogue.” |
| 0:38–1:02 | As broadcaster, send `!gear streaming microphone` in Twitch chat and show the recommendation context change. | “The creator steers the AI from Twitch chat. A signed EventSub webhook accepts this command only from that broadcaster.” |
| 1:02–1:22 | Show an AI-discovered microphone, then select **Approve this find** as broadcaster. | “The AI proposes; the creator decides. Approval changes the provenance in place, and the API binds that write to Twitch’s signed channel claim.” |
| 1:22–1:40 | Show the viewer form of the card and select **Save interest** once. | “Viewer intent is explicit. StreamCart stores no viewer ID, profile, or browsing history—only channel, product, action, and aggregate count.” |
| 1:40–1:56 | Open **Catalogue**, point out the live collection count, and tap one brand chip while showing creator-pick versus AI-discovery labels. Do not open a retailer page. | “Channel3 supplies the live catalogue. StreamCart turns the returned brands into instant filters while keeping the same server-side safety policy and visible provenance.” |
| 1:56–2:12 | Return to the actual interest metric. Explain suppression without adding artificial saves. If showing a test fixture, label it visibly as simulated. | “Small action counts are suppressed and larger totals are bucketed. These are aggregate actions, not a count of unique viewers or a guarantee of anonymity.” |
| 2:12–2:31 | Show the public `/proof/` slate with Hosted Test 0.0.3, 12 API tests, and the Codex session ID. | “Codex took over the vertical slice, verified the Twitch and Channel3 contracts, built the signed authority and privacy boundaries, and kept the release evidence tied to this session.” |
| 2:31–2:45 | Show the concise validation summary, not environment files or raw headers. | “The Twitch subscription is enabled, Channel3 returns real products, and CI covers builds, twelve API tests, 22 listing checks, and the dependency audit.” |
| 2:45–2:55 | End on the approved Twitch product card. | “StreamCart: creator-controlled discovery, useful AI, and privacy by design—inside Twitch.” |

## Recording checklist

- Use a test broadcaster account and Twitch Hosted Test; do not expose the Developer Console or terminal environment.
- Twitch registers StreamCart as a Panel below the channel, so it cannot cover the video player. The Twitch panel starts collapsed and can be reopened; the standalone judge overlay is draggable in both compact and expanded states.
- Do not seed artificial saves into the real channel. Counts represent actions, not verified distinct viewers. Never display secrets, JWTs, `.env`, or raw webhook headers.
- Keep one approved product and one AI-discovered product in the visible result set.
- Run `npm run check` immediately before recording and retain its output as evidence.
- Confirm the final video is under three minutes and visibly demonstrates the Twitch interaction and Codex-built implementation.
- Include visible Codex footage or evidence, not narration alone. Keep the primary session ID `01a193cc-90fd-7643-9517-dfd3517e1d11` readable.
- Use no copyrighted music. Avoid opening retailer pages or dwelling on third-party branding; the Twitch interaction, StreamCart UI, and Codex evidence are the subject.
- Before recording, complete one rehearsal using only the exact path above. Do not improvise console, configuration, or alternate-product paths.
- Keep a clean validation-summary tab ready; never open `.env`, Vercel settings, Twitch Developer Console, or raw webhook traffic while recording.

## Go/no-go rehearsal gates

- `npm run demo:preflight` passes. It runs the local build/tests, then checks the public API, catalogue, Twitch panel, live discovery, and matching enabled EventSub subscription without printing credentials.
- Public `/health` reports `mode: live` and `safeSearch: true`.
- EventSub subscription status is `enabled`.
- Twitch Extension Manager and the installed channel panel both identify Hosted Test version `0.0.3`; do not record `0.0.2` or `0.0.1`.
- Broadcaster `!gear streaming microphone` changes the public discovery topic.
- Contextual discovery returns up to 20 ranked results; the separate full Twitch collection browse returned 29 finds in the latest validation but is live data. Read the on-screen count rather than promising a fixed number, and do not conflate the two counts in narration.
- The selected AI result can be approved and appears as `creator_approved` after refresh.
- The actual metric displays correctly; any simulated threshold demonstration is isolated and visibly labelled.
- Both **View product** and **View catalogue** open the intended destination.
- A timed rehearsal includes both working-on-Twitch footage and visible Codex build evidence, and finishes by 2:55.

The real broadcaster command path was proven on 1 November 2026 against the public preview. Re-run it during the recorded rehearsal only after the final stable deployment and EventSub callback are in place.

## Failure-safe route

If Twitch or Channel3 is unavailable during recording, do not pretend the live path worked. Use the deterministic local demo only as a clearly labelled fallback, retain the successful live-smoke evidence, and re-record the Twitch portion when Hosted Test is restored.

## Likely judge questions

- **Why is this not invasive tracking?** No viewer identifier is accepted or persisted; intent is an explicit click and only channel/product/action totals are stored.
- **What does the AI decide?** Channel3 supplies candidates; StreamCart applies safety policy, creator approval provenance, contextual relevance, and capped aggregate-signal ranking.
- **Can a viewer spoof another channel?** Live writes use the verified channel claim from Twitch’s signed Extension JWT and reject a body/channel mismatch.
- **What is production-ready versus hackathon-ready?** Render Postgres now persists topics, approvals, and aggregate actions. Multi-instance operation still needs a shared replay store and distributed rate limiter; the free service can cold-start and its database expires on 2 December 2026.

## Post-migration recording checkpoint — 2 November 2026

- Latest full stable preflight returned 12 API tests, 22 listing checks, 20 contextual discovery results, and 30 Twitch-collection products; live health/SafeSearch and EventSub remained enabled. Release `d40896b` passed CI run `41409674947` and strict release validation 12/12.
- Render validation used signed synthetic EventSub messages. Repeat an actual broadcaster chat command for the recorded proof; the earlier real-chat evidence predates the migration.
- The topic was restored, but prior Blob approvals and aggregate counts were not migrated. Approve a real result during rehearsal before claiming creator approval in footage.
- The stable deployed `/proof/` slate was refreshed and verified. It displays Hosted Test 0.0.3, 12 API tests, 22 listing checks, and the Codex session ID.
- Twitch's design guide lists 300px as the default Panel Height (range 100–500px); the About-page panel appears about 320×335px including Twitch chrome. The panel stylesheet previously forced a 496px minimum. Version `0.0.3` removes it; visual verification on the channel showed the collapsed capsule with no inner scrollbar and the expanded card loading correctly. The expanded card remains scrollable inside Twitch's fixed panel.
- Version `0.0.3` is active in Panel 1 and version `0.0.2` remains available as rollback. Twitch accepted six files; SHA-256 `605129e2dc9647da453f2e0de9f16a1309115c9875eec66e40f7b6a600008e09`; uploaded MD5 `a4c5b10d9f3faf78afa89457c3ce8b19` matched local. The Hosted Test page rendered `/0.0.3/a4c5b10d9f3faf78afa89457c3ce8b19/panel.html`.
- The current local preview and unuploaded version `0.0.4` candidate add a translucent backplate and lightly translucent capsules. Candidate `streamcart-twitch-extension-0.0.4-translucent-candidate-r2.zip` has SHA-256 `56cdb23f9dd757c6e3303b38c62c272af3d7b084c10bb0d95cb794d9d6f7bd18`; it has not been uploaded or activated. Version `0.0.3` remains the live Hosted Test until separate approval.
