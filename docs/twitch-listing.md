# Twitch listing and visual pack

Prepared: 1 November 2026.

These assets follow Twitch's current Extension requirements and deliberately avoid Twitch branding, third-party logos, advertising, prices, and personal data.

The authoritative copy is stored in `assets/twitch/listing.json` and is checked by `npm run validate:twitch-listing` before upload.

## Listing copy

- **Name:** StreamCart
- **General category:** Viewer Engagement
- **Summary (140 characters):** Creator-controlled product discovery: set the live topic in chat, approve AI finds, and let viewers save interest without personal tracking.
- **Viewer summary (136 characters):** Explore products matched to the live topic, see which finds the creator approved, and save interest without creating a personal profile.
- **Description:** StreamCart gives creators control over live product discovery. The broadcaster sets the current topic with `!gear <topic>` in their own channel chat; StreamCart accepts that command only after Twitch verifies the signed EventSub message and broadcaster identity. Channel3 then discovers relevant products. The creator can approve or remove a find, making its source clear to viewers. Viewers can explore the catalogue and explicitly save interest. StreamCart does not build viewer profiles or track people across channels: it retains channel/product/action totals, hides small cohorts, and shows only bucketed aggregate interest.

## Image assets

| Twitch field | Project file | Required size | Validation |
| --- | --- | --- | --- |
| Logo | `assets/twitch/logo-100x100.png` | 100 x 100 PNG | RGB, 11.7 KB |
| Taskbar icon | `assets/twitch/taskbar-24x24.png` | 24 x 24 PNG | RGBA, under 1 KB |
| Discovery image | `assets/twitch/discovery-300x200.png` | 300 x 200 PNG | RGB, 68.7 KB, opaque |
| Screenshot | `assets/twitch/screenshot-1024x768.png` | 1024 x 768 PNG | RGB, 4:3, under 10 MB |

Editable vector sources for the taskbar icon and listing screenshot are retained beside the final PNG files. The logo and discovery artwork were generated with the built-in image-generation workflow using StreamCart's existing ink, violet, coral, and soft-white palette, then resized and audited locally.

## Review boundary

Moving the extension back to Local Test, editing Version Details, uploading these files, and returning it to Hosted Test are external changes and require owner approval. Submitting for public review remains a separate action.

Before public review, re-check the live product-link behavior against Twitch Extension policy 4.6.3. Twitch currently states that off-site links may not lead to sites whose main purpose is selling products or services unless they are Twitch/Amazon properties (subject to the policy's stated exceptions). Hosted Test and the hackathon demo do not prove public-review acceptance.
