# StreamCart: three-minute submission demo

Target runtime: 2:40. Hard stop: 2:55. Record at 1080p with the Twitch player, chat, and StreamCart panel readable.

## Situation and proof

Livestream product discovery usually becomes either an unstructured link dump or invisible behavioural tracking. In under three minutes, prove the opposite: a creator changes the live shopping context from Twitch, AI finds relevant real products, the creator visibly approves one, and a viewer expresses interest without creating a viewer profile.

## Presenter run of show

| Time | Action on screen | Narration |
| --- | --- | --- |
| 0:00–0:18 | Start on the expanded Twitch **Finds** card showing a creator pick beside its privacy-safe aggregate. | “This is the result: a relevant product inside Twitch, visibly approved by the creator, with viewer interest shown only after a safe cohort forms.” |
| 0:18–0:38 | Collapse and reopen **Finds**; point to the provenance label and **View product** action. | “StreamCart combines creator picks with live Channel3 discovery. Every recommendation explains where it came from, and viewers can open the real product or the full catalogue.” |
| 0:38–1:02 | As broadcaster, send `!gear streaming microphone` in Twitch chat and show the recommendation context change. | “The creator steers the AI from Twitch chat. A signed EventSub webhook accepts this command only from that broadcaster.” |
| 1:02–1:22 | Show an AI-discovered microphone, then select **Approve this find** as broadcaster. | “The AI proposes; the creator decides. Approval changes the provenance in place, and the API binds that write to Twitch’s signed channel claim.” |
| 1:22–1:40 | Show the viewer form of the card and select **Save interest** once. | “Viewer intent is explicit. StreamCart stores no viewer ID, profile, or browsing history—only channel, product, action, and aggregate count.” |
| 1:40–1:58 | Open **Catalogue** and show creator-pick versus AI-discovery labels. | “The browse-all catalogue uses the same server-side safety policy and keeps provenance visible across every result.” |
| 1:58–2:15 | Return to the prepared five-save cohort. | “Counts stay hidden below five and are then bucketed. A single viewer can’t be inferred from an exact low number.” |
| 2:15–2:34 | Show the concise validation summary, not environment files or raw headers. | “The live Twitch subscription is enabled, Channel3 returns real products, secrets stay server-side, and nine automated tests cover signatures, authority, privacy, CORS, and fail-closed configuration.” |
| 2:34–2:50 | End on the approved Twitch product card. | “StreamCart: creator-controlled discovery, useful AI, and privacy by design—inside Twitch.” |

## Recording checklist

- Use a test broadcaster account and Twitch Hosted Test; do not expose the Developer Console or terminal environment.
- Pre-seed five aggregate saves for the cohort-safe metric moment. Never display secrets, JWTs, `.env`, or raw webhook headers.
- Keep one approved product and one AI-discovered product in the visible result set.
- Run `npm run check` immediately before recording and retain its output as evidence.
- Confirm the final video is under three minutes and visibly demonstrates the Twitch interaction and Codex-built implementation.
- Before recording, complete one rehearsal using only the exact path above. Do not improvise console, configuration, or alternate-product paths.
- Keep a clean validation-summary tab ready; never open `.env`, Vercel settings, Twitch Developer Console, or raw webhook traffic while recording.

## Go/no-go rehearsal gates

- `npm run demo:preflight` passes. It runs the local build/tests, then checks the public API, catalogue, Twitch panel, live discovery, and matching enabled EventSub subscription without printing credentials.
- Public `/health` reports `mode: live` and `safeSearch: true`.
- EventSub subscription status is `enabled`.
- Broadcaster `!gear streaming microphone` changes the public discovery topic.
- The selected AI result can be approved and appears as `creator_approved` after refresh.
- The prepared cohort displays a bucketed total of at least five.
- Both **View product** and **View catalogue** open the intended destination.
- A timed rehearsal finishes by 2:50 without showing credentials or developer consoles.

The real broadcaster command path was proven on 1 November 2026 against the public preview. Re-run it during the recorded rehearsal only after the final stable deployment and EventSub callback are in place.

## Failure-safe route

If Twitch or Channel3 is unavailable during recording, do not pretend the live path worked. Use the deterministic local demo only as a clearly labelled fallback, retain the successful live-smoke evidence, and re-record the Twitch portion when Hosted Test is restored.

## Likely judge questions

- **Why is this not invasive tracking?** No viewer identifier is accepted or persisted; intent is an explicit click and only channel/product/action totals are stored.
- **What does the AI decide?** Channel3 supplies candidates; StreamCart applies safety policy, creator approval provenance, contextual relevance, and capped aggregate-signal ranking.
- **Can a viewer spoof another channel?** Live writes use the verified channel claim from Twitch’s signed Extension JWT and reject a body/channel mismatch.
- **What is production-ready versus hackathon-ready?** The demo is end-to-end and fail-closed. Multi-instance production would add a shared replay store, distributed rate limiter, and managed database.
