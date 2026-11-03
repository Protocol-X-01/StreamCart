# Codex x TwitchCon submission checklist

Updated 3 November 2026. The authenticated Devpost account showed StreamCart as **Submitted** and the [public project page](https://devpost.com/software/streamcart-yhwiup) is available. The exact submission timestamp was not visible, so deadline compliance is unverified.

## Deadline and record status

- **2 November 2026, 2:00 PM Pacific (PST) / 10:00 PM London / 10:00 PM UTC — passed.**
- A saved draft is not an entry. The Devpost project must show **Submitted** before the deadline.
- The account showed **Submitted** on 3 November; this is after the deadline and does not establish when the entry was submitted.

## Required deliverables

| Requirement | StreamCart evidence | Status |
| --- | --- | --- |
| Repository containing source, assets, and run instructions | `https://github.com/Protocol-X-01/StreamCart` and `README.md` | Public repository; GitHub `main` is at `3c0ebe4` |
| Text description covering features and Codex use | `docs/submission.md` | Public project page exists; the submitted form's exact save timestamp is not visible |
| Primary Codex session ID | `01a193cc-90fd-7643-9517-dfd3517e1d11` | Ready |
| YouTube demo under three minutes | [Unlisted video](https://www.youtube.com/watch?v=TIjEbeJRUt8) embedded on the public project page | Player reported 106.661 seconds; captions were reviewed and six visual moments sampled; exact upload settings remain partly unverified |
| Footage showing the project functioning on Twitch | Submitted video captions and sampled frames show Twitch, the chat topic, and product discovery | Captions say broadcaster approval still needs live verification; no approval or viewer-save click is visible in the sampled footage |
| Footage showing how Codex built the project | Submitted video captions mention a build segment | A code/editor segment appears, but direct StreamCart Codex UI is not clearly visible |
| YouTube title, description, settings, and upload validation | `docs/youtube-upload.md` | Public project page links the video; full upload settings were not independently validated |
| One-screen Codex and validation slate | `https://streamcart-twitchcon-site-20261102.onrender.com/proof/` | Public static site still shows 0.0.7 and 20 tests; local candidate is updated to 0.0.8 and 29 tests, pending a separate static-site release |
| Twitch Hosted Test package | Version `0.0.8`, hash-matched, configured for Panel + Video - Fullscreen | Twitch Extension Manager showed it active in Overlay 1 on 3 November 2026 |
| Test viewer access | Version-specific Testing Account Allowlist | Verify the current list before the next two-account rehearsal |
| Separate portfolio video review cut | `outputs/streamcart-evidence/2026-11-03T0624Z-portfolio-demo-v4/streamcart-portfolio-demo-review-v4.mp4` | 89.767 seconds; private and not uploaded; no recorded broadcaster approval or viewer save click |
| Final Devpost Submit action | [Public project page](https://devpost.com/software/streamcart-yhwiup) | Authenticated account showed **Submitted** on 3 November; exact submission time is unknown |

## Judge access

- The official FAQ warns that judges cannot install an unreviewed Extension.
- Use Hosted Test to record the real Twitch experience with the creator in Chrome and the allowlisted viewer in Firefox.
- Give judges the public standalone walkthrough, catalogue, repository, and validation record.
- Do not state or imply that Hosted Test is publicly installable or Twitch-approved.

## Video compliance

- Final duration must be below 3:00; target 2:45–2:55.
- Upload to YouTube as Public or Unlisted, never Private.
- Show the working Twitch experience and visible Codex build evidence.
- Use real footage of the running application; screenshots or slides alone do not qualify.
- Do not display secrets, JWTs, `.env`, webhook headers, the Developer Console, or account settings.
- Do not include copyrighted music. Avoid retailer pages and unnecessary third-party marks.
- Validate the final uploaded YouTube URL in a signed-out window before entering it on Devpost.

## Freeze after submission

The deadline has passed. Do not change judged materials; use a separate copy for portfolio improvements. The local v4 review cut is separate from the linked submission video. The Render API is current on 3c0ebe4, while the static proof page still reflects the earlier 4d710c2 site release. A later public proof refresh needs its own approval.
