# Security and privacy boundary

## Implemented for the MVP

- Channel3 keys and Twitch secrets remain in the API environment and never enter browser bundles.
- Production startup rejects demo mode or missing Channel3, Extension JWT, and EventSub secrets.
- Twitch Extension JWTs are verified with HS256, role-checked, and bound to their signed `channel_id` claim.
- EventSub uses the raw request body for HMAC verification, enforces timestamp freshness, and rejects duplicate message IDs within the replay window.
- Only a broadcaster's own `!gear <topic>` chat message changes stream context.
- Viewer intent accepts only channel, product, and action. Product membership is revalidated; no viewer ID is required or stored.
- Low-count aggregates are hidden and visible totals are bucketed in groups of five.
- SafeSearch defaults on. Weapons and weapon-specific accessories remain blocked even if SafeSearch is disabled.
- Product and image URLs require HTTPS, standard TLS port, no embedded credentials, and configured hostname allowlists.
- CORS uses an explicit origin list, JSON bodies are size-limited, and viewer writes have a bounded per-source rate limiter.
- Local persistent writes use a private file and atomic replacement. The Vercel deployment uses a private Blob store with conditional-write retries; channel and product cardinality are bounded.
- Container context excludes `.env`, data, build output, logs, and archives; runtime runs as an unprivileged user.

## Production scale-up gates

Before a multi-instance public launch, replace process-local replay and rate-limit state with shared TTL storage, move mutable state from the hackathon Blob document to a transactional managed database, add gateway-level abuse controls and observability, and rotate credentials through the deployment platform's secret manager. These are scale and operations gates, not hidden claims of the hackathon build.
