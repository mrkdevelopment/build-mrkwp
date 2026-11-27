# Start here

Written 27 Nov 2026 for the first session that builds this app. It says what already exists, what to
build first, and what is waiting on something else. `SPECIFICATION.md` is the full brief; this page is
the state of play and should be updated as things change.

## Where things stand

| Piece | State on 27 Nov 2026 |
|---|---|
| **This app** | Nothing built. This repository has the specification, the design system and the logo |
| **mrkdevelopment.net** (mrkwp-core 1.8.1) | **Live.** Sign-ups become numbered jobs, the client is emailed their private link, the builders are emailed. Three routes exist for this app (below). Tested with a real sign-up: job `RB-1001` |
| **www.mrkwp.com sign-up form** | Not built. Until it is, sign-ups are made by posting to the rebuild webhook by hand |
| **MRK-Web job mode** | Not built. Specified in the MRK-Web repository |

So today a person can sign up (by hand), get an email with a link to
`https://build.mrkwp.com/rebuild/RB-1001?k=<code>`, and that link opens nothing. **Making that link open
something is the first job here.**

## Before any code: three things from Matt

1. **Which Cloudflare account** this project is created in. Matt has several, including clients'. List
   them and wait for his answer. Never guess.
2. **A service account on mrkdevelopment.net.** In WordPress: Users → Add New, with the role **MRK Build
   API (service account)**, then an application password on that user's profile. Matt types the user
   name and password into Cloudflare's secrets and into a local `.dev.vars` file himself. They never go
   in the chat or the repository.
3. **The firewall user agent.** The same value the main site's builds use (`WP_USER_AGENT`), as a secret
   here too. Requests to mrkdevelopment.net without it risk being blocked.

## What the backend offers today

Base: `https://mrkdevelopment.net/wp-json/mrkwp/v1/build`. Every call signs in with the service
account's application password (Basic auth) and sends the firewall user agent.

| Call | Needs | Answers |
|---|---|---|
| `GET /jobs/{number}` | `X-Job-Token: <code>` | 200 with the client's view of the job |
| `PATCH /jobs/{number}` with `{"action":"confirm"}` | `X-Job-Token: <code>` | 200 with the job, now at `confirmed`. Safe to send twice. Any other action: 400 |
| `POST /jobs` | The sign-up fields | 201 `{number, created: true}`, or 200 with `created: false` for someone who already has an open job. Never returns the code. This app has no reason to call it |

Things to rely on:

- **A wrong number, a wrong code and a missing code all answer 404**, with the same body. Show one
  "this link isn't right" page for all three.
- **No sign-in answers 401.**
- **The client's view** has exactly these keys: `number`, `product`, `stage`, `created_at` (UTC, ends in
  `Z`), `first_name`, `business`, `scan`, `goals`, `designs`, `ranking`, `extras`, `price`, `demo`.
  It never has the email, phone, who claimed the job, costs or history.
- **Empty parts arrive as `[]`, not `{}`.** `business`, `scan`, `ranking`, `extras`, `price`, `demo` are
  objects once filled, but PHP sends an empty one as an empty list. Treat `[]` as "nothing yet" when
  reading them.
- **`designs` is empty** until design uploads are built on the backend.
- **Stages** a job can be at are listed in section 2 of `REBUILD-SPEC-1-MRKWP-CORE.md` (see `CLAUDE.md`
  for where that file is). Today a real job only ever reaches `signed_up` and `confirmed`. The app
  should still have a screen for every stage, because the backend's stage table already knows them all.
- When a job is confirmed, the backend tags the contact `rebuild: confirmed` in FluentCRM on its own.
  This app does nothing about FluentCRM, ever.

A real job to test against: `RB-1001`. Its code is in the "Build job link" field of that contact in
FluentCRM (`website_rebuild@mrkdev.com`). Matt can read it there; do not ask him to paste it in chat.
Put it in `.dev.vars` as a test value.

## What the backend does not offer yet

Each of these is a later version of mrkwp-core. The specification already describes them; they are not
built. **Ask Matt to have the backend piece built when this app reaches the phase that needs it.**

| This app's phase | Backend piece it needs | Until then |
|---|---|---|
| Your business, the scans, What you want | `PATCH` actions `details` and `goals` | Save to D1 and leave the rows in the outbox. Nothing is lost; they send when the backend can take them |
| Designs | The designs upload, the hook that tells this app a job changed, `edge-confirm` | Build against a made-up job in D1 with ten placeholder pictures in R2 |
| Ranking and extras | `PATCH` actions `ranking` and `extras` | Outbox, as above |
| Price | `GET /config` (the price table, care plans, booking link) | A config file in this repo with the same shape, marked as a stand-in |
| Payment | `POST /jobs/{number}/payment` | Stripe test mode end to end; the outbox holds the report |
| Demo and approval | `PATCH` actions `approve` and `request_changes`; the `demo` fields | Made-up job |
| Lost link | `POST /jobs/resend-link` | Leave the box out |

**The hook isn't built, so pull.** Section 4 of the specification has mrkdevelopment.net telling this app
when a job changes. Until that exists, the app fetches the job itself: on a client's first visit, and
again on any later visit when its copy is more than a minute old. Keep that pull as a permanent fallback
after the hook exists.

**The outbox must cope with "not built yet".** A `PATCH` the backend doesn't know answers 400 today. Treat
400 with the code `mrkwp_build_action` as "try again later", not as a failure to show the client, and
keep the row.

## Build this first

The first phase from section 11 of the specification, cut to what works against the live backend today:

1. The project: Astro with the Cloudflare adapter, D1, R2, the secrets, the custom domain. Check the
   adapter's set-up against the Astro docs first.
2. **Link sign-in.** `/rebuild/RB-1001?k=<code>`: fetch the job with the code. On 404, the "this link
   isn't right" page. On 200, store the job and the encrypted code in D1, set the session cookie, and
   redirect to `/rebuild/RB-1001` with no code in the address.
3. **Welcome screen** for `signed_up`: "Thanks, {first name}. Let's get to know your business." The
   Start button sends `confirm`. This is the first thing that changes the live backend, and it can be
   checked there: the job moves to `confirmed` and the contact gets the `rebuild: confirmed` tag.
4. **A holding screen for `confirmed`**: the job number, and that the next step is coming. Replaced by
   "Your business" in the next phase.
5. The stage-to-screen map with a plain placeholder for every other stage, the progress strip, the
   layout from `DESIGN.md`, `noindex` everywhere, the `/` page.
6. The outbox and its one-minute worker, even though only `confirm` uses it yet. Everything after
   depends on it.

Done when: the link in a real confirm email opens the welcome screen on a phone; Start moves the real
job to `confirmed`; a wrong code shows the "isn't right" page; another job's number with this session
shows nothing; and with mrkdevelopment.net unreachable, a job already opened still opens.

Then phase 2: "Your business" and the scans (section 5), which need nothing from the backend to build
and test, since scan results are saved here first.

## Small things that will save time

- Job numbers are two capital letters, a dash, four or more digits: `^[A-Z]{2}-\d{4,}$`. The backend
  accepts lower case in the address and upper-cases it; do the same.
- The code is 43 characters, letters, digits, `-` and `_`.
- The product is in the path (`/rebuild/`) and on the job (`product: "rebuild"`). If they disagree,
  show the "isn't right" page.
- The backend's own description of these routes, with curl examples, is in the plugin:
  `docs/BUILD-JOBS-1.8.0.md` in mrkwp-core.
- The logo file here is 128 px. The home-screen icons need 192 and 512 px. Ask Matt for a larger logo
  (an SVG is best) before the installable part; don't scale the small one up.
