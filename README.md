# build-mrkwp

The source for **build.mrkwp.com**: the app a client uses after signing up for an MRK WP build. For a
website rebuild they tell us about their business, see what our checks found, view and rank five
designs, choose extras, pay through Stripe, view their demo and approve it.

The first phase is built and runs on a developer's computer: the emailed link signs a client in, shows
the welcome screen, and confirms their job. It is not deployed yet. `docs/START-HERE.md` says what
exists today, how to run it, and what comes next. `CHANGELOG.md` lists what each version added.

## What's here

| Path | What |
|---|---|
| `docs/START-HERE.md` | The state of play: what the backend offers today, what is waiting, and the first phase to build |
| `docs/SPECIFICATION.md` | What to build: every screen, the site checks, payment, sign-in, the installable app set-up, and the order to build it in |
| `DESIGN.md` | The MRK WP design system: colours, type, components. Copied from the mrkwp.com site on 27 Nov 2026 |
| `.impeccable/design.json` | The same design system in the form the design tools read |
| `assets/brand/` | The MRK WP logo (128 px) and the browser tab icon (48 px) |
| `CLAUDE.md` | Notes for whoever works on this project: decisions made, rules, and where the related documents are |

## How it fits

- **www.mrkwp.com** takes the sign-up.
- **mrkdevelopment.net** (WordPress, with the mrkwp-core plugin and FluentCRM) keeps the record of every
  job and sends every message.
- **build.mrkwp.com** (this project) is what the client sees. It keeps a working copy of each job on
  Cloudflare so the client's screens never wait on WordPress.
- **The MRK-Web skill**, run by Matt or Kate, makes the designs and the site.

## Still needed

- A logo file of at least 512 px (an SVG is best). The app's home-screen icons need 192 and 512 px, and
  the only logo file so far is 128 px.
- A service account and application password on mrkdevelopment.net, and the firewall user agent, typed
  into Cloudflare's secrets by Matt.

The backend's first piece is live (mrkwp-core 1.8.1): sign-ups become jobs, clients are emailed their
link, and this app can read a job and mark it confirmed.
