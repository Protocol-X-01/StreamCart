# StreamCart: three-minute submission demo

Target and maximum runtime: 2:55, leaving five seconds below the three-minute limit. Record at 1080p with the Twitch player and overlay readable.

The caption and teleprompter track is `docs/demo-captions.srt`. Its cues match the run of show below and end at 2:55.

## Situation and proof

Livestream product discovery usually becomes either an unstructured link dump or invisible behavioural tracking. In under three minutes, show a movable StreamCart capsule over the Twitch video, a real Channel3 discovery, visible broadcaster approval, and explicit viewer intent from a second test account—without taking the stream out of view or creating a viewer profile.

## Presenter run of show

| Time | Action on screen | Narration |
| --- | --- | --- |
| 0:00–0:15 | Start on the live Twitch player with the compact 0.0.6 capsule in the corner; open it once. | “This is StreamCart: a small, movable discovery overlay that keeps the Twitch stream in view.” |
| 0:15–0:35 | Show the real product image, `AI DISCOVERY` or `CREATOR PICK` provenance, and the catalogue action without opening a retailer page. | “Open the capsule to see a real Channel3 product, why it appeared, and where to explore the full collection.” |
| 0:35–0:58 | As broadcaster, send `!gear streaming microphone` in Twitch chat; show the topic and recommendation change. | “The broadcaster sets the live topic in Twitch chat. Signed EventSub carries that command to StreamCart.” |
| 0:58–1:18 | Show the refreshed AI-discovered product, then select **Approve this find** as broadcaster. | “Channel3 finds candidates; the broadcaster decides. Approval changes the visible provenance and is authorized by Twitch’s signed Extension token.” |
| 1:18–1:38 | Switch to the allowlisted viewer account in Firefox and choose **Save interest** once. | “A second test account chooses when to save interest. The event stores channel, product, and action—not a viewer ID or profile.” |
| 1:38–1:58 | Open **Catalogue**, point out the **Twitch** collection, and tap one dynamically returned brand filter. Do not open a retailer page. | “The full Twitch collection comes from Channel3. Every brand in its response becomes a quick catalogue filter.” |
| 1:58–2:16 | Show SafeSearch enabled, then its opt-out control. Avoid searching for or displaying weapons. | “SafeSearch starts on. Turning it off broadens ambiguous results, while the server still blocks its mandatory weapon categories.” |
| 2:16–2:34 | Return to the actual aggregate metric. Do not seed saves; if a simulated example is used, label it on screen. | “Counts represent actions, not unique viewers. Small totals stay hidden and larger totals are grouped; this is not a guarantee of anonymity.” |
| 2:34–2:50 | Show readable footage of the primary Codex build thread and a resulting diff, then the refreshed Render `/proof/` slate with Hosted Test 0.0.6, 15 API tests, 22 listing checks, and the session ID. | “Codex built and validated this flow. The proof slate ties the Hosted Test, API checks, and implementation back to this session.” |
| 2:50–2:55 | End on the Twitch video with the compact capsule visible. | “StreamCart: creator-controlled discovery, while Twitch stays in view.” |

## Recording checklist

- Use the creator account in Chrome and the allowlisted test viewer in Firefox. Twitch Hosted Test 0.0.6 is active in Video Overlay 1; the separate Panel path is only a fallback.
- Start the channel only when the owner is ready to go live. Capture the Firefox Twitch player window, not the desktop. Do not expose the Developer Console or terminal environment.
- Do not seed artificial saves into the real channel. Counts represent actions, not verified distinct viewers. Never display secrets, JWTs, `.env`, or raw webhook headers.
- Keep one creator-approved product and one AI-discovered product in the visible result set.
- Run `npm run check` immediately before recording and retain its output as evidence.
- Confirm the final video is under three minutes and visibly demonstrates the Twitch interaction and Codex-built implementation.
- Include visible Codex footage or evidence, not narration alone. Keep the primary session ID `01a193cc-90fd-7643-9517-dfd3517e1d11` readable.
- Use no copyrighted music. Avoid opening retailer pages or dwelling on third-party branding; the Twitch interaction, StreamCart UI, and Codex evidence are the subject.
- Before recording, complete one rehearsal using only the exact path above. Do not improvise console, configuration, or alternate-product paths.
- Keep a clean validation-summary tab ready; never open `.env`, Render/Vercel settings, Twitch Developer Console, or raw webhook traffic while recording.

## Go/no-go rehearsal gates

- `npm run demo:preflight` passes. It runs the local build/tests, then checks the public API, catalogue, Twitch panel path, hash-matched Hosted Test overlay asset, live discovery, and matching enabled EventSub subscription without printing credentials.
- Public `/health` reports `mode: live` and `safeSearch: true`.
- EventSub subscription status is `enabled`.
- Twitch Extension Manager identifies Hosted Test `0.0.6` with Panel `panel.html` and Video - Fullscreen `overlay.html`; Extension Manager shows it active in Overlay 1. Its testing-account allowlist includes the broadcaster and the separate viewer account.
- Confirm that the allowlisted Firefox session sees the capsule over the stream before rehearsal. A loaded console status or local preview does not prove the overlay rendered in Twitch.
- Confirm the public Render `/proof/` page shows Hosted Test 0.0.6, 15 API tests, 22 listing checks, and the retained Codex session before showing it in the recording. These markers were verified live on 2 November at 18:34 UTC; recheck before capture.
- Broadcaster `!gear streaming microphone` changes the public discovery topic.
- Contextual discovery returns up to 20 ranked results; the separate full Twitch collection browse returns a live count. Read the on-screen count rather than promising a fixed number, and do not conflate the two counts in narration.
- The selected AI result can be approved and appears as `creator_approved` after refresh.
- The actual metric displays correctly; any simulated threshold demonstration is isolated and visibly labelled.
- Both **View product** and **View catalogue** open the intended Channel3 or StreamCart destination.
- A timed rehearsal includes both working-on-Twitch footage and visible Codex build evidence, and finishes by 2:55.

The real broadcaster command path was proven on 1 November 2026 against the public preview. Re-run it during the recorded rehearsal only after the stable EventSub callback is confirmed and the channel is live.

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
- At this earlier checkpoint, the stable deployed `/proof/` slate was refreshed and verified with Hosted Test 0.0.3, 12 API tests, 22 listing checks, and the Codex session ID. The current 0.0.4 proof verification is recorded in `docs/validation.md`.
- Twitch's design guide lists 300px as the default Panel Height (range 100–500px); the About-page panel appears about 320×335px including Twitch chrome. The panel stylesheet previously forced a 496px minimum. Version `0.0.3` removes it; visual verification on the channel showed the collapsed capsule with no inner scrollbar and the expanded card loading correctly. The expanded card remains scrollable inside Twitch's fixed panel.
- At this earlier checkpoint, version `0.0.3` was active in Panel 1 and version `0.0.2` remained available as rollback. Twitch accepted six files; SHA-256 `605129e2dc9647da453f2e0de9f16a1309115c9875eec66e40f7b6a600008e09`; uploaded MD5 `a4c5b10d9f3faf78afa89457c3ce8b19` matched local. The Hosted Test page rendered `/0.0.3/a4c5b10d9f3faf78afa89457c3ce8b19/panel.html`.
- At that earlier checkpoint, the 0.0.4 translucent candidate had not yet been uploaded; the 2 November activation and package identity are recorded in `docs/validation.md`.

## Live capture checkpoint — 2 November 2026

This checkpoint supersedes the earlier 0.0.6 references in the current recording procedure; the dated notes above remain historical.

- Twitch Hosted Test 0.0.7 is active in Video Overlay 1. The allowlisted viewer saw the live Sony microphone card after the Render API origin was added to Twitch's URL Fetching Domains.
- The broadcaster's actual `!gear streaming microphone` message remains visible in the Twitch chat history. Render discovery returned the matching topic and 20 contextual products. Show the existing message rather than sending another command solely for footage.
- The new live recording shows the card over the stream and the viewer's **Saved** state. The save click itself was not captured. Use the short recursive preview as a deliberate transition and explain that the second account shows the viewer's perspective.
- A live creator approval has not yet been verified: the current discovery response returned no creator-approved product. Do not imply that an approval was captured or verified. Label any local demonstration as such until the real broadcaster action is confirmed.
- The Render proof slate was last verified showing 0.0.6, 15 API tests, 22 listing checks, and the Codex session ID. Treat that version marker as historical unless the slate is separately refreshed; show the actual Codex thread and source when explaining the build.
- The broadcast is stopped. Finish the local edit with US narration and real Twitch and Codex footage, validate a runtime under three minutes, then obtain the separately required authorization for upload and final submission.
