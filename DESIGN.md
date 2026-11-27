---
name: MRK WP
description: Practical WordPress and AI knowledge from Matt Knighton, laid out like a well-kept studio notebook.
colors:
  signal-blue: "#2B59FF"
  signal-blue-deep: "#2047E0"
  deep-navy: "#0A2540"
  navy-lift: "#0E2F54"
  glow-cyan: "#00D4FF"
  fresh-teal: "#00D4B2"
  fresh-teal-ink: "#0F766E"
  youtube-red: "#FF0000"
  paper: "#F8FAFC"
  surface: "#FFFFFF"
  wash: "#F1F5F9"
  hairline: "#E2E8F0"
  hairline-strong: "#CBD5E1"
  ink-soft: "#334155"
  ink-muted: "#475569"
  ink-quiet: "#64748B"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  eyebrow:
    fontFamily: "Outfit, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.2em"
  label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.05em"
  mono-note:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  section: "64px"
  section-wide: "96px"
  container: "1152px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.signal-blue-deep}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.deep-navy}"
    rounded: "{rounded.lg}"
    padding: "14px 28px"
  button-secondary-hover:
    backgroundColor: "{colors.paper}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
  panel-feature:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "32px"
  card-dark:
    backgroundColor: "{colors.deep-navy}"
    textColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.deep-navy}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
  badge-status:
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  nav-link:
    textColor: "{colors.ink-muted}"
    typography: "{typography.body}"
  nav-link-active:
    textColor: "{colors.signal-blue}"
---

# Design System: MRK WP

## Overview

**Creative North Star: "The Studio Notebook"**

The site reads like a well-kept working notebook from someone who has been building for the web for 25 years: structured like reference material, with clear headings, generous white space and cards you can scan. A few tactile, playful moments keep it lively. The page is pale slate paper. Deep navy carries the ink, and one bright Signal Blue marks what matters on each page: the second line of a headline, the active nav item, the main call to action. Dark navy panels act as the notebook's "pinned" pages. They hold Matt's portrait, video and the timeline, and that is where the cyan glow and the 3D tilt live.

Density is comfortable rather than tight. Body copy is set at a full 16px with a loose 1.65 line height. Sections breathe (64–96px apart), and every card has at least 24px of padding. The voice comes through annotation: wide-tracked uppercase eyebrows, small monospace notes ("watch + learn", "↗ ▶ { }"), and headlines split across two colours, plain statement first and blue payoff second.

Motion is physical but polite. Buttons lift with a tinted shadow. Cards rise on hover. Content fades up once as it scrolls in, and the hero portrait tilts toward the pointer. Every one of these respects `prefers-reduced-motion`.

**Key Characteristics:**
- Pale slate paper, white cards, deep navy ink, one Signal Blue
- Two-tone headlines: navy statement, blue payoff
- Space Grotesk headings over Outfit body copy
- Soft, generous corners (12–24px) and hairline slate borders
- Navy "pinned pages" carry the glow, the 3D tilt and Matt's presence
- Annotation voice: uppercase eyebrows and monospace margin notes

## Colors

A cool, restrained palette: slate neutrals and navy ink, one saturated blue for action, and cyan and teal kept for small highlights.

### Primary
- **Signal Blue** (#2B59FF): the one colour that says "act here or read this part". Used for primary buttons, the blue half of two-tone headlines, eyebrows, the active nav underline, inline links and focus rings. **Signal Blue Deep** (#2047E0) is its hover and pressed state only.

### Secondary
- **Deep Navy** (#0A2540): the ink of the whole site. Headings, body text on light surfaces, the footer, and the background of the "pinned page" panels (hero portrait card, video cards, about timeline). **Navy Lift** (#0E2F54) is the midpoint of the navy gradients on those panels.

### Tertiary
- **Glow Cyan** (#00D4FF): highlights *on navy only*. Glowing labels, timeline markers and video accents. It reads as light coming off a dark surface.
- **Fresh Teal** (#00D4B2): a secondary accent on light surfaces, used sparingly as a fill or mark where a second hue helps tell items apart. It fails contrast as text (1.8–1.9:1), so teal *text* on light surfaces uses **Fresh Teal Ink** (#0F766E, 5.1–5.4:1 on white and teal-50).
- **YouTube Red** (#FF0000): YouTube's own play and subscribe marks only. Never a brand colour.

### Neutral
- **Paper** (#F8FAFC): the page background behind everything.
- **Surface** (#FFFFFF): cards, panels, the header (at 95% opacity with blur) and inputs.
- **Wash** (#F1F5F9): quiet fills for callouts, chips and icon wells.
- **Hairline** (#E2E8F0): the default 1px border on cards, inputs and dividers. **Hairline Strong** (#CBD5E1) is for secondary-button borders and card borders on hover.
- **Ink Soft** (#334155) and **Ink Muted** (#475569): secondary copy, lead paragraphs and nav links.
- **Ink Quiet** (#64748B): metadata, prices, captions and helper text.

### Named Rules
**The One Signal Rule.** Signal Blue is the only saturated colour on a light surface that asks for attention. If something blue isn't a link, an action, an active state or the payoff half of a headline, it shouldn't be blue.

**The Glow Lives on Navy Rule.** Glow Cyan appears only on Deep Navy surfaces. On white it loses contrast and turns into decoration.

**The Seamless Paper Rule.** Every page and section sits on Paper (#F8FAFC); the header and the content share it with no seam. Pure white appears only inside a bordered container (a card, panel, input or sheet: `bg-white border border-slate-200/90 rounded-2xl`). Never a full-width white band without a border.

**The Ink Rule.** Any accent used as text on a light surface must reach 4.5:1. Teal text is Fresh Teal Ink, small labels are Ink Quiet (#64748B) or darker, never slate-400.

## Typography

**Display Font:** Space Grotesk (fallback: metric-matched Arial, then sans-serif), self-hosted at weights 600–700 (its maximum; `font-extrabold` renders at 700)
**Body Font:** Outfit (fallback: metric-matched Arial, then sans-serif), self-hosted at weights 400–700
**Layered Font:** Anton 400 (`font-condensed font-normal`), only for the two big lines of the Layered Header and the same lines in videos
**Label/Mono Font:** the system monospace stack (ui-monospace, SFMono, Menlo), for margin notes only

All three are downloaded at build time by Astro's Fonts API (`astro.config.mjs`) and served from the site, one file per family. Since 1.6.0 only Anton is preloaded; Outfit and Space Grotesk load when the page needs them and swap in over size-matched Arial fallbacks. Use the `font-display` / `font-body` / `font-condensed` utilities; never name a family directly (the served family names are hashed).

**Colours:** headings are always Deep Navy. Body copy on light surfaces is Ink Muted (#475569); labels and form controls are slate-900.

**Character:** Space Grotesk's slightly mechanical, engineered shapes give headings a builder's precision. Outfit's round geometry keeps the reading warm and plain. Every heading tag gets Space Grotesk and -0.025em tracking automatically.

### Hierarchy
- **Layered display** (Anton 400, fitted to the column, line-height 0.9): only the two big lines of the Layered Header, and the same two lines in YouTube videos and Shorts. The first line is solid Deep Navy; the second is white with a Signal Blue outline and a soft light grey glow. Never used for body headings.
- **Display** (700, set as `font-extrabold`, 1.875rem mobile → 3rem → 3.75rem desktop, line-height 1.1): page and hero H1s, almost always two-tone.
- **Headline** (700, set as `font-extrabold`, 1.5rem → 2.25rem, line-height about 1.25): section H2s, often two-tone.
- **Title** (700, 1.25rem): card and feature H3s.
- **Lead** (400, 1.125–1.25rem, line-height 1.625, Ink Muted): the paragraph under a page title, kept to about 42rem (`max-w-2xl`).
- **Body** (400, 1rem, line-height 1.65): all running text. Article bodies use the Tailwind Typography `prose` styles.
- **Eyebrow** (Outfit 700, 1rem, uppercase, 0.2em tracking, Signal Blue): sits above the H1 or a section heading and names the topic or role ("Educator. Community builder. Advisor.").
- **Label** (600, 0.75rem, uppercase, wide tracking): status badges and small tags.
- **Mono Note** (monospace 700, 1rem, Signal Blue or Teal): one-line annotations at the top of feature cards.

### Named Rules
**The Two-Tone Headline Rule.** Big headlines state the plain fact in Deep Navy, then give the payoff in Signal Blue ("Useful tools. **Thoughtful choices.**"). Use one blue span per headline, at the end.

**The 16px Floor Rule.** Running text, buttons and nav are never smaller than 1rem. Only badges, prices and metadata drop to 0.75–0.875rem.

## Layout

There is a single centred container, 72rem (1152px, `max-w-6xl`) wide, with side gutters of 16px, 24px from `sm` and 32px from `lg`. The header, footer and every section share it, so edges line up down the page.

- **Section rhythm:** 64px between home sections on mobile and 96px from `sm` up. Inner pages open with a shared `page-intro` block (32px top padding and 40px below on mobile; 56px and 56px from `sm`).
- **Grids:** a 12-column split for heroes (7 text / 5 media). Card grids go from 1 column to 2 (`sm`/`md`) to 3 (`lg`), with 24–32px gaps.
- **Breakpoints:** Tailwind defaults (sm 640, md 768, lg 1024, xl 1280). The full nav appears at `lg`. Below that, a menu button opens a drawer. Scroll-reveal animation runs only at 768px and wider.
- **Header:** sticky, 64px tall (80px from `md`), white at 95% opacity with a backdrop blur and a hairline bottom border.
- **Container recipe:** `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`, on every page, listing and detail layout.
- **Detail page headers** (articles, videos, tools, products, case studies) stay plain: breadcrumbs, title, one meta line. No share, YouTube-channel or "visit site" buttons up there; the action to a tool's own site lives in the sidebar only.
- **Phone meta lines** that only just fit one line (author · date · read time) break onto two lines on phones on purpose, so they don't re-wrap, and shift the page, when the web font replaces the fallback.

## Elevation & Depth

Surfaces sit flat at rest. Depth comes mostly from tone: white cards on pale slate paper, with hairline borders. Shadows are a response to interaction. Resting cards carry at most an extra-small shadow. On hover they rise (up to 6px) and pick up a large, soft, slate-tinted shadow. Buttons do the same with a shadow tinted to their own colour. The one place that is truly dimensional is the navy panel: the hero portrait card tilts in 3D toward the pointer, with a glare and a holographic wash, and raised text gets a "text-float" shadow.

### Shadow Vocabulary
- **Resting hairline** (`shadow-xs`): cards, inputs, secondary buttons and logo tiles at rest.
- **Hover lift** (`shadow-lg shadow-slate-200/50` with `-translate-y-1.5`): interactive cards on hover.
- **Button rise** (`0 14px 22px -10px var(--btn-rise-shadow), 0 4px 8px -4px rgb(10 37 64 / 0.12)` with a 3px lift): every call-to-action button on hover or focus. The shadow is tinted Signal Blue on primary buttons, YouTube Red on YouTube buttons and navy on neutral ones. It settles to 1px while pressed.
- **Text float** (`0 1px 1px rgb(0 0 0 / .35), 0 10px 22px rgb(0 0 0 / .45)`): text lifted off a 3D card.

### Card Lift recipe
Every card (videos, articles, tools, products, case studies) uses the same hover:
`transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300`
- A 6px lift, the border moving from Hairline to Hairline Strong. Never a bright blue border or outline on hover.
- Inside the card the title may turn Signal Blue (`group-hover:text-[#2B59FF] transition-colors`), and a trailing arrow-up-right may nudge up and right (`group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform`).
- No scale on web cards; only inner icons scale (to 105%).

### Motion
Motion settles fast and never feels sluggish. Every animation honours `prefers-reduced-motion`.
- **Signature easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (launches at once, settles smoothly) for reveals, card lifts, button rises, sheets and motion graphics. **Standard easing** `cubic-bezier(0.4, 0, 0.2, 1)` for continuous transforms. Never linear.
- **Timings:** icon glides 180ms, button rise 220ms, button press settle 90ms, card lift 200ms, drawers, sheets and scene changes 350ms. UI reveals stay within 180–240ms.
- **Stagger:** on the site, scroll reveals step 70ms per item, capped at 280ms (`[data-reveal-stagger]`, src/index.css). In video and canvas work, 50ms per item (40–60ms).
- **Glow:** Glow Cyan glows only on navy: `box-shadow: 0 0 28px rgba(0, 212, 255, 0.22)` with a `rgba(0, 212, 255, 0.85)` border, as the product flow diagrams use (`flow-active`); up to `0 0 24px rgba(0, 212, 255, 0.35)` in video. Never a glow on a light surface.
- **Video and canvas (HyperFrames):** 60 fps deterministic keyframes; a reveal runs 12–18 frames; spring `{ stiffness: 260, damping: 20, mass: 1 }` for card bounces; a card may scale to at most 1.015 in video (never on the web).

### Named Rules
**The Earned Lift Rule.** Nothing floats until the visitor reaches for it. Resting surfaces stay flat. Lift and shadow mean "this responds to you".

## Shapes

Soft, generous corners throughout, which make the site friendly rather than corporate:

- **8px:** small icon wells, logo tiles and the menu button.
- **12px:** buttons, inputs, callouts and alerts.
- **16px:** standard cards and embedded video frames.
- **24px:** feature panels, the hero portrait card and large containers (16px on mobile).
- **Full (pill):** filter chips, counters, avatar dots and the active-nav underline.
- **6px:** status badges.

Borders are 1px Hairline almost everywhere. A Signal Blue border at 20–40% opacity marks a hover or brand edge on navy panels.

## Components

### Buttons
Confident, tactile, and always given room to breathe.
- **Shape:** gently rounded (12px).
- **Primary:** Signal Blue fill, white bold 16px text, 14px × 28px padding (10px × 20px in the header), with a trailing arrow-up-right icon at 16px.
- **Hover / Focus:** Signal Blue Deep fill, with a lift of 3px and a blue-tinted rise shadow (220ms, ease-out-expo `cubic-bezier(0.16, 1, 0.3, 1)`). Pressing settles it to 1px in 90ms. Reduced motion removes the lift.
- **Secondary:** a white fill, a Hairline Strong border, Deep Navy semibold text and a muted icon. On hover the border tints toward Signal Blue at 40% and the fill turns Paper. It lifts the same way as the primary button.
- **YouTube:** the same shape with a red-tinted rise shadow (`btn-rise-red`).
- **On a dark card:** a white button with Deep Navy bold text, a Hairline border and a Signal Blue icon (`btn-rise bg-white hover:bg-slate-100 border border-slate-200 text-[#0A2540] font-bold`).
- **Use `ButtonLink`** (src/components/ButtonLink.tsx) for buttons that are links, rather than copying classes: `inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base` (14px × 24px; the 115 percent root size on phones makes it about 16px × 28px), with a 16px (`w-4 h-4`) trailing arrow-up-right on primary buttons. Primary: `btn-rise btn-rise-blue font-bold text-white bg-[#2B59FF] hover:bg-[#2047E0] shadow-lg shadow-[#2B59FF]/25`. Secondary: `btn-rise font-semibold text-[#0A2540] bg-white/90 backdrop-blur border border-slate-300 hover:border-[#2B59FF]/40 hover:bg-white shadow-md shadow-slate-300/40`. A secondary button is always a white fill with a visible border, never a grey fill (it reads as a panel on Paper).
- **Width:** sized to the label (`inline-flex`, plus `self-start` inside flex columns). Never `w-full` on a button and never `items-stretch` on a row that stacks buttons on phones. Full-width rows are for list items only (contents, chapters, filters).
- **Call-to-action copy:** the consultation and contact button says "Work with me" (header, menus, feature cards). The case study pages say "Work with us", as the work was a team's. Never "Discuss your website with Matt".

#### Button Rise & Shadow (`btn-rise`, every call-to-action button)
Hover and keyboard focus raise the button 3px with a soft drop shadow underneath, tinted to its colour; pressing settles it to 1px with a tighter shadow in 90ms, like a physical push. 220ms with the signature easing. Disabled buttons don't rise; reduced motion keeps the shadow and drops the movement. Tints: `btn-rise-blue` on Signal Blue, `btn-rise-red` on YouTube red, the navy default on navy, white and slate buttons.
- `btn-rise` owns the transition: never combine it with `transition-colors`, `transition-all` or `duration-*` (they override it and the rise stops animating), and never `active:scale-*` on a button.
- Buttons and button-styled links only: not nav text links, menu rows or filter pills. Cards use the Card Lift recipe.
- Definition (`src/index.css`):

```css
@utility btn-rise {
  transition-property: translate, box-shadow, background-color, border-color, color, opacity;
  transition-duration: 220ms;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  &:hover:not(:disabled), &:focus-visible {
    translate: 0 -3px;
    box-shadow: 0 14px 22px -10px var(--btn-rise-shadow, rgb(10 37 64 / 0.4)), 0 4px 8px -4px rgb(10 37 64 / 0.12);
  }
  &:active:not(:disabled) {
    translate: 0 -1px;
    box-shadow: 0 6px 12px -6px var(--btn-rise-shadow, rgb(10 37 64 / 0.4)), 0 2px 4px -2px rgb(10 37 64 / 0.1);
    transition-duration: 90ms;
  }
  @media (prefers-reduced-motion: reduce) { &:hover, &:focus-visible, &:active { translate: none; } }
}
@utility btn-rise-blue { --btn-rise-shadow: rgb(43 89 255 / 0.55); }
@utility btn-rise-red { --btn-rise-shadow: rgb(220 38 38 / 0.5); }
```

### Chips
- **Style:** pill-shaped filter chips on the tools and listing pages, with a white fill, hairline border, Deep Navy text and a small count in a Wash pill.
- **State:** the selected chip inverts to a Deep Navy fill with white text.

### Icon Wells
- **Style:** a lucide line icon in Signal Blue on a flat Signal Blue tint (`bg-[#2B59FF]/[0.08] text-[#2B59FF]`), 40–48px square with a 12px radius (8px when small). On a navy panel the well is solid Signal Blue with a white icon.
- **Hover:** inside a whole-card link the well fills solid Signal Blue and the icon turns white, as in the mega menu and the services cards.
- **Never:** gradient fills, glows or coloured shadows on icon wells. One flat colour, so every icon across the site reads as one family.

### Status Badges
- **Style:** 0.75rem uppercase semibold label with wide tracking, a 6px radius and a 1px border, tinted by status (Active is emerald, Maintenance amber, Research indigo, Retired slate). Retired items also show their logo in greyscale at 60% opacity.

### Cards / Containers
- **Corner Style:** 16px for standard cards and 24px for feature panels.
- **Background:** Surface white on Paper.
- **Shadow Strategy:** an extra-small shadow at rest, with a hover lift as described under Elevation & Depth.
- **Border:** 1px Hairline, shifting to Hairline Strong on hover.
- **Internal Padding:** 24px, rising to 32px on larger panels.
- **Whole-card links:** an absolutely positioned link overlay makes the entire card clickable. Inner icons scale to 105% on hover.
- **Card footer:** a top Hairline row (`pt-3 border-t border-slate-100`) with a Signal Blue semibold label ("Watch Video", "Read Article", "View Specifications") and an arrow-up-right that nudges on hover.
- **Video card:** a 16:9 thumbnail with a duration chip in the bottom-right corner (`bg-black/85 text-white font-mono`, rounded), the date and views in the meta row, the title clamped to two lines.
- **Tool card:** the logo well (or the monogram tile), the status badge and price at the right, then the title and a two-line summary.

### Inputs / Fields
- **Style:** white fill, 1px Hairline border, 12px radius, 10px × 14px padding at 16px text. Inputs with icons get a leading 16px icon and 36px of left padding.
- **Focus:** the outline is removed and replaced by a 2px Signal Blue focus ring.
- **Error / Success:** errors appear in a red-50 box with red-200 border and red-600 text, 12px radius. Success replaces the form with an emerald-50 panel.

### Navigation
- **Style:** semibold 16px Outfit in Ink Muted, with 24–32px gaps between items.
- **Hover:** text turns Signal Blue.
- **Active:** Signal Blue text with a 2px pill underline in Signal Blue.
- **Brand mark:** the logo tile, then "MRK" in Deep Navy and "WP" in Signal Blue, extrabold.
- **Mobile:** below `lg`, a menu button opens a full-width drawer. The header's call-to-action button hides below `md`.

### Layered Header (signature component)
Every main page opens with `LayeredHero` (src/components/LayeredHero.tsx): Home, About, Contact, Services, care plans, agencies.
- **Structure:** a small intro line (with Matt's avatar on most pages), then two huge lines in Anton: the first solid Deep Navy, the second white with a Signal Blue outline (`max(1.25px, 0.012em)`) and a soft light grey glow (`text-shadow: 0 0.03em 0.08em rgb(100 116 139 / 0.15), 0 0 0.22em rgb(148 163 184 / 0.18)`), so the words read as solid shapes where Matt and the tiles overlap them. `outlineStyle="hollow"` keeps the old see-through outline if a page ever needs it. The heading reads as one sentence ("Hi, I'm Matt. For agencies, I'm your AI-powered super-sub."). Keep each big line to 1–3 words; the two lines share one size, fitted so the longer one fills the column (src/scripts/enhance.ts), and very short words are capped at 21cqw.
- **Matt in front:** a transparent cut-out stands in front of the outline line, with his head breaking through it. The bottom of the photo fades into the page. Use a different cut-out on neighbouring pages where possible.
- **Around him:** a short "aside" line on the left (where he's based, who it's for), brand logos on the right where the page has no logo strip of its own, buttons over his torso, and up to four tool tiles.
- **Depth:** the layers drift apart with the pointer and separate on scroll (`data-parallax`); still for reduced motion. The tool tiles get no blur on the light page: blur only reads as depth on dark backgrounds.
- **Phones:** Matt overlaps the outline line less so the word stays readable; the aside, logos and buttons follow below him.
- **Class recipe:** line 1 `font-condensed font-normal leading-[0.9] tracking-[-0.005em] whitespace-nowrap text-[#0A2540]`; line 2 the same with `text-white [-webkit-text-stroke:max(1.25px,0.012em)_#2B59FF] [text-shadow:0_0.03em_0.08em_rgb(100_116_139/0.15),0_0_0.22em_rgb(148_163_184/0.18)]`.
- **On video:** see Layered Type on Video below.

### Layered Type on Video (YouTube, Shorts and thumbnails)
The same two lines as the Layered Header, behind Matt. The templates (16:9 and Shorts frames, DaVinci Resolve safe-area guides, lower thirds, thumbnails) live in the Claude design canvas "MRK WP Social Design Framework" (https://claude.ai/artifact/NbQTbtU8yMixcdEv91qERj), which follows these rules.
- **Type:** Anton 400, line-height 0.9, tracking -0.005em, no wrapping, 1–3 words a line, both lines the same size. Line 1 solid Deep Navy; line 2 white with a Signal Blue outline at 1.2% of the type size, never under 1.25px, and the light grey glow from the Layered Header.
- **The words are what Matt is saying:** the key phrase of the sentence being spoken, the setup on line 1 and the payoff on line 2. They change with the sentence and hold at least one second.
- **Light background only:** Paper #F8FAFC with a soft Signal Blue spotlight behind Matt (Signal Blue at about 10–16% opacity, heavily blurred, about 60% of the frame width in 16:9 and 90% in 9:16). No dark frame and no Glow Cyan behind the layered lines.
- **Matt in front:** cut out (DaVinci Resolve Magic Mask) on a track above the text, his head breaking through line 2. The words never cover his face.
- **Motion:** line 1 rises in, line 2 follows 80ms later, with the signature easing (about 560ms). No bounces or spins.
- **Captions stay separate:** at the bottom, inside the safe area, in Outfit (16:9: SemiBold 44px on a navy box at 85%, the keyword may be Glow Cyan since it sits on navy; Shorts: Outfit 700–800 at 64–68px, two lines).
- **YouTube 16:9 (1920 × 1080) and thumbnails:** the lines across the top half, starting about 9% from the top at about 13% of the frame width a line; Matt about 66% of the frame height, centred. Keep the bottom 15% (162px) clear for lower thirds, and a 96px title-safe margin. Thumbnails: 1280 × 720, at most five words, nothing important in the bottom-right corner (the timestamp).
- **Shorts 9:16 (1080 × 1920):** the lines in the top third, starting about 14% from the top at about 20% of the frame width; Matt about 60% of the frame height, just left of centre (43%). Keep clear of the top 12% (220px), the bottom 22% (420px) and the right 14% (160px), where YouTube's buttons and caption sit.
- **DaVinci Resolve:** Text+ in Anton; Shading 1 white fill, Shading 2 a thin Signal Blue outline, Shading 3 a soft light grey shadow at low opacity.

### Stepped Stack
Any process (how we work, how a sprint runs) uses `StepStack` (src/components/StepStack.tsx), 3 or 4 steps.
- **From lg:** cards climb like stairs to the top right on a hairline floor; the heading fills the empty space above the low steps.
- **Tones:** the first card light (Wash), the middle ones Deep Navy, the last Signal Blue with an arrow: the goal.
- **Numerals:** a big outlined Anton numeral cropped off each card's top-right corner (Signal Blue on light, Glow Cyan on navy, white on blue), echoing the Layered Header.
- **Phones:** a single column that steps in from the left.

### Pinned Page (signature component)
The navy feature panel: a 24px-radius card with a `deep-navy → navy-lift → deep-navy` gradient, a Signal Blue border at 20% opacity, and a large shadow. It holds Matt's portrait (TiltCard, maximum tilt 9° with a holographic wash that follows the pointer), YouTube video cards (3D layered with a float shadow) and the About timeline. It is the only place where Glow Cyan, 3D depth and dark backgrounds appear together. Keep `overflow-hidden` off the tilting element so the 3D effect isn't flattened, and round the children instead.

**TiltCard** (src/components/TiltCard.tsx, run by src/scripts/enhance.ts with no React): tilts toward a mouse or pen, never on touch, so scrolling stays smooth; at most 9° on each axis (`data-tilt`), 1200px perspective (`perspective-1200`, `preserve-3d`) and a soft glare; `holographic` adds the cyan and indigo wash, on dark cards only; still under reduced motion. Text layers float 40–64px in front with `translate-z-[40px]`–`translate-z-[64px]` plus `text-float`. Always the bracket form: Tailwind's `translate-z-40` means 160px and throws text past the card edge.

### Brand Logos
- **Where:** the About page (since 1.6.0), from src/data/brands.json. Since 1.6.12 the homepage's "On the web since 2000" tile (src/components/AboutBento.tsx) also shows six of them as small chips (40px tall, 8px radius) inside a Paper panel, like the logo chips in the services bento's "get found" tile; no other logo strip on the homepage.
- **Style:** a still grid of flat white logo tiles (12px radius, Hairline border, `shadow-xs`, 4.75rem tall): 3 columns, 4 from `sm`, 6 from `lg`, 12px gaps. No marquee, no script. The logos don't tilt.

### Case Study Page
One layout for every case study (src/views/CaseStudyDetailPage.tsx): a client story, told once. Stories vary (websites, software, video, marketing), so the page and its fields hold only what every story has.
- **Top:** the featured image.
- **Story card:** the summary, then the story from WordPress. Images sit inside the story, beside the paragraph they show.
- **Client quote:** straight after the story, when there is one.
- **Sidebar:** Project details (client, location, industry, services, went live, their website), the call to action, then On This Page, which sticks. No numbers, no platform, nothing that only some stories have.
- **Cards** (/work/, "More case studies", service pages): the same for every story, newest first. No numbers on cards.
- **Story blocks** (src/lib/storyBlocks.ts): anything particular to one story is a WordPress block inside the story, never a field or a fixed section. Two exist, at most one of each per story:
  - **Before and after:** two images and a caption; shows as the drag slider.
  - **Results:** up to four rows of label, before and after, as free text; shows as one strip with the new figure large and "Was …" under it. Navy figures, no green, no monospace.
- **Video:** a YouTube video in the story shows as its poster with the play button and plays in a popup over the page, so the story stays where the reader left it. It is a normal YouTube embed in WordPress, not a field.
- **Adding to this:** a new field must be one nearly every story fills in. Otherwise it is a block.
- **Writing a story:** four headings, in this order: "The client", "The problem", "What we did", "The result" (a short "The takeaway" may close it). 300–700 words. Up to four images, each with a caption. Say the result once, in plain words a business owner would use.

### Mono Note
A single line of monospace at the top of a feature card, in Signal Blue or Teal. It works like a margin annotation ("watch + learn", "One conversation. A clearer way forward."). Use one per card at most.

## Do's and Don'ts

### Do:
- **Do** build every new page inside the 72rem container with the shared gutters (16/24/32px), and open inner pages with the `page-intro` block.
- **Do** write H1s and major H2s as two-tone headlines: a Deep Navy statement, then a Signal Blue payoff.
- **Do** use `btn-rise` plus the right tint (`btn-rise-blue`, `btn-rise-red`) on every call-to-action button instead of `transition-all` or scale-on-press.
- **Do** keep cards white on Paper with a 1px Hairline border and 24px padding, and let hover alone add lift.
- **Do** reserve navy panels for Matt, video and the timeline, and keep Glow Cyan inside them.
- **Do** honour `prefers-reduced-motion` for every new animation or tilt.
- **Do** size buttons to their label (`self-start` in flex columns).
- **Do** keep pages plain HTML: small interactions go in `src/scripts/enhance.ts`; a React island only for something that truly needs it (a form with live state, a checkout), hydrated when scrolled to.

### Don't:
- **Don't** add a second saturated attention colour on light surfaces. Signal Blue is the only one; Teal stays a small mark.
- **Don't** put Glow Cyan text on white or Paper.
- **Don't** set running text, buttons or nav below 16px.
- **Don't** hard-code new hex values in components. Reference these tokens. (The code currently repeats `#2B59FF` and `#0A2540` inline; new work should move toward the `@theme` variables, not add more copies.)
- **Don't** give resting cards large shadows or sharp (0–4px) corners. Depth is earned on hover, and corners stay soft.
- **Don't** use YouTube Red for anything that isn't a YouTube action.
- **Don't** put gradients on icons or icon wells (no blue-to-cyan fills, no coloured glows behind an icon). Icon wells are one flat tint; see Icon Wells.
- **Don't** split article content into columns. Inside the article body (posts, case study stories, WordPress content), lists, points and comparisons run in a single column, one item under the next: no card grids, no two-column lists, no side-by-side comparison cards. Number tiles in a stat panel are the one exception.
- **Don't** give cards a coloured accent border on one side (top or left stripe). A card gets the 1px Hairline border all round, nothing more.
- **Don't** use a full-width white band without a border. White lives inside bordered containers.
- **Don't** give cards a blue border or outline on hover, or scale web cards.
- **Don't** use `active:scale-*` on buttons, or `transition-*` / `duration-*` alongside `btn-rise`.
- **Don't** make a button full width (`w-full`, or `items-stretch` on a stacking row), or give a secondary button a grey fill.
- **Don't** put share, YouTube or "visit" buttons in a detail page's header.
- **Don't** write `translate-z-40` on a TiltCard layer; use `translate-z-[40px]`.
- **Don't** invent a new visual variation for a list or set of points when an existing block will do. Fewer variations keep articles calm and consistent.
