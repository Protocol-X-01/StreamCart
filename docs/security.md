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
- When `DATABASE_URL` is configured, mutable state uses a Postgres transaction and row lock. Otherwise the store can use private Blob with conditional-write retries, or a private local file with atomic replacement. Channel and product cardinality are bounded.
- Container context excludes `.env`, data, build output, logs, and archives; runtime runs as an unprivileged user.

## Production scale-up gates

Before a multi-instance public launch, replace process-local replay and rate-limit state with shared TTL storage, add gateway-level abuse controls and observability, and rotate credentials through the deployment platform's secret manager. The current Render deployment uses managed Postgres; a free database has an expiry and operational limits. These are scale and operations gates, not hidden claims of the hackathon build.

Intent metrics store aggregate action counts without viewer IDs. The signed Twitch channel ID is retained, network addresses are used transiently for rate limiting, and Twitch, Channel3, retailers and hosting infrastructure may process their own data. Ranking uses the same published five-action buckets returned to callers, so suppressed per-product counts cannot independently affect result order. Published totals remain action counts rather than unique-viewer counts; bucketing does not establish anonymity or differential privacy. This behavior remains local until its API release is deployed.

StreamCart does not build viewer profiles for advertising. Product links may earn commission; a viewer who follows one leaves StreamCart and Channel3 and the retailer may process click and device data under their own policies. Channel3 describes its click analytics and optional advertising cookies in its [privacy policy](https://connect.trychannel3.com/privacy). Do not describe this as an end-to-end absence of tracking.
