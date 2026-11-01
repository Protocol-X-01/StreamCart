# StreamCart submission copy

## One-line pitch

StreamCart turns live Twitch context into creator-controlled product discovery, combining visible creator approval with Channel3 AI search and privacy-safe aggregate viewer intent.

## Project description

Shopping recommendations during livestreams usually force a bad choice: generic affiliate link dumps or invisible behavioural tracking. StreamCart is a Twitch Panel Extension that keeps control with the broadcaster and makes every recommendation's origin visible.

A broadcaster sets the live topic directly from Twitch chat with `!gear <topic>`. StreamCart verifies Twitch's signed EventSub webhook and accepts the command only from that channel's broadcaster. Channel3 then discovers relevant in-stock products. The broadcaster can approve an AI-discovered result in the extension, instantly changing its provenance to a creator pick.

Viewers can open a live product directly, browse the wider catalogue, filter dynamically across every brand Channel3 returns, and explicitly save interest. StreamCart does not accept or persist a viewer identity, profile, or browsing history. It stores only channel/product/action totals, hides small cohorts, and buckets visible counts. Server-side safety policy, URL allowlists, channel-bound Twitch JWT authorization, replay controls, and production fail-closed configuration protect the demo path.

## How Codex was used

Codex took over an inherited full-stack vertical slice and helped turn it into an end-to-end hackathon product. It inspected the architecture and environment boundary, repaired the initial build, verified current Twitch EventSub/Extension and Channel3 contracts, implemented the signed Twitch command path and Extension JWT authorization, built the aggregate-intent ranking and privacy thresholds, hardened credentials and outbound URLs, added automated tests and container configuration, redesigned the Twitch and catalogue experiences, and prepared the timed demo and validation evidence.

Primary Codex session/thread ID: `01a193cc-90fd-7643-9517-dfd3517e1d11`

## Technology

- Twitch Panel Extension and Extension Helper
- Twitch EventSub `channel.chat.message` webhook
- Channel3 product search
- React, Vite, TypeScript, Express, Zod
- Docker-compatible Node.js API
- Node test runner with live contract and runtime smoke checks

## Privacy statement

StreamCart ranks with contextual relevance, creator approval, catalogue quality, and capped aggregate intent. It does not construct viewer profiles or track people across channels. An intent event contains only channel, product, and action; the channel is bound to Twitch's verified Extension JWT in live mode.

## Repository and demo placeholders

- Repository: `https://github.com/Protocol-X-01/StreamCart`
- Stable production application: `https://streamcart-twitchcon.vercel.app`
- Public judge walkthrough: `https://streamcart-twitchcon.vercel.app/?channel=demo` (read-only creator actions; no Twitch credentials required)
- Twitch Hosted Test URL: `https://www.twitch.tv/ext/3z76w1eigzegdllmz3ud4l2q8bwjly-0.0.2`
- Demo video URL: add after the final sub-three-minute recording is validated.

The Hosted Test URL is recording evidence for the owner's Twitch account, not a judge-install route. Twitch's hackathon FAQ states that judges cannot install an unreviewed Extension; judges receive the public walkthrough, repository instructions, and the video showing the Extension functioning inside Twitch.
