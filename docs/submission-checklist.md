# Codex x TwitchCon submission checklist

Updated 3 November 2026. The authenticated Devpost account showed StreamCart as **Submitted** and the [public project page](https://devpost.com/software/streamcart-yhwiup) is available. The exact submission timestamp was not visible, so deadline compliance is unverified.

## Deadline and record status

- **2 November 2026, 2:00 PM Pacific (PST) / 10:00 PM London / 10:00 PM UTC — passed.**
- A saved draft is not an entry. The Devpost project must show **Submitted** before the deadline.
- The account showed **Submitted** on 3 November; this is after the deadline and does not establish when the entry was submitted.

## Required deliverables

| Requirement | StreamCart evidence | Status |
| --- | --- | --- |
| Repository containing source, assets, and run instructions | `https://github.com/Protocol-X-01/StreamCart` and `README.md` | Public repository; `main` is at `4d710c2` |
| Text description covering features and Codex use | `docs/submission.md` | Public project page exists; the submitted form's exact save timestamp is not visible |
| Primary Codex session ID | `01a193cc-90fd-7643-9517-dfd3517e1d11` | Ready |
| YouTube demo under three minutes | [Unlisted video](https://www.youtube.com/watch?v=TIjEbeJRUt8) embedded on the public project page | Player reported 106.661 seconds; exact submitted settings and full visual contents were not independently reviewed |
| Footage showing the project functioning on Twitch | Submitted video auto-transcript mentions Twitch chat and the overlay | Transcript also says live creator approval still needs verification; do not claim an approval click was shown |
| Footage showing how Codex built the project | Submitted video auto-transcript mentions a build segment | Segment was not visually reviewed; direct StreamCart Codex UI footage is unverified |
| YouTube title, description, settings, and upload validation | `docs/youtube-upload.md` | Public project page links the video; full upload settings were not independently validated |
| One-screen Codex and validation slate | `https://streamcart-twitchcon-site-20261102.onrender.com/proof/` | HTTP 200; displays Hosted Test 0.0.7, 20 automated tests, 22 listing checks, and the retained session ID |
| Twitch Hosted Test package | Version `0.0.7`, hash-matched, configured for Panel + Video - Fullscreen | Last retained evidence says active in Overlay 1; no new Twitch setting was changed in this audit |
| Test viewer access | Version `0.0.7` Testing Account Allowlist | Last retained evidence says saved and rechecked; not rechecked in this audit |
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

The deadline has passed. Do not change judged materials; use a separate copy for portfolio improvements. The local v4 review cut is separate from the linked submission video. The Vercel proof alias remains on 0.0.4; the current 0.0.7 release evidence is on Render.
