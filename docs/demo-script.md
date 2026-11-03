# StreamCart: three-minute portfolio demo recapture plan

**Status (3 November 2026):** The authenticated Devpost account showed StreamCart as **Submitted**; the [public project page](https://devpost.com/software/streamcart-yhwiup) embeds the [Unlisted demo video](https://www.youtube.com/watch?v=TIjEbeJRUt8). The player reported 106.661 seconds. The exact submission timestamp was not visible, so this does not establish whether it was submitted before the deadline. This document is now a portfolio recapture plan, not a plan for changing the judged entry. The submitted video's full visual contents were not independently reviewed; its auto-transcript describes Twitch and Codex footage but says live creator approval still needs verification. The separate 88-second local review cut is not the submitted video.

Target and maximum runtime: 2:55, leaving five seconds below the three-minute limit. Record at 1080p with the Twitch player and overlay readable.

`docs/demo-captions.srt` is the planned narration track for this run of show; it ends at 2:55 and has not been validated against the current review cut.

## Current evidence and capture gaps

- The current Hosted Test is 0.0.7. The Render proof page returns HTTP 200 and shows 0.0.7, 22 listing checks, and the retained Codex session ID.
- The latest local `npm run check` passed 20 API/security tests and 22 listing checks. Earlier live preflight evidence was 17 tests; the Render proof page still shows that deployed count until a separately approved release updates it.
- Strict release validation passed 12/12 checks on 3 November, including the production dependency audit and package/proof/caption consistency.
- The separate retained 88-second local review cut includes the live Sony microphone card, the Twitch chat command, and Channel3 results. It shows the viewer's Saved state, but does not record the save click, direct StreamCart Codex UI, or a live creator-approval click. Do not conflate it with the submitted 106.661-second video.
- Current live discovery returns 20 AI-discovered products and zero creator-approved products. No live broadcaster approval click is recorded; that action remains a required capture, not completed proof.
- The local review cut has no verified direct StreamCart Codex UI clip. `code-fresh.mp4` shows a GitHub source page, not Codex; do not use it to satisfy the Codex-footage requirement. The submitted video's alleged Codex segment has not been visually verified.

## Situation and proof

Livestream product discovery usually becomes either an unstructured link dump or invisible behavioural tracking. In under three minutes, show a movable StreamCart capsule over the Twitch video, a real Channel3 discovery, visible broadcaster approval, and explicit viewer intent from a second test account—without taking the stream out of view or creating a viewer profile.

## Presenter run of show

| Time | Action on screen | Narration |
| --- | --- | --- |
| 0:00–0:15 | Start on the live Twitch player with the compact 0.0.7 capsule in the corner; open it once. | “This is StreamCart: a small, movable discovery overlay that keeps the Twitch stream in view.” |
| 0:15–0:35 | Show the real product image, `AI DISCOVERY` or `CREATOR PICK` provenance, and the catalogue action without opening a retailer page. | “Open the capsule to see a real Channel3 product, why it appeared, and where to explore the full collection.” |
| 0:35–0:58 | As broadcaster, send `!gear streaming microphone` in Twitch chat; show the topic and recommendation change. | “The broadcaster sets the live topic in Twitch chat. Signed EventSub carries that command to StreamCart.” |
| 0:58–1:18 | Show the refreshed AI-discovered product, then select **Approve this find** as broadcaster. | “Channel3 finds candidates; the broadcaster decides. Approval changes the visible provenance and is authorized by Twitch’s signed Extension token.” |
| 1:18–1:38 | Switch to the allowlisted viewer account in Firefox and choose **Save interest** once. | “A second test account chooses when to save interest. The event stores channel, product, and action—not a viewer ID or profile.” |
| 1:38–1:58 | Open **Catalogue**, point out the **Twitch** collection, and tap one dynamically returned brand filter. Do not open a retailer page. | “The full Twitch collection comes from Channel3. Every brand in its response becomes a quick catalogue filter.” |
| 1:58–2:16 | Show SafeSearch enabled, then its opt-out control. Avoid searching for or displaying weapons. | “SafeSearch starts on. Turning it off broadens ambiguous results, while the server still blocks its mandatory weapon categories.” |
| 2:16–2:34 | Return to the actual aggregate metric. Do not seed saves; if a simulated example is used, label it on screen. | “Counts represent actions, not unique viewers. Small totals stay hidden and larger totals are grouped; this is not a guarantee of anonymity.” |
| 2:34–2:50 | Show the actual StreamCart Codex thread and resulting diff, then Render `/proof/` with Hosted Test 0.0.7, 22 listing checks, and the session ID. If showing the 17-test or 12-release-check results, capture their current command output separately; the proof page does not show those counts. | “Codex built and validated this flow. The proof slate ties the Hosted Test and implementation evidence to the retained session.” |
| 2:50–2:55 | End on the Twitch video with the compact capsule visible. | “StreamCart: creator-controlled discovery, while Twitch stays in view.” |

## Recording checklist

- Use the creator account in Chrome and the allowlisted test viewer in Firefox. Twitch Hosted Test 0.0.7 is the current build; confirm it is active in Video Overlay 1 before recording. The separate Panel path is only a fallback.
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
- Twitch Extension Manager identifies Hosted Test `0.0.7` with Panel `panel.html` and Video - Fullscreen `overlay.html`; confirm it is active in Overlay 1. Recheck that its testing-account allowlist includes the broadcaster and separate viewer.
- Confirm that the allowlisted Firefox session sees the capsule over the stream before rehearsal. A loaded console status or local preview does not prove the overlay rendered in Twitch.
- Confirm the public Render `/proof/` page shows Hosted Test 0.0.7, 17 tests, 22 listing checks, and the retained Codex session before showing it. The local proof candidate now says 20 tests; do not present that count as deployed until Render is separately updated. Recheck the live page before capture.
- Broadcaster `!gear streaming microphone` changes the public discovery topic.
- Contextual discovery returns up to 20 ranked results; the separate Twitch collection browse starts with a page and offers **Load more items** while Channel3 has another page. Read the on-screen count and do not call it the entire Channel3 network.
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
- An earlier check on 2 November showed 0.0.6 and 15 API tests on the Render proof slate. That snapshot is historical; the 3 November verification in **Current evidence and capture gaps** supersedes it. Show the actual Codex thread and source when explaining the build.
- The broadcast is stopped. Finish the local edit with US narration and real Twitch and Codex footage, validate a runtime under three minutes, then obtain the separately required authorization for upload and final submission.

## Next capture required

Do not re-label the retained review draft as the submitted video. For future portfolio material, record the actual StreamCart Codex thread and code change, then record a broadcaster's real approval action and the viewer's explicit save click. Keep the review draft clearly labelled until those scenes are verified; leave the submitted materials frozen.
