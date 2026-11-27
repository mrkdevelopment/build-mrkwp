# Changelog

## 1.1.0 (built 28 Nov 2026, not yet deployed)

"Your business": after pressing Start, a client now tells us about their business in a few short screens.

- **We look at their website for them.** They confirm their web address (already filled in from the
  sign-up form) and the app reads their public site in about ten seconds: business name, logo, main colour,
  phone, address, social pages, how many pages, what it is built with, who runs their email and domain,
  and the tools it uses.
- **"Here's what we found"** shows it back in plain words. Anything wrong can be changed or removed with
  one tap, and we keep a note of what was changed.
- **"Anything we missed?"** asks only for what the check didn't find: ABN, Google Business Profile link
  and social pages. All optional.
- **"What should your new website do better?"** One optional box, then the job is ready for designs.
- **Sites that need a conversation are told why.** An online shop, a members' area or more than 300 pages
  gets a plain explanation and a button to book the free 20-minute call.
- **A site we can't read is never turned away.** The client checks the address once; after that the job
  carries on and one of us looks at the site by hand.
- **Typing saves itself.** Closing the page mid-sentence loses nothing.
- **Safer now the site is public.** Repeated wrong links from one connection are slowed down, pages can
  only load their own files, and the site check refuses any address that points at a private network.

Until mrkdevelopment.net can receive these answers they are kept here and re-sent every hour, so this
version should wait for that before real clients use it.

## 1.0.1 (28 Nov 2026)

- **The app now builds on Cloudflare.** The first build there stopped because the code check could not
  find the names of the four secrets, which until now it read from a file that only exists on a
  developer's computer. The names (never the values) are now listed in the code.

## 1.0.0 (28 Nov 2026)

The first version that builds. The link in a client's confirm email now opens something.

- **The emailed link signs the client in.** The job number and private code are checked, the browser
  is remembered for 30 days, and the code is taken out of the address straight away.
- **Welcome screen** with one button, Start, which marks the job as confirmed on mrkdevelopment.net.
- **A holding screen** for a confirmed job, and a plain screen for every later stage until each one's
  real screen is built.
- **The five steps** across the top of every job screen, and the job number always in view.
- **"This link isn't right"** for a wrong number, a wrong code, or someone else's job. All look the same.
- **Nothing is lost when mrkdevelopment.net is busy or down.** What the client does is saved here first
  and sent on once a minute until it is accepted. A job that has been opened before still opens.
- No page can be indexed by search engines.
- A stand-in for mrkdevelopment.net (`tests/fake-backend.mjs`, `npm run dev:test`) so the app can be
  tested with a made-up job, and an outage rehearsed, without touching real client records.

Checked against the stand-in and, on 28 Nov 2026, against the real job RB-1001: its emailed link signed in
and Start marked it confirmed on mrkdevelopment.net. Not yet deployed or tried on a real phone.
