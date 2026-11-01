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
| 1:40–1:56 | Open **Catalogue** and tap one brand chip while showing creator-pick versus AI-discovery labels. Do not open a retailer page. | “Channel3 supplies the live catalogue. StreamCart turns the returned brands into instant filters while keeping the same server-side safety policy and visible provenance.” |
| 1:56–2:12 | Return to the prepared five-save cohort. | “Counts stay hidden below five and are then bucketed. A single viewer can’t be inferred from an exact low number.” |
| 2:12–2:31 | Show the clean public `/proof/` slate with the Codex session ID, validated live path, and test counts. | “Codex took over the vertical slice, verified the Twitch and Channel3 contracts, built the signed authority and privacy boundaries, and kept the release evidence tied to this session.” |
| 2:31–2:45 | Show the concise validation summary, not environment files or raw headers. | “The live Twitch subscription is enabled, Channel3 returns real products, and CI covers builds, eleven API tests, 22 listing checks, and the dependency audit.” |
| 2:45–2:55 | End on the approved Twitch product card. | “StreamCart: creator-controlled discovery, useful AI, and privacy by design—inside Twitch.” |

## Recording checklist

- Use a test broadcaster account and Twitch Hosted Test; do not expose the Developer Console or terminal environment.
- Pre-seed five aggregate saves for the cohort-safe metric moment. Never display secrets, JWTs, `.env`, or raw webhook headers.
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
- Broadcaster `!gear streaming microphone` changes the public discovery topic.
- The selected AI result can be approved and appears as `creator_approved` after refresh.
- The prepared cohort displays a bucketed total of at least five.
- Both **View product** and **View catalogue** open the intended destination.
- A timed rehearsal includes both working-on-Twitch footage and visible Codex build evidence, and finishes by 2:55.

The real broadcaster command path was proven on 1 November 2026 against the public preview. Re-run it during the recorded rehearsal only after the final stable deployment and EventSub callback are in place.

## Failure-safe route

If Twitch or Channel3 is unavailable during recording, do not pretend the live path worked. Use the deterministic local demo only as a clearly labelled fallback, retain the successful live-smoke evidence, and re-record the Twitch portion when Hosted Test is restored.

## Likely judge questions

- **Why is this not invasive tracking?** No viewer identifier is accepted or persisted; intent is an explicit click and only channel/product/action totals are stored.
- **What does the AI decide?** Channel3 supplies candidates; StreamCart applies safety policy, creator approval provenance, contextual relevance, and capped aggregate-signal ranking.
- **Can a viewer spoof another channel?** Live writes use the verified channel claim from Twitch’s signed Extension JWT and reject a body/channel mismatch.
- **What is production-ready versus hackathon-ready?** The demo is end-to-end and fail-closed. Multi-instance production would add a shared replay store, distributed rate limiter, and managed database.
