# Start here

Written 27 Nov 2026 for the first session that builds this app. It says what already exists, what to
build first, and what is waiting on something else. `SPECIFICATION.md` is the full brief; this page is
the state of play and should be updated as things change.

## Where things stand

| Piece | State on 27 Nov 2026 |
|---|---|
| **This app** | **Phase 1 built as version `1.0.0` and merged into `main` on 28 Nov 2026; first deploy under way** (see "Phase 1" below). Checked against a stand-in backend, and against the real job `RB-1001`, which it confirmed on 28 Nov 2026. Not deployed yet; its database exists on Cloudflare |
| **mrkdevelopment.net** (mrkwp-core 1.8.1) | **Live.** Sign-ups become numbered jobs, the client is emailed their private link, the builders are emailed. Three routes exist for this app (below). Tested with a real sign-up: job `RB-1001` |
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
a real phone; the deployed worker's one-minute schedule (locally it was triggered by hand).

**Not built yet, on purpose:** rate limits on link checks, the strict content security policy, the hook,
the daily check, and the `scan_runs` and `stripe_events` tables. Each belongs to a later phase.

**On Cloudflare (MRK WP account) on 28 Nov 2026:** the D1 database `build-mrkwp` exists (Oceania) with
its tables, and its id is in `wrangler.jsonc`. The app has not been deployed.

**Deploying** is done by Cloudflare from GitHub's `main` branch: build command `npm run build`, deploy
command `npx wrangler deploy`, preview builds off. `.node-version` asks the builder for Node 24. Still to do:

- Merge `1.0.0` into `main` and push it.
- After the first deploy, Matt types four secrets into the worker's Settings → Variables and Secrets:
  `BUILD_API_USER`, `BUILD_API_PASSWORD`, `WP_USER_AGENT`, and a new `SESSION_SECRET` (never change it
  afterwards: saved links stop working until re-opened from the email).
- Add the custom domain `build.mrkwp.com` to the worker. That is when emailed links start working.
- New tables in a later version are added with `npx wrangler d1 migrations apply DB --remote`.

**The picture store** `build-mrkwp-pictures` (R2, Oceania, no public address) also exists there and is
named in `wrangler.jsonc` as `PICTURES`. Nothing uses it until the designs phase.

Astro's Cloudflare adapter also asks for a KV store called `SESSION` on first deploy, which this app
doesn't use. Not yet seen whether an automated deploy creates it by itself.

**Decisions made while building, to confirm with Matt:**

- The five steps in the progress strip are the tiles planned for the landing page: Sign up, Your business,
  Five designs, Pick and pay, Go live.
- While a client's answer is still waiting in the outbox, a fresh copy from mrkdevelopment.net does not
  overwrite the copy here. Otherwise pressing Start during an outage would bounce them back to Welcome.
- A job's outbox rows are sent in the order the client made them; a row that can't go yet holds the later
  ones back.
- A job already held here has its link checked against the stored code, without asking mrkdevelopment.net.
- A browser is signed in to one job at a time.

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
