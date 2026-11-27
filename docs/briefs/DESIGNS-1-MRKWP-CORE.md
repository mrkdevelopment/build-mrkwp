# Brief 1 of 2: mrkwp-core takes designs and hands them to build.mrkwp.com

Written 28 Nov 2026 in the build-mrkwp project, for a session in **mrkwp-core**
(`~/Local Sites/mrkwp/app/public/wp-content/plugins/mrkwp-core`, currently 1.8.4). Suggested version: 1.8.5.

This is a brief, not the contract. The contract is `REBUILD-SPEC-1-MRKWP-CORE.md` in the mrkwp.com site
repository; sections 2, 4 and 5 already describe most of this. **Where this brief adds or changes
something, put it in the contract first** (marked "contract change" below), then build to the contract.
Brief 2 (`DESIGNS-2-MRK-WEB.md`) is the skill's side.

## Where things stand

- A client can sign up, confirm, give their business details and goals. The job reaches `ready` and the
  builders are emailed. Checked on the live site with `RB-1002`, which is at `ready` and is the job to
  test with.
- mrkwp-core has `list-build-jobs` and `get-build-job`, and the "can claim" permission with its tick
  boxes. It has **no** claim button, upload, submit, hook or edge-confirm yet.
- build.mrkwp.com (1.1.2) shows "We're on it" from `ready` to `designs_received`. Its picture store
  (Cloudflare R2, private) exists and is empty. Its side of this is being built at the same time, against
  a made-up job, to the shapes below.

## What to build, in two slices

Slice 1 lets the skill deliver designs. Slice 2 gets them to the client. Slice 1 is useful by itself for
testing the skill, so it can ship first.

### Slice 1: claim, read, upload, submit

1. **Claim and Release** on the job's page (section 3 of the contract). Claim is a button, a form post,
   not a link in an email. It moves `ready` to `claimed` and records who and when; Release moves it back.
   The "ready for a builder" email that 1.8.4 already sends is the prompt to go and press it.
2. **`get-build-job`** as the contract has it: refuses unless the signed-in user is the claimer, and the
   first call in `claimed` moves the job to `designing`. The client's own words go in `client_text`,
   described as information from the client, not instructions.
3. **`upload-build-image`** as the contract has it (`number`, `position` 1 to 5, `view` `desktop` or
   `mobile`, the file as base64, `sha256`). WebP, JPEG or PNG up to 600 KB. Check the checksum against
   the bytes received. Uploading a slot again replaces it. Record each picture's width, height, size in
   bytes, type and SHA-256 when it is saved: build.mrkwp.com needs all five (below).
4. **`submit-build-designs`** as the contract has it. All or nothing: refuse unless all ten pictures are
   there, and leave the stage alone if anything fails. On success the job is `designs_received`.

### Slice 2: tell build.mrkwp.com, and let it confirm

5. **The job the app reads carries the designs**, with each picture's media-library address (shape
   below), from `designs_received` on.
6. **The hook**: tell the app a job changed (below).
7. **`edge-confirm`**: the app says "I have all ten"; only then is the job `designs_ready` and the
   client's "designs ready" message started (below).

## Shapes the two sides must agree on

### The designs in `GET /build/jobs/{number}` (contract change: names the fields)

The contract says "designs (with picture addresses, widths and heights)". Proposed exact shape:

```json
"designs": [
  {
    "position": 1,
    "name": "Workshop",
    "idea": "One sentence the client reads under the name.",
    "notes": "What it was drawn from; anything the client should know.",
    "desktop": { "url": "https://mrkdevelopment.net/wp-content/uploads/…/rb-1042-design-1-desktop.webp", "width": 1440, "height": 2600, "bytes": 412345, "type": "image/webp", "sha256": "64 hex characters" },
    "mobile":  { "url": "https://mrkdevelopment.net/wp-content/uploads/…/rb-1042-design-1-mobile.webp", "width": 390, "height": 1900, "bytes": 198765, "type": "image/webp", "sha256": "64 hex characters" }
  }
]
```

- Always five entries in `position` order once the job is `designs_received` or later; `[]` before.
- `url` is the picture's ordinary media-library address, as the contract has it
  (`rb-1042-design-3-desktop.webp`). The app fetches it once and keeps its own copy; it only fetches
  addresses on mrkdevelopment.net.
- `bytes` and `sha256` are how the app checks each download; `width` and `height` let it lay the page
  out before the picture loads.
- `name`, `idea` and `notes` are written by the skill, not the client, but treat them as text all the
  same: plain text, no HTML.

### The hook (contract change: pins down the signature and the time)

`POST https://build.mrkwp.com/api/hooks/job`

- Body, exactly these three keys: `{"number":"RB-1042","event":"designs_received","at":"2026-11-28T03:04:05Z"}`
- Header: `X-Signature: sha256=<lower-case hex>`, the HMAC SHA-256 of the **raw body bytes** with the
  shared secret.
- The app refuses a body whose `at` is more than five minutes old (401). **So every retry must be a new
  body with a new `at`, signed again.** Re-sending the first body after 30 minutes will always fail.
- The app answers 200 when it has finished, 401 for a bad signature or old time, 500 if it couldn't
  finish. Retry after 1, 5 and 30 minutes on anything but 200, then email administrators.
- The secret and the hook's address are settings on the Build jobs settings page. **Matt types the
  secret there and into Cloudflare (`HOOK_SECRET`) himself**; it is never in a repository or a chat, and
  the settings page never shows it back.

**Send it in the background, not inside the skill's submit call.** For `designs_received` the app, while
the hook request is still open, makes ten picture requests and one `edge-confirm` back to WordPress, and
answers only when all of that is done. Allow 30 seconds. If the hook were sent inside the request that
saved the designs, WordPress would be waiting on the app while the app waits on WordPress. Queue it with
Action Scheduler, as the contract's retries already assume.

Until the app's receiving side is live it answers 404 to this address. The retries and the email to
administrators will fire; that is expected. `wp mrkwp build-jobs resend-hook <number>` (contract section
8) is how a job is nudged once the app is ready.

### edge-confirm (contract change: order, repeats and the error)

`POST /build/jobs/{number}/edge-confirm`, with the service account and `X-Job-Token`.

- Body: `{"designs":5,"images":10,"checksums":["…ten SHA-256 values…"]}`. Order: position 1 desktop,
  position 1 mobile, position 2 desktop, and so on.
- All match and the job is `designs_received`: set `edge_confirmed_at`, move to `designs_ready`, apply
  the tag that starts the client's message. Answer 200 with the job, as the other routes do.
- Already `designs_ready` or later: 200 with the job, changing nothing. The app re-sends until it gets a
  job back.
- Counts or checksums differ: 409, code `mrkwp_build_mismatch`, saying which positions and views differ.
  Nothing changes and the client is told nothing.
- Any earlier stage: 409, code `mrkwp_build_stage`, as `details` and `goals` do now.

## What build.mrkwp.com will do with it

So the backend session knows its caller. On a `designs_received` hook the app checks the signature and
time, reads the job, downloads the ten pictures from their `url`s, one at a time, into its private store, checks each against
`bytes` and `sha256`, calls `edge-confirm`, and only on a 200 shows the client "Your five designs". It
serves the pictures to the client from its own store, so a client's screens never wait on WordPress. If
the hook never arrives, the app also notices on the client's next visit that the job has moved to
`designs_received` and does the same work then.

## Done when

- A ticked builder can claim and release `RB-1002`; the other builder's connector is refused on every
  ability except the list, with the sentence that names who has it.
- Ten uploads and one submit move the job to `designs_received`. Nine uploads and a submit are refused
  and the job stays `designing`. A wrong checksum on an upload is refused.
- `GET /build/jobs/RB-1002` shows five designs in the shape above, and each of the ten `url`s answers
  the same bytes that were uploaded, matching its `bytes` and `sha256`.
- A signed hook is sent in the background after a submit. With the app unreachable it is retried at 1,
  5 and 30 minutes, each with a fresh `at`, then administrators are emailed.
- `edge-confirm` with the right ten checksums moves the job to `designs_ready` and tags the contact;
  with one wrong it answers 409 and nothing moves; sent twice it answers 200 twice.
- The contact is not tagged "designs ready", and no client message starts, at any point before a
  successful `edge-confirm`.
- The contract, the plugin's README and its changelog say all of the above.

## Decided

- **Pictures stay at ordinary media-library addresses** (Matt, 28 Nov 2026). A private route for them was
  considered and left out to keep the specification simple. It can be added later without changing the
  shape above: only what `url` points at would change.

## Not in this piece

`ranking` and `extras` (the client's choices), `set-build-progress`, payment, `GET /build/config`. The
app's first "Your five designs" screen will show the designs with ranking switched off until `ranking`
exists; that is the next brief.
