# StreamCart submission copy

## One-line pitch

StreamCart turns live Twitch context into creator-controlled product discovery, combining visible creator approval with Channel3 AI search and explicit viewer intent and aggregate action counts.

## Project description

Shopping recommendations during livestreams usually force a bad choice: generic affiliate link dumps or invisible behavioural tracking. StreamCart is a Twitch video overlay with a compact, movable capsule that keeps the stream in view. A compatible Panel entry remains available, while the active Hosted Test is in Video Overlay 1.

The Twitch-hosted experience is still a Twitch Extension; “Video - Fullscreen” is its overlay presentation mode. The public judge walkthrough is a separate standalone preview page, not an OBS Browser Source configuration.

A broadcaster sets the live topic directly from Twitch chat with `!gear <topic>`. StreamCart verifies Twitch's signed EventSub webhook and accepts the command only from that channel's broadcaster. Channel3 then discovers relevant in-stock products. The broadcaster can approve an AI-discovered result in the extension, instantly changing its provenance to a creator pick.

Viewers can open a live product directly, browse the wider catalogue, filter dynamically across every brand Channel3 returns, and explicitly save interest. The application stores channel/product/action totals rather than viewer profiles or browsing histories. It suppresses small displayed action counts and buckets larger counts; aggregate ranking and infrastructure metadata are not guarantees of anonymity. Server-side safety policy, URL allowlists, channel-bound Twitch JWT authorization, replay controls, and production fail-closed configuration protect the demo path.

## How Codex was used

Codex took over an inherited full-stack vertical slice and helped turn it into an end-to-end hackathon product. It inspected the architecture and environment boundary, repaired the initial build, verified current Twitch EventSub/Extension and Channel3 contracts, implemented the signed Twitch command path and Extension JWT authorization, built the aggregate-intent ranking and privacy thresholds, hardened credentials and outbound URLs, added automated tests and container configuration, redesigned the Twitch and catalogue experiences, and prepared the timed demo and validation evidence.

Primary Codex session/thread ID: `01a193cc-90fd-7643-9517-dfd3517e1d11`

## Technology

- Twitch Video - Fullscreen overlay, Panel fallback, and Extension Helper
- Twitch EventSub `channel.chat.message` webhook
- Channel3 product search
- React, Vite, TypeScript, Express, Zod
- Docker-compatible Node.js API
- Node test runner with live contract and runtime smoke checks

## Privacy statement

StreamCart ranks with contextual relevance, creator approval, catalogue quality, and capped aggregate intent. The application does not construct viewer profiles or track people across channels. Its intent payload contains channel, product, and action; the channel is bound to Twitch's verified Extension JWT in live mode. The service and its hosting providers may process normal request metadata, and suppressing displayed counts does not guarantee anonymity.

## Submitted entry record

- Devpost project: https://devpost.com/software/streamcart-yhwiup
- Embedded Unlisted video: https://www.youtube.com/watch?v=TIjEbeJRUt8
- The authenticated account showed **Submitted** on 3 November 2026. The exact submission timestamp was not visible; this record does not establish on-time submission.
- The separate private 88-second review cut is not the submitted video. See `docs/validation.md` for verification limits.

## Repository and demo links

- Repository: `https://github.com/Protocol-X-01/StreamCart`
- Live application: `https://streamcart-twitchcon-site-20261102.onrender.com`
- Public judge walkthrough: `https://streamcart-twitchcon-site-20261102.onrender.com/?channel=demo` (read-only creator actions; no Twitch credentials required)
- Validation proof: `https://streamcart-twitchcon-site-20261102.onrender.com/proof/`
- Twitch Hosted Test URL: `https://www.twitch.tv/ext/3z76w1eigzegdllmz3ud4l2q8bwjly-0.0.7`
- Submitted demo video: `https://www.youtube.com/watch?v=TIjEbeJRUt8` (YouTube player reported 106.661 seconds).

Render hosts the public application and API. The existing `https://streamcart-twitchcon.vercel.app` origin remains the Twitch API and EventSub callback proxy to the Render API.

The Hosted Test URL is recording evidence for the broadcaster and the allowlisted test account, not a judge-install route. Twitch's hackathon FAQ states that judges cannot install an unreviewed Extension; judges receive the public walkthrough, repository instructions, and the video showing the Extension functioning inside Twitch.
