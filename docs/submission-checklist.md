# Codex x TwitchCon submission checklist

Verified against the official Devpost overview and FAQ on 1 November 2026; deadline and real-footage requirement rechecked against the [official final-weekend update](https://twitchcon-codex.devpost.com/updates/47341-final-weekend-make-your-project-come-alive) on 2 November.

## Hard deadline

- **2 November 2026, 2:00 PM Pacific (PST) / 10:00 PM London / 10:00 PM UTC.**
- A saved draft is not an entry. The Devpost project must show **Submitted** before the deadline.
- Submit early; the FAQ says the entry can be edited until the deadline, but not afterward.

## Required deliverables

| Requirement | StreamCart evidence | Status |
| --- | --- | --- |
| Repository containing source, assets, and run instructions | `https://github.com/Protocol-X-01/StreamCart` and `README.md` | Existing public repository; reconcile the final candidate and README before submission |
| Text description covering features and Codex use | `docs/submission.md` | Ready |
| Primary Codex session ID | `01a193cc-90fd-7643-9517-dfd3517e1d11` | Ready |
| Publicly visible YouTube demo under three minutes | URL pending recording/upload | **Missing** |
| Footage showing the project functioning on Twitch | Fresh Hosted Test 0.0.7 recording with the live product card | Captured; edit and validate the final video |
| Footage showing how Codex built the project | Fresh capture of the Codex thread, source, and run-sheet update | Captured; edit and validate the final video |
| YouTube title, description, settings, and upload validation | `docs/youtube-upload.md` | Ready |
| One-screen Codex and validation slate | `https://streamcart-twitchcon-site-20261102.onrender.com/proof/` | Candidate shows 0.0.7, 17 automated tests, 22 listing checks, and the session ID; verify the deployed page before submission |
| Twitch Hosted Test package | Version `0.0.7`, hash-matched, configured for Panel + Video - Fullscreen, and active in Overlay 1 | Viewer card verified in-player; broadcaster approval remains unverified |
| Test viewer access | Broadcaster and two viewer accounts in the 0.0.7 Testing Account Allowlist | Saved and rechecked; the separate viewer saw the product card |
| Final Devpost Submit action | Owner-controlled | **Missing** |

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

The FAQ says not to change the submission, linked repository, video, or linked materials after the deadline until winners are announced. If development continues, use a separate copy rather than changing the judged artifact.
