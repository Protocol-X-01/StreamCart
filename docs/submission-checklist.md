# Codex x TwitchCon submission checklist

Verified against the official Devpost overview and FAQ on 1 November 2026; deadline and real-footage requirement rechecked against the [official final-weekend update](https://twitchcon-codex.devpost.com/updates/47341-final-weekend-make-your-project-come-alive) on 2 November.

## Hard deadline

- **2 November 2026, 2:00 PM Pacific (PST) / 10:00 PM London / 10:00 PM UTC.**
- A saved draft is not an entry. The Devpost project must show **Submitted** before the deadline.
- Submit early; the FAQ says the entry can be edited until the deadline, but not afterward.

## Required deliverables

| Requirement | StreamCart evidence | Status |
| --- | --- | --- |
| Repository containing source, assets, and run instructions | `https://github.com/Protocol-X-01/StreamCart` and `README.md` | Ready |
| Text description covering features and Codex use | `docs/submission.md` | Ready |
| Primary Codex session ID | `01a193cc-90fd-7643-9517-dfd3517e1d11` | Ready |
| Publicly visible YouTube demo under three minutes | URL pending recording/upload | **Missing** |
| Footage showing the project functioning on Twitch | Timed Hosted Test sequence in `docs/demo-script.md` | Pending recording |
| Footage showing how Codex built the project | Timed Codex evidence beat in `docs/demo-script.md` | Pending recording |
| YouTube title, description, settings, and upload validation | `docs/youtube-upload.md` | Ready |
| One-screen Codex and validation slate | `https://streamcart-twitchcon.vercel.app/proof/` | Refreshed deployment verified |
| Twitch Hosted Test package | Version `0.0.3`, hash-matched and active in Panel 1 | Installed and visually verified; fresh real-chat rehearsal pending |
| Final Devpost Submit action | Owner-controlled | **Missing** |

## Judge access

- The official FAQ warns that judges cannot install an unreviewed Extension.
- Use Hosted Test to record the real Twitch experience on the owner account.
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
