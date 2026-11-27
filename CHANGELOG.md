# Changelog

## 1.0.0 (in progress, started 27 Nov 2026)

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
