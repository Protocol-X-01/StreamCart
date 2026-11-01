# Architecture

```text
Twitch Video Component                 Browse-all catalogue
  Extension Helper JWT                         |
          |                                    |
          +------------- HTTPS API ------------+
                         |
             auth, policy, provenance,
             aggregate intent and ranking
                 |                  |
        signed EventSub webhook     +-- Channel3 /v1/search
        broadcaster !gear only          x-api-key server-side
```

The browser surfaces never receive Channel3 or Twitch secrets. The API owns Channel3 access, Twitch verification, safety policy, creator approvals, aggregate metrics, ranking, caching, and persistence. Demo mode is deterministic and explicit; production refuses to start with demo mode enabled.

Ranking combines contextual relevance, catalogue quality, creator approval, and a capped aggregate-intent boost. Public metrics are cohort-protected and bucketed. The system deliberately performs no cross-channel viewer profiling.
