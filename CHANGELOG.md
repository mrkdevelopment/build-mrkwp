# Changelog

## 1.2.1 (28 Nov 2026)

One change of wording.

- **The fourth step in the progress strip is now "Payment".** It was "Pick and pay". The five steps a client
  sees at the top of every screen are Sign up, Your business, Five designs, Payment, Go live.

## 1.2.0 (28 Nov 2026)

"Your five designs": a client can now see their designs and tell us what they think.

- **A hand of five cards**, fanned across the screen so all five designs can be compared at a glance.
  A card straightens and lifts when you reach for it. On a phone the cards are a row to swipe, and a
  mouse can drag it too.
- **A card opens that design large.** One picture at a time, with a switch between the computer and phone
  views. "Design 2 of 5" and its arrows sit in the header beside the design's name, and go round, so
  neither arrow is ever a dead end.
- **Like or Dislike** for each design, and two notes boxes beside every one: "What do you like?" and "What
  do you dislike?". A design can have both. On a phone the Like and Dislike buttons stay at the bottom of
  the screen while the picture scrolls.
- **The side bar folds.** "Your notes" and "About this design" are an accordion, each with its own icon,
  one open at a time, so the column never runs long. The only button at its foot is "Next design"; closing the panel is the way
  back to all five.
- **A liked card is unmistakable**: a green badge on its corner, a green outline and a filled "Liked" label.
- **A review before anything is sent.** "Review my choices" (shown only once a design is liked) leads to
  "Check your choices, then send". Like a shopping cart, it lists only what was chosen: the designs the
  client liked, with what they said about each and a Change button beside it. Then the optional "Anything
  else?" box.
- **An order of preference.** When more than one design is liked, the review screen asks the client to put
  them in order, with arrows beside each or by dragging with a mouse. The first choice is the design we
  build from; the others are where we borrow what they liked.
- **Five questions before sending, so the team can cost the job.** Do the enquiry forms on the current
  website work? Where do enquiries need to go (email, or a CRM or another system)? Does the client want
  to update the website themselves, with or without training? Do they want ongoing support? Are they
  comfortable changing domain settings and setting up hosting, or should our team do it? Each can be
  answered "I'm not sure".
- **"Would you like to go over your design with Matt before we get to the payment options?"** A Google
  Meet video call, a phone call, or no thanks. After sending, a client who chose the video call is given a
  button to Matt's booking calendar; one who chose a phone call is told Matt will ring them, and can say
  when is a good time. The choices can't be sent until every question is answered.
- **Sending finishes this part.** The client then sees "Thanks. We're working out your costing", with a
  line that further rounds of feedback can be booked as a paid video meeting. The choices can no longer
  be reopened.
- **Mix and match is said in one line under the heading**: like more than one, and say which part you want
  from each.
- No part of a design is cut off: pictures keep square corners, mounted inside a white margin.
- Pictures are shown straight from mrkdevelopment.net, and only from there.
- Icons are Lucide's own, from its Astro package, the same set MRK WP uses elsewhere.

Until mrkdevelopment.net can receive these choices and answers they are kept here and re-sent every hour.

## 1.1.3 (28 Nov 2026)

Nothing a client sees has changed.

- **The unused picture store is gone.** Design pictures will be shown straight from mrkdevelopment.net, so
  the empty store on Cloudflare was removed and the app no longer asks for it.

## 1.1.2 (28 Nov 2026)

Notes only; nothing a client sees has changed.

- **mrkdevelopment.net now receives the "Your business" answers** (mrkwp-core 1.8.4). A client's business
  details, the check of their website and what they want arrive within a second or two of "Start my
  designs", the job becomes ready, and the builders are told. The project's notes now say so.

## 1.1.1 (28 Nov 2026)

Changes to "Your business" after Matt tried it on a real site.

- **Phone and address are asked for.** When the check of the website doesn't find them, "Anything we
  missed?" now has a box for each. Both optional.
- **Back on every step.** A client can go back one screen at a time, and nothing they typed is lost.
- **A summary before sending.** A new last screen, "Check your details, then send", lists every answer with
  a Change button beside each. Nothing goes to mrkdevelopment.net until "Start my designs" is pressed there.
- **"Here's what we found" is tidier.** Each line has its value on the left and one button, always the same
  size, on the right. Pressing Change turns the value into a text box in the same place, with Save and
  Cancel. Lines that can't be edited have a single Remove button, and a removed line can be put back.
- **A way back from "This one needs a conversation".** A client who typed the wrong address (or someone
  else's shop) can press Back and check a different one. The screen also names the address that was
  checked. We hold off telling mrkdevelopment.net for fifteen minutes; after that the job is marked not a
  fit and only staff can reopen it.
- **"Book a free 20-minute call" now opens Matt's booking calendar** instead of the contact page.
- **Fixed:** a Facebook page without a custom name was saved without the part that identifies it.
- The website is shown as its home address, even when the check ended on an inner page.

## 1.1.0 (28 Nov 2026)

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
