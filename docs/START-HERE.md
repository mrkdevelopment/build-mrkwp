# Start here

Written 27 Nov 2026 for the first session that builds this app. It says what already exists, what to
build first, and what is waiting on something else. `SPECIFICATION.md` is the full brief; this page is
the state of play and should be updated as things change.

## Where things stand

| Piece | State on 27 Nov 2026 |
|---|---|
| **This app** | **Phase 1 is live at build.mrkwp.com (version 1.0.1, 28 Nov 2026)** (see "Phase 1" below). Checked against a stand-in backend, and against the real job `RB-1001`, which it confirmed on 28 Nov 2026. Not deployed yet; its database exists on Cloudflare |
| **mrkdevelopment.net** (mrkwp-core 1.8.4) | **Live.** Sign-ups become numbered jobs, the client is emailed their private link, the builders are emailed. Three routes exist for this app (below). Tested with a real sign-up: job `RB-1001` |
| **www.mrkwp.com sign-up form** | Not built. Until it is, sign-ups are made by posting to the rebuild webhook by hand |
| **MRK-Web job mode** | Not built. Specified in the MRK-Web repository |

So today a person can sign up (by hand), get an email with a link to
`https://build.mrkwp.com/rebuild/RB-1001?k=<code>`, and that link opens nothing until this app is
deployed. The code that opens it is written (phase 1, below).

## Phase 1: what is built, and how to run it

Built: link sign-in, the welcome screen and its Start button, the holding screen for `confirmed`, a plain
screen for every other stage, the progress strip, the `/` page, `noindex`, and the outbox with its
one-minute worker.

| To do this | Run |
|---|---|
| Use Homebrew's Node 26 first | `export PATH="/opt/homebrew/bin:$PATH"` |
| Run against a made-up job, no real data | `node tests/fake-backend.mjs`, then `npm run dev:test`. The link to open is at the top of `tests/fake-backend.mjs` |
| Run against mrkdevelopment.net | Fill in `.dev.vars` (below), `npm run db:local` once, then `npm run dev` |
| Tests, and a full build | `npm test`, `npm run build` |

Astro prints the address when it starts. It is `localhost:4321` unless another project has that port.

Where things are: `src/lib/` (sign-in, the D1 copy, the outbox, calls to the backend), `src/products/rebuild/`
(the stage-to-screen map and the rebuild's own screens), `src/worker.ts` (the once-a-minute outbox run),
`migrations/` (the D1 tables), `wrangler.jsonc` (Cloudflare set-up).

**Checked against the stand-in:** a good link signs in and drops the code from the address; a wrong code,
an unknown number, a wrong product and another job's number all show "this link isn't right"; Start
confirms the job, once, however often it is pressed; with the backend down the job still opens, the link
still works on a second device, and the confirm arrives once the backend is back; the screens at phone
width.

**Checked against mrkdevelopment.net with the real job `RB-1001` (28 Nov 2026):** the service account and
firewall user agent are accepted; the real link signs in (in capitals or lower case) and drops the code
from the address; a wrong code, no code, an unknown number, another job's number with this session and
the wrong product all show "this link isn't right"; Start moved `RB-1001` from `signed_up` to `confirmed`
on mrkdevelopment.net and left nothing waiting in the outbox. **`RB-1001` is now confirmed, so it can't
test the welcome screen again; make a new sign-up for that.**

**Known gap on a developer's computer:** under `npm run dev` the two brand fonts don't load (the page falls
back to Arial). The built app serves them correctly (`npm run build`, then `npm run preview`), so judge
the look there.

**Not checked yet:** that the contact got the `rebuild: confirmed` tag in FluentCRM (Matt to look);
a real phone; the Welcome screen and Start on the live site (needs a new sign-up, since `RB-1001` is
already confirmed); the live one-minute schedule sending something that had to wait.

**Not built yet, on purpose:** the hook,
the daily check, and the `scan_runs` and `stripe_events` tables. Each belongs to a later phase.

**On Cloudflare (MRK WP account) on 28 Nov 2026:** the D1 database `build-mrkwp` exists (Oceania) with
its tables, and its id is in `wrangler.jsonc`. The app was first deployed on 28 Nov 2026.

**Deploying** is done by Cloudflare from GitHub's `main` branch: build command `npm run build`, deploy
command `npx wrangler deploy`, preview builds off. `.node-version` asks the builder for Node 24. The four secrets
(`BUILD_API_USER`, `BUILD_API_PASSWORD`, `WP_USER_AGENT`, `SESSION_SECRET`) are in the worker's Settings →
Variables and Secrets, and the custom domain is attached. Never change `SESSION_SECRET`: saved links stop
working until re-opened from the email. A new secret also needs its name adding to `src/secrets.d.ts`,
or the build on Cloudflare fails.

**Checked on the live site (28 Nov 2026):** the home page, the brand fonts, `noindex` and the other
headers; a wrong code, no code, an unknown number, the wrong product and another job's number all show
"this link isn't right"; a form posted from another site is refused; `RB-1001`'s real link signs in,
drops the code from the address and shows the holding screen at phone width.

- New tables in a later version are added with `npx wrangler d1 migrations apply DB --remote`.

**The picture store** `build-mrkwp-pictures` (R2, Oceania, no public address) also exists there and is
named in `wrangler.jsonc` as `PICTURES`. Nothing uses it until the designs phase.

Astro's Cloudflare adapter also asks for a KV store called `SESSION` on first deploy, which this app
doesn't use. The first deploy created it by itself, as `build-mrkwp-session`. It stays empty.

**Decisions made while building, to confirm with Matt:**

- The five steps in the progress strip are the tiles planned for the landing page: Sign up, Your business,
  Five designs, Pick and pay, Go live.
- While a client's answer is still waiting in the outbox, a fresh copy from mrkdevelopment.net does not
  overwrite the copy here. Otherwise pressing Start during an outage would bounce them back to Welcome.
- A job's outbox rows are sent in the order the client made them; a row that can't go yet holds the later
  ones back.
- A job already held here has its link checked against the stored code, without asking mrkdevelopment.net.
- A browser is signed in to one job at a time.

## Phase 2: "Your business" (live since 28 Nov 2026, version 1.1.1)

A job at `confirmed` walks through these short screens. 1.1.1 added the phone and address
boxes, Back on every step, and the summary screen.

| Screen | What happens |
|---|---|
| **Let's look at your website** | One box, filled in from the sign-up form's `website` when there is one. "Check my site" starts the check |
| **Checking your website** | Shown while the check runs (about ten seconds). The page reloads itself |
| **Here's what we found** | Business name, logo, main colour, phone, address, social pages, page count; the technical findings folded away. Each line can be changed or removed |
| **Anything we missed?** | Phone and address when the check didn't find them, ABN, Google Business Profile link, and only the social pages the check didn't find. All optional |
| **What should your new website do better?** | One optional box |
| **Check your details, then send** | Every answer, each with a Change button back to its step. "Start my designs" sends both answers and moves the job to `ready`. Nothing is sent before this |
| **This one needs a conversation** | For a shop, a members' area or more than 300 pages. Says why, names the address checked, and offers the free call. For the first fifteen minutes it has a Back button to check a different address; nothing is sent to mrkdevelopment.net in that time. After that the once-a-minute run sends `details` with fit `no`, the job becomes `not_a_fit`, and only staff can reopen it |

Where things are: `src/lib/scan/` (the checks: `fetch.ts` is the safe way to request a stranger's address,
`html.ts` reads facts out of a page, `checks.ts` holds every rule, `run.ts` runs them together),
`src/lib/business.ts` (which screen, and what the answers look like), `src/lib/business-actions.ts` (what
each button does), `src/products/rebuild/` (the screens), `migrations/0002_site_checks.sql` (three new tables).

**How it differs from the specification, and why:**

- **ABN, Google Business link and social pages are asked after the check,** not on the first screen, so a
  client is never asked for something the check already found.
- **A site that can't be read is never turned away.** The client is asked to check the address once; if it
  still can't be read the job carries on as fit `unsure` with the reason `unreadable`, for a person to look
  at. Sites that block automatic visits are common and are not bad sites.
- **A page count that is only an estimate never turns someone away.** Over 300 pages is `no` only when
  every page was counted from the sitemap; an estimate over 300 is `unsure`.
- **What a client changes or removes is kept alongside what was found,** in `scan.client_corrections`
  (`key`, `found`, `now`). The `scan` itself is sent as found, so a removed tool still counts until a
  person has looked.
- **The confirmed business name, phone and address are sent inside `business`** (`name`, `phone`,
  `address`), next to the fields the contract lists. **Ask Matt to add them to the contract and mrkwp-core,**
  or they may be dropped when the `details` action is built.
- **Social pages are stored, not requested.** Facebook and Instagram forbid it, and it saves requests.
- **Not built:** the speed check (needs `PAGESPEED_API_KEY`). The ABN look-up is built but only runs when
  `ABN_LOOKUP_GUID` is set as a secret, and has never been run; without it an ABN is only checked for the
  right 11 digits.

**Also added in 1.1.0, now the site is public:**

- **A limit on wrong links:** ten from one connection in ten minutes, then every link from there gets a
  "wait ten minutes" page. The connection is stored only in scrambled form. Someone already signed in is
  not affected.
- **A strict content security policy** on every page (Astro's `security.csp`). It only applies to the built
  app, not under `npm run dev`.

**The backend takes these answers (mrkwp-core 1.8.4, live 28 Nov 2026).** `details` stores the business
details and the check's result, and a fit of `no` moves the job to `not_a_fit`. `goals` stores the client's
text, moves the job to `ready` and tells the builders. Both arrive within a second or two of "Start my
designs". Checked with real job `RB-1002`: its two answers had waited in the outbox since 1.1.0, and both
were accepted on the first try after the backend was updated. The backend keeps `business.name`, `phone`
and `address` and `scan.client_corrections` as this app sends them.

The backend answers 409 (`mrkwp_build_stage`) to `details` or `goals` for a job still at `signed_up`, and to
`goals` for a job at `not_a_fit`. This app never sends either in those states, so the outbox has no special
case for it: such a row would be retried and then flagged after a day.

**Checked (28 Nov 2026):** 21 tests, including every check rule against made-up pages and a refusal to
follow a redirect to a private address. In the local app against the stand-in backend: a mistyped address;
a site that doesn't exist, twice (asked to retry, then carried on); www.mrkwp.com (365 pages, "needs a
conversation"); mrkdevelopment.net (found, corrected, finished, both answers accepted by the stand-in when
told to accept them, and held in the outbox when not); typing that saves itself; the wrong-link limit; the
built app with the security policy on; every screen at phone width.

**Checked on the live site (28 Nov 2026, 1.1.0):** Matt took real job `RB-1002` through every screen with
mattonamission.com. The check ran in two seconds and found the name, logo, platform, page count, social
pages, email and domain details. Both answers are waiting in the outbox for the backend.

**Checked on the live site (28 Nov 2026, 1.1.1):** test job `RB-1001` through every screen to the summary,
with Back keeping what was typed and nothing sent before the last button.

**Not checked:** a job going from "Start my designs" to the builders' email in one go; "needs a
conversation" and its fifteen-minute report on the live site; a real client's site with a shop or members' area (those rules are tested
with made-up pages only); the ABN look-up; a real phone.

**New tables and deploying.** The three tables for 1.1.0 were added to the live database on 28 Nov 2026,
after the deploy went out without them and every link showed an error. Any later version with a new file in
`migrations/` needs `npx wrangler d1 migrations apply DB --remote` run **before** it is merged, or the
deploy command in Cloudflare changed to run it first. 1.1.1 has no new tables. The booking link for the free call is Matt's
Google Calendar booking page, set in `src/products/rebuild/config.ts` until the backend's `GET /config` exists.

## Before any code: three things from Matt

**State on 27 Nov 2026:** the account is chosen (**MRK WP**, set in `wrangler.jsonc`). The service account
and the firewall user agent are in `.dev.vars` and work (28 Nov 2026). They still need typing into
Cloudflare's secrets before the first deploy.

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
| `PATCH /jobs/{number}` with `{"action":"confirm"}` | `X-Job-Token: <code>` | 200 with the job, now at `confirmed`. Safe to send twice |
| `PATCH /jobs/{number}` with `{"action":"details", "business": {...}, "scan": {...}}` | `X-Job-Token: <code>` | 200 with the job (1.8.4). A scan with fit `no` moves it to `not_a_fit` |
| `PATCH /jobs/{number}` with `{"action":"goals", "goals": "..."}` | `X-Job-Token: <code>` | 200 with the job, now at `ready` (1.8.4). Any other action: 400. A request with an `Idempotency-Key` already taken is answered again, not redone |
| `POST /jobs` | The sign-up fields | 201 `{number, created: true}`, or 200 with `created: false` for someone who already has an open job. Never returns the code. This app has no reason to call it |

Things to rely on:

- **A wrong number, a wrong code and a missing code all answer 404**, with the same body. Show one
  "this link isn't right" page for all three.
- **No sign-in answers 401.**
- **The client's view** has exactly these keys: `number`, `product`, `stage`, `created_at` (UTC, ends in
  `Z`), `first_name`, `website`, `business`, `scan`, `goals`, `designs`, `ranking`, `extras`, `price`,
  `demo`.
  It never has the email, phone, who claimed the job, costs or history.
- **`website` is the address typed on the sign-up form** (added in mrkwp-core 1.8.2, seen live on
  28 Nov 2026). It is a full address starting `http://` or `https://`, or an empty string. It is empty
  for jobs made before the form asked for it, and whenever the form didn't send one: the backend treats
  it as optional and drops anything that isn't an address. So "Your business" must still be able to ask
  for it. It is separate from `business.website`, which is what the client confirms in this app.
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

Phase 2, "Your business" and the scans, is built: see the section above. Next is phase 3, the designs,
which needs the backend's designs upload and hook (see "What the backend does not offer yet").

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
