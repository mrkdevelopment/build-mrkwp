# Brief 1 of 2: mrkwp-core takes designs; build.mrkwp.com reads them

Rewritten 28 Nov 2026. **Matt threw out the first version of this brief as over-built.** It had a signed
hook from WordPress to this app, a shared secret, retries, checksums on every picture and an
"edge-confirm" call before the client was told. None of that is being built, on either side. Do not
build any of it here.

The contract is `REBUILD-SPEC-1-MRKWP-CORE.md` in the mrkwp.com site repository (section 4, 4.1, 4.2 and
section 5). This page is a summary of it for this project.

## How it works now

1. A builder presses **Claim** on the job's page in WordPress.
2. The MRK-Web skill, through the mrkdevelopment.net connector, reads the job, uploads **ten pictures to
   the WordPress media library** and submits **five designs** (name, idea, notes).
3. On submit the job goes straight to `designs_ready` and the contact is tagged, which starts the
   client's "your designs are ready" message.
4. **This app asks WordPress for the job; WordPress sends this app nothing.** The app already reads a
   job with `GET /build/jobs/{number}` when the client visits and its copy is more than a minute old.
   That is the whole mechanism. No hook, no secret, no confirm call.

## What the job looks like

`GET /build/jobs/{number}`, once the stage is `designs_ready`:

```json
"designs": [
  {
    "position": 1,
    "name": "Workshop",
    "idea": "One sentence the client reads under the name.",
    "notes": "What it was drawn from; anything the client should know.",
    "desktop": { "url": "https://mrkdevelopment.net/wp-content/uploads/2026/11/rb-1042-design-1-desktop.webp", "width": 1440, "height": 2600 },
    "mobile":  { "url": "https://mrkdevelopment.net/wp-content/uploads/2026/11/rb-1042-design-1-mobile.webp", "width": 390, "height": 1900 }
  }
]
```

- Five entries in `position` order; `[]` before the designs are submitted.
- `name`, `idea` and `notes` are plain text written by the skill. Escape them like any other text.
- `url` is an ordinary media-library address. `width` and `height` are for laying the page out.

## What this app builds

- **"Your five designs"** when the stage is `designs_ready`: five cards with the name, idea, notes and
  the two pictures, shown **straight from their `url`**. Only show addresses on mrkdevelopment.net.
- From `ready` to `designs_received` it keeps showing "We're on it", as now. (`designs_received` lasts
  an instant, but the stage still exists.)
- Ranking stays switched off until the backend takes `ranking`; that is the next piece.

## What this app does not build

- `/api/hooks/job`, `HOOK_SECRET`, signature or time checks.
- Downloading the pictures into R2, byte counts, SHA-256 checks, or `edge-confirm`. The R2 store stays
  empty for now.
- Serving pictures through the app. They are public at their media-library addresses; Matt has accepted
  that.

## What is given up, knowingly

- If mrkdevelopment.net is down, a client's designs do not show until it is back.
- A picture uploaded again keeps its address, so an old copy may show for a while.
- Nothing checks automatically that a picture arrived whole.

## Done when

- With `RB-1002` at `designs_ready` on mrkdevelopment.net, opening its link shows five designs with ten
  pictures on a phone.
- Before that stage the client still sees "We're on it".
- No picture address outside mrkdevelopment.net is ever put in the page.
