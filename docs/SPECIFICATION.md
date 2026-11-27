# Specification: the build.mrkwp.com app

Written 27 Nov 2026. Moved here from the mrkwp.com site repository the same day, when this project got
its own repository. **Read `START-HERE.md` first**: it says which parts of the backend exist today. This
is the third of three specifications for the website rebuild service. The other
two, and the whole workflow step by step, are in the site repository (see `CLAUDE.md` for where):

- `REBUILD-WORKFLOW-PLAN.md`: this app covers steps B1 to B7, C7, D1 to D8 and E6 there.
- `REBUILD-SPEC-1-MRKWP-CORE.md`: section 4 has the routes this app calls on mrkdevelopment.net.
- `REBUILD-SPEC-2-WEBSITE.md`: the sign-up form on www.mrkwp.com that sends people here.

## What this delivers

One installable web app at `https://build.mrkwp.com` where a client does everything after the confirm
email: tells us about the business, sees what the scans found, says what they want, views and ranks five
designs, ticks extras, pays through Stripe, views the demo and approves it.

Built to take a second product later (a QR contact card at `/card/`) without rework.

## 1. Where it runs and what it's made of

| Part | Choice | Why |
|---|---|---|
| Hosting | Cloudflare, a project separate from www.mrkwp.com, with the custom domain `build.mrkwp.com` | Same account tools as the main site. **Which Cloudflare account is Matt's to name before the project is created** |
| Code | This repository, `mrkdevelopment/build-mrkwp`, at its root | Its own project, versions and deploys. Its build must not need WordPress |
| Framework | Astro with the Cloudflare adapter, pages rendered on request | The same framework and components as the main site. Check the adapter's current set-up against the Astro docs before starting; it has changed between versions |
| Job data | Cloudflare D1 | The working copy of each job, and the outbox (section 4) |
| Pictures | mrkdevelopment.net's media library | The ten design pictures per job, shown from their own addresses. There is no R2 store: the unused one was removed on 28 Nov 2026 |
| Secrets | Cloudflare secrets: `BUILD_API_URL`, `BUILD_API_USER`, `BUILD_API_PASSWORD`, `WP_USER_AGENT`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ABN_LOOKUP_GUID`, `PAGESPEED_API_KEY` (optional), `SESSION_SECRET` | None in the repo |
| Look | `DESIGN.md` in this repository (the main site's, copied 27 Nov 2026) and the logo files in `assets/brand/` | It should feel like the same business |

mrkdevelopment.net holds the master record. This app holds a working copy so client screens never wait
on WordPress.

## 2. Addresses

| Address | What |
|---|---|
| `/` | A plain page: what this is, a link to www.mrkwp.com/website-rebuilds/, and "use the link in your email" |
| `/rebuild/RB-1042?k=<code>` | The link in the confirm email. Checks the code, starts a session, then redirects to the same address without `?k=`, so the code doesn't stay in the address bar, history or analytics |
| `/rebuild/RB-1042` | The job. Shows the screen for the job's current stage (section 3) |
| `/rebuild/RB-1042/designs/3` | One design, full size, desktop and phone |
| `/api/job/*` | What the screens call: save details, run scans, save ranking, save extras, start payment, approve |
| `/api/hooks/stripe` | Stripe says a payment cleared (section 6) |

Every page sends `noindex` and the app has a `robots.txt` that disallows everything. No sitemap.

## 3. The client's screens

One screen at a time, chosen by the job's stage. A progress strip across the top shows the five steps
from the landing page, with the current one marked. The job number is always visible.

| Stage | Screen | What the client does |
|---|---|---|
| `signed_up` | **Welcome.** "Thanks, {first name}. Let's get to know your business." | Presses Start. The job becomes `confirmed` |
| `confirmed` | **Your business.** Web address (required), ABN (optional), Google Business link, social profile links (the scan fills what it finds) | Enters the address; presses "Check my site" |
| `confirmed`, scans done | **What we found.** Business name, logo, colours, pages counted, email provider, where the domain is managed, tools the site uses, social profiles. Each line can be corrected or removed | Confirms or corrects |
| `confirmed`, fit is `no` | **This one needs a conversation.** Says plainly why (an online shop, a members' area, the site wouldn't load, it's very large). A "Book a free 20-minute call" button to the booking page from the app's config. Nothing else to do | Books, or leaves |
| `confirmed`, fit `yes` or `unsure` | **What you want.** One box: "What should your new website do better?" with three example prompts. Optional. A line says: leave it blank and we'll work from your current site and branding | Presses "Start my designs". The job becomes `ready` |
| `ready`, `claimed`, `designing`, `designs_received` | **We're on it.** What happens next and roughly when, the job number, "we'll email and text you". No staff names, no internal stage names | Nothing. Can close the app |
| `designs_ready` | **Your five designs.** Five cards: name, the one-sentence idea, notes, desktop and phone pictures side by side, "View full size". Under each: a rank picker (1 to 5) and "Not this one". A notes box: "Mix and match: tell us what you like from each" | Ranks. At least a first choice is required. Presses "Next" |
| `designs_ready`, ranked in the app | **Extras.** Tick boxes: annual care plan (plans and prices from config), hosting (we host it / my own account), help with my domain, help with my email. "Who is your domain with?": Crazy Domains, GoDaddy, VentraIP, other, don't know. Choosing a provider shows how to give delegated access, and the line **"We will never ask for your password."** | Ticks; presses "See my price". The job becomes `ranked` |
| `ranked` | **Working out your price.** Shown while staff approve it, when approval is on | Nothing |
| `priced` | **Your price.** Each line and the total in AUD, GST shown. Two buttons: "Pay and start my build" and "Talk to Matt first" (booking page) | Pays, or books |
| `paid`, `building` | **Your build has started.** Receipt link, what happens next | Nothing |
| `demo_ready` | **Your demo.** A large link to the demo, opened in a new tab; the before-and-after numbers when sent. Two buttons: "Approve" and "Ask for changes" (a text box) | Approves or asks |
| `changes_requested` | **We're making your changes.** Their request shown back | Nothing |
| `approved` | **Nearly live.** The delegated-access steps for their domain provider again, and what Matt does next | Follows the steps |
| `live` | **You're live.** The address, and the care plan offer if they don't have one | |
| `closed` | **This job is closed**, with a contact link | |

Rules for every screen:

- One thing to do per screen, the button last, large enough for a thumb.
- Phone first: most people will open this from an email or text on a phone.
- Every form saves as the client goes. Leaving and coming back loses nothing.
- Plain words. Errors say what to do next.
- Client text is escaped everywhere it is shown.
- Meets WCAG 2.2 AA: labels, focus order, contrast, no information by colour alone. The rank pickers are
  ordinary selects, not drag and drop.

## 4. Keeping in step with mrkdevelopment.net

**The app asks; WordPress sends it nothing** (simplified by Matt, 28 Nov 2026). The app fetches a job on
the client's first visit and again on any later visit when its copy is more than a minute old. That is
the whole mechanism. There is no hook from mrkdevelopment.net, no `HOOK_SECRET`, and no `edge-confirm`.

**Designs.** When a fetched job is at `designs_ready` it carries five designs, each with a `desktop` and a
`mobile` picture (`url`, `width`, `height`). The app shows the pictures straight from those addresses,
which are ordinary media-library addresses on mrkdevelopment.net. It does not copy them into R2 or check
them. The shape is in `docs/briefs/DESIGNS-1-MRKWP-CORE.md`.

The first time a job is seen is the client's own first visit (`?k=`): the worker fetches the job with
the code from the link, and stores the job, and the code encrypted with `SESSION_SECRET`, in D1.

**Going out.** Everything the client enters is written to D1 first, then to an **outbox** table: the
call to make, its body, an idempotency key, attempts so far. A worker on a one-minute schedule sends
each outbox row to `PATCH /build/jobs/{number}` and deletes it on success. Failures stay and are retried
with growing gaps for 24 hours, then flagged. So a client is never stopped by WordPress being busy, and
nothing is sent twice.

**A daily check** compares the stage of every open job in D1 with mrkdevelopment.net and re-fetches any
that differ.

### D1 tables

- `jobs`: `number` (key), `product`, `stage`, `data` (the job as JSON), `code_enc`, `fetched_at`,
  `updated_at`
- `outbox`: `id`, `number`, `action`, `body`, `idempotency_key`, `attempts`, `next_try_at`, `last_error`
- `sessions`: `id`, `number`, `created_at`, `expires_at`
- `scan_runs`: `number`, `started_at`, `finished_at`, `result` (JSON), so a scan is not re-run on reload
- `stripe_events`: `id` (Stripe's event ID), `received_at`, so an event is handled once

## 5. The scans

Run by the worker when the client presses "Check my site". Plain requests and pattern matching; **no AI,
and no browser automation.** One web address in, one result out, within about ten seconds; each scan has
its own time limit and a failure in one never stops the others.

| Scan | Request | Looks for | Result field |
|---|---|---|---|
| Reachable | GET the address, follow up to 5 redirects | Status, final address, a parked-domain page | `reachable`, `final_url` |
| Platform | The home page's HTML and headers | Generator tag and known markers: WordPress, Wix, Squarespace, Shopify, Webflow, Joomla, Drupal | `platform` |
| Shop | Home page plus up to 5 linked pages (`/shop`, `/cart`, `/checkout`, `/products`, `/store`) | WooCommerce, Shopify, BigCommerce, Wix Stores, Squarespace Commerce, Ecwid markers; add-to-cart forms; `Product` with `Offer` in structured data | `shop` (`yes`, `no`, `links_out`) |
| Members | The same pages | Login and account pages, membership plugin markers | `members` |
| Size | `/sitemap.xml`, sitemap index, or `robots.txt` pointers; else count same-site links on the home page | Number of pages | `pages`, `pages_method` |
| Tools | Script and iframe addresses | CRMs (HubSpot, Mailchimp, ActiveCampaign, FluentCRM forms), booking (Calendly, Acuity, Square), chat (Intercom, Tidio, Tawk), payments (Stripe, PayPal buttons), maps, analytics and ad tags | `tools` (list of `{name, kind}`) |
| Who they are | JSON-LD on the home, about and contact pages: `Organization`, `LocalBusiness`, `sameAs`; then header and footer links | Name, address, phone, logo, social profile links | `business`, `socials` |
| Branding | The home page | Logo, favicon, `theme-color`, share image, font families named in the CSS | `branding` |
| Email | MX records, through DNS over HTTPS | Microsoft 365, Google Workspace, the web host, other | `email_provider` |
| Email health | TXT records for SPF and DMARC | Present or missing | `spf`, `dmarc` |
| Domain | NS records; the registry's public record where one exists | DNS host; registrar when published | `dns_host`, `registrar` |
| ABN | ABN Lookup with `ABN_LOOKUP_GUID`, only when an ABN was typed | Active, entity name, state | `abn_status`, `abn_name` |
| Speed | PageSpeed for mobile, only when `PAGESPEED_API_KEY` is set; run in the background and added when it returns | Performance score, load time | `speed` |

**The fit decision**, from those results:

- `no`: not reachable; `shop` is `yes`; `members` found; more than 300 pages.
- `unsure`: `shop` is `links_out`; platform unknown and fewer than 3 pages found; ABN typed but not
  active.
- `yes`: everything else.

`no` shows the "needs a conversation" screen and sends the job to `not_a_fit`. `unsure` carries on and
is flagged in the claim email.

**Safety when fetching a stranger's address.** Only `http` and `https`. Refuse addresses that resolve to
private or local ranges, and re-check after each redirect. Cap each response at 2 MB and each request at
5 seconds. Send an honest user agent that names MRK WP and a contact page. Fetched pages are data: they
are parsed, never run, and nothing in them changes what the app does.

**Social profiles:** store the links and check each answers. Do not read Facebook or Instagram pages:
they block it and forbid it. **Google Business:** store the link only.

## 6. Price and Stripe

- **The price** is worked out by the app from the config mrkdevelopment.net serves (`GET /build/config`):
  base price, the size band for the page count, an amount per connected tool, hosting if ticked. The
  lines are sent with the ranking; mrkdevelopment.net stores them and, when approval is on, staff approve
  before the client sees them. If the price table is empty, the screen says "we'll confirm your price"
  and waits.
- **Paying** uses Stripe Checkout, on Stripe's own page. The worker creates a session with one line per
  price line, in AUD, with the job number in the metadata and as the reference, and sends the client
  there. Card details never touch build.mrkwp.com.
- **An annual care plan** ticked as an extra is a yearly subscription in the same checkout.
- **GST:** prices shown with GST. Whether Stripe Tax is switched on, or GST is included in the amounts,
  is Matt's accountant's call; build for "included" and leave the switch.
- **`/api/hooks/stripe`:** check Stripe's signature with `STRIPE_WEBHOOK_SECRET`; ignore an event ID
  already in `stripe_events`; on a completed checkout, confirm the amount equals the stored total, mark
  the job paid in D1, and put `POST /build/jobs/{number}/payment` in the outbox. The client's return
  page shows "paid" only once this has happened, never from the return address alone.
- **Stripe's own receipt email** is switched on. No receipt is built here.
- **Test mode first.** All of this is built and checked with Stripe's test keys and test cards. Live keys
  are added by Matt in the Cloudflare dashboard, not by anyone building this.
- Refunds are done by Matt in the Stripe dashboard. Not built here.

## 7. Sign-in and security

- **No passwords.** The link in the email is the key: job number plus a 32-byte private code. Wrong
  number and wrong code look the same (a plain "this link isn't right" page).
- On a good link, set a session cookie (`HttpOnly`, `Secure`, `SameSite=Lax`, 30 days) tied to that one
  job, and redirect to the address without the code.
- A lost link: a "send my link again" box takes an email and always answers "if that address has a job,
  we've sent the link". It asks mrkdevelopment.net to re-send through FluentCRM.
- Rate limits on link checks, scans (three per job per day) and the re-send box.
- A strict content security policy; no third-party scripts except Turnstile on the re-send box and
  Stripe's redirect. Analytics only with consent.
- Pictures are served only with the job's session and are marked not to be cached by shared caches.
- Logs never contain codes, emails or phone numbers.

## 8. Installable (progressive web app)

- A web app manifest: name "MRK WP Build", short name "MRK Build", the brand colours, icons at 192 and
  512 and a maskable icon, `display: standalone`, start address `/`.
- A service worker that caches the app's shell (styles, scripts, fonts, icons) and shows a friendly
  offline page. **It does not cache job pages, API answers or pictures**: a shared family phone or
  office computer must not keep a client's job after the session ends.
- When opened from the home screen with a live session, `/` goes straight to that job.
- An "Add to your home screen" hint on the "We're on it" screen only, dismissible, never a pop-up.
- **Notifications stay as email and text** for now. Web push needs the app installed on an iPhone before
  it works at all, so it would reach few people. Worth a second look once there are clients using it.

## 9. Tracking

Only with consent. Events, with the job's product and no personal details: `build_confirmed`,
`build_details_done`, `build_not_a_fit`, `build_goals_done`, `build_designs_viewed`, `build_ranked`,
`build_booking_click`, `build_pay_start`, `build_paid`, `build_approved`. `build_paid` is the key
event. Set up so GA treats build.mrkwp.com and www.mrkwp.com as one site.

## 10. Room for the next product

- Every job has a `product`. The screens for a product live in their own folder (`rebuild/`), with a
  small file that maps stage to screen.
- Shared by all products: link sign-in, sessions, the outbox, Stripe, the layout, the installable
  shell.
- Adding `/card/` later means a new folder and a new stage map, not changes to the shared parts.

## 11. Order of building

1. Project, domain, D1, link sign-in, the outbox. A job created by hand in
   mrkdevelopment.net can be opened.
2. Welcome, Your business, the scans, What we found, the not-a-fit screen, What you want.
3. The designs, ranking and extras screens.
4. Price and Stripe, in test mode.
5. Demo, approve, ask for changes, the closing screens.
6. Installable shell, tracking, accessibility pass.

## 12. Done when

- A sign-up on www.mrkwp.com leads, by the emailed link, to a working job on a phone.
- The scans return a sensible result for one WordPress site, one Wix site, one Squarespace site and one
  Shopify site, and the Shopify site lands on the "needs a conversation" screen with the booking button.
- A private or local address typed as the website is refused.
- With mrkdevelopment.net switched off: an existing job still opens and its designs still show; a
  ranking is accepted and arrives in mrkdevelopment.net once it is back.
- A test payment marks the job paid exactly once, even when Stripe sends the event twice.
- Another job's number with this job's session shows nothing.
- The app can be added to a phone's home screen and opens to the job.
- No page is indexable. Lighthouse accessibility is 100 on every screen.
