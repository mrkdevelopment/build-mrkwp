# build-mrkwp

The source for **build.mrkwp.com**: the app a client uses after signing up for an MRK WP build. For a
website rebuild they tell us about their business, see what our checks found, view and rank five
designs, choose extras, pay through Stripe, view their demo and approve it.

Nothing is built yet. This repository holds the specification, the design system and the logo files,
ready for the build to start.

## What's here

| Path | What |
|---|---|
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

## Still needed before building

- Which Cloudflare account this project is created in.
- A logo file of at least 512 px (an SVG is best). The app's home-screen icons need 192 and 512 px, and
  the only logo file so far is 128 px.
- The mrkwp-core build jobs work (its specification is in the site repository), or a stand-in for it
  while this is built.
