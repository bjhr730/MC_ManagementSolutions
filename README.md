# MC Management Solutions

Marketing website for **MC Management Solutions of Virginia, LLC**, a
residential property management company serving Northern Virginia.

The site has one job: turn a property owner into a consultation request.
Everything else serves that.

- **Framework:** [Astro 5](https://astro.build) — static HTML, no client framework
- **Styling:** Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`)
- **Forms:** Astro server route → Neon Postgres → Resend
- **Hosting:** Vercel

**Shipped to the browser: ~2.2 KB of JavaScript**, for the mobile menu. That is
the whole budget. Please keep it that way.

---

## Quick start

```bash
npm install
cp .env.example .env    # then fill it in
npm run dev             # http://localhost:4321
```

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` and `.vercel/output/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | `astro check` — TypeScript and template diagnostics |

Node 20.3+ is required. Vercel runs the deployed functions on Node 22; if you
develop on Node 24 you will see a harmless warning at build time.

### A note on the `rollup` override

`package.json` pins `rollup` to `@rollup/wasm-node`. This is a workaround for a
development machine where Windows Application Control blocks rollup's native
`.node` binary, which otherwise fails the build with `ERR_DLOPEN_FAILED`. The
WASM build is a drop-in replacement and is slightly slower. If nobody is
building on a machine with that policy, delete the `overrides` block and run
`npm install` to go back to native rollup.

---

## Editing the content

All copy lives in `src/content/` as typed data. No CMS, no database, no admin
login — change the file, commit, and the site rebuilds.

| File | Holds |
| --- | --- |
| `src/content/home.ts` | Home page hero, benefits, founder teaser |
| `src/content/about.ts` | About Us copy and the mission statement |
| `src/content/founder.ts` | Antonio's bio, pull-quotes and credential stats |
| `src/content/philosophy.ts` | The three guiding principles |
| `src/content/services.ts` | The seven services |
| `src/content/why-us.ts` | Why Choose Us reasons |
| `src/content/management-plans.ts` | Plans page, fee categories, what's included |
| `src/content/faq.ts` | The owner FAQ entries, in the approved order |
| `src/content/home.ts` | Hero, the three owner paths, founder teaser, tools teaser |

Two config files hold everything else:

- **`src/config/site.ts`** — phone, email, address, hours, service areas,
  navigation, and the portal feature flag. Every unknown real-world fact is in
  here and marked `REPLACE`.
- **`src/config/compliance.ts`** — fair housing statement, brokerage
  disclosure, pricing disclosure, licence numbers.

### Colour and motion

A second brand colour (evergreen) joins navy and the bronze accent, and bands
alternate white / sage / evergreen / navy to give the pages some rhythm.
Colour is also used functionally: the cost figures in the calculator are clay,
not navy, because they are costs.

`node scripts/check-contrast.mjs` parses the tokens out of `global.css` and
checks every text-on-surface pair in both themes against WCAG. **Run it after
touching any colour.** It already caught two real defects: form inputs and
buttons had 1.58:1 borders, failing WCAG 2.2 1.4.11 for component boundaries
(now a dedicated `--color-control-border`), and a bronze eyebrow on the
evergreen band measured 4.09:1.

Motion is CSS-only — the whole layer adds nothing to the JavaScript budget.
Scroll reveals use native `animation-timeline: view()` inside `@supports`, so
browsers without it simply show the content rather than leaving it at
`opacity: 0`.

**The reveal classes go on small elements only** — a card, a row, a heading.
On a tall section wrapper the `entry` range stretches across most of the
scroll through that section, which leaves content sitting on screen fully
transparent. That was measured, not theorised: an element 800px down a 1015px
viewport was invisible. The range is now `entry 0% entry 70%`, so an element
is opaque well before it finishes entering.

Everything is inside `prefers-reduced-motion: no-preference`.

### The owner tools

`/tools` holds two calculators. Each has its own model module, imported twice
— once in the component frontmatter so the page ships a worked example that is
correct before any JavaScript runs, and once in the browser script that
recomputes as the inputs move. One implementation each, so server-rendered and
live figures cannot drift.

**Tool 1, `src/lib/vacancy.ts`** — what a vacancy exposes an owner to. Carrying
costs are reported separately and labelled ongoing, because a mortgage is owed
whether or not anyone lives there; the vacancy removes the rent that would have
met it. Hence "exposure", not "loss".

**Tool 2, `src/lib/pricing.ts`** — rent sooner at a lower price, or wait for a
higher one. Both scenarios are measured over **one window starting today**, and
that is the entire point: comparing twelve months of rent under each scenario
ignores the waiting, so the higher rent always wins and the tool tells you
nothing. Break-even solves `income_B(x) = income_A` over that window. Carrying
costs appear nowhere, because they are identical under both scenarios.

Tool 1 deliberately does **not** answer the waiting question. It used to, and
two different break-even figures on one page is worse than none.

Both charts are SVG with `width`/`x` presentation attributes rather than styled
divs: the CSP has no `'unsafe-inline'` for styles, so an inline style attribute
is reported on every change. Presentation attributes are not styles.

Neither tool gates results behind contact details. Figures travel to the
contact form only when someone chooses the rental-evaluation button, through
`sessionStorage` rather than the URL, and land in the message box where they
can be read and edited before sending.

### The home page path chooser

The "Where should we start?" selector is radio inputs plus the `:checked`
sibling combinator — no JavaScript. The radios, their labels and the panels
must stay siblings in one flex container for the selector to reach across
them; the panels are moved onto their own row with `order`, not by nesting.

### Turning the portals on

Buildium is not live yet. When it is, open `src/config/site.ts`, set
`PORTALS_LIVE = true` and fill in the two URLs. That one change reveals the
portal links in the footer and turns `/portals` from a "coming soon" page into
a real one. Until then, nothing on the site mentions a portal — which is what
the launch checklist requires.

### Turning off the pre-launch banners

`src/config/compliance.ts` exports `REVIEW_MODE = true`. While it is true, the
footer and the legal pages carry a visible notice that the disclosures have
not been reviewed. Set it to `false` only after a qualified Virginia
professional has signed off on that file.

---

## Environment variables

Copy `.env.example` to `.env` locally; set the same keys as Vercel project
environment variables in production.

| Variable | Required | Notes |
| --- | --- | --- |
| `SITE_URL` | yes | Canonical origin, no trailing slash. Drives canonical tags, sitemap, robots.txt, Open Graph. |
| `SITE_INDEXABLE` | launch | Anything but `"true"` serves `Disallow: /` and a `noindex` meta on every page. Leave unset on staging; set to `"true"` in production at launch. |
| `RESEND_API_KEY` | prod | Without it, inquiries are still stored but no email is sent. |
| `INQUIRY_FROM_EMAIL` | prod | Must be on a domain verified in Resend. |
| `INQUIRY_TO_EMAIL` | prod | Where owner inquiries land. |
| `DATABASE_URL` | prod | Neon pooled connection string. |
| `PUBLIC_TURNSTILE_SITE_KEY` | prod | Public; rendered into the page. |
| `TURNSTILE_SECRET_KEY` | prod | **Secret.** If unset in production, every submission is rejected rather than left unprotected. Leave both blank locally to skip the check. |

---

## How the inquiry form works

`/contact` is the only route that is not static (`export const prerender =
false`). It handles its own `POST` so that a failed submission can re-render
with the values intact and each error attached to its field — no JavaScript
required. On success it redirects to `/thank-you` (303), so a refresh resends
nothing.

```
POST /contact
  ├─ honeypot check      → silently accepted, nothing stored
  ├─ zod validation      → re-render with errors + submitted values
  ├─ Turnstile verify    → skipped locally, enforced in production
  ├─ INSERT into Neon    ← stored FIRST, so an email outage cannot lose a lead
  ├─ Resend → Antonio    (reply-to is the inquirer)
  ├─ Resend → inquirer   (acknowledgement)
  └─ 303 → /thank-you
```

Storage and email failures are logged, not surfaced: once the row is in, the
person gets their confirmation either way.

### The database

One table. Create it with:

```sql
CREATE TABLE IF NOT EXISTS inquiries (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at       timestamptz NOT NULL DEFAULT now(),
  name             text        NOT NULL,
  email            text        NOT NULL,
  phone            text,
  property_address text        NOT NULL,
  property_type    text,
  occupancy        text,
  involvement      text,
  timeline         text,
  message          text,
  source_ip        text,
  handled_at       timestamptz,
  notes            text
);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries (created_at DESC);
```

`handled_at` and `notes` are there so inquiries can be worked through without
needing a second system.

---

## Accessibility

Target is **WCAG 2.2 Level AA**, and it is verified rather than assumed: every
page audits clean under axe-core (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`
and best-practice rules).

What that means in practice:

- Semantic landmarks, one `<h1>` per page, no skipped heading levels.
- A skip link, and a focus ring that is never removed.
- The mobile menu is a native `<dialog>`, so the focus trap, Escape handling
  and background inerting are the browser's job, not ours.
- The FAQ is `<details>`/`<summary>` — zero JavaScript, correct semantics.
- The form has permanent visible labels, `autocomplete` attributes, inline
  errors tied by `aria-describedby`, and an error summary that the browser
  focuses natively because it is the form's fragment target.
- Spam protection is Turnstile, not a visual puzzle.
- Every text colour is contrast-checked against its surface; ratios are noted
  inline in `src/styles/global.css`.
- Dark mode follows the OS preference, with no toggle and no flash.

Re-run the audit by serving `axe.min.js` from `public/` and calling `axe.run()`
against each route, or point any axe-based tool at the dev server.

## Performance

| | |
| --- | --- |
| JavaScript shipped | ~2.2 KB (mobile menu only) |
| CSS | ~30 KB uncompressed, one file |
| Fonts | 2 × latin-only variable woff2, ~99 KB total, preloaded |
| Third-party requests | none, except Turnstile when configured |

No analytics, no tag manager, no web font CDN. If you add any of those, measure
first.

---

## Launch preflight

Setting `SITE_INDEXABLE="true"` is what makes this site public. A build with
that flag set **fails** unless the things that silently lose business are in
place:

- Resend configured, or inquiries are stored and nobody is told about them
- `DATABASE_URL` set, or they are not stored either
- a real Turnstile secret, not Cloudflare's always-pass test key
- `SITE_URL` set to the real domain, not the placeholder

Nothing runs while the flag is off, so staging builds are untouched. It fails
rather than warns because each of these produces a site that looks perfectly
fine and quietly does the wrong thing. A failed deploy costs a minute; a
fortnight of lost leads does not.

The check lives in `launchPreflight()` in `astro.config.mjs`.

## Before launch

Owned by the business, not the code:

- [ ] Fill in the remaining `REPLACE` value in `src/config/site.ts` (business email). Phone, address and hours are set.
- [ ] Fill in `src/config/compliance.ts` (brokerage name, DPOR licence numbers)
- [ ] Have a qualified Virginia professional review `/privacy`, `/terms` and
      `/fair-housing`, then set `LEGAL_REVIEW_DATE` and `REVIEW_MODE = false`
- [ ] Verify the Virginia Fair Housing protected-class list is current
- [ ] Confirm the founder bio's property count (the two source drafts disagree:
      "approximately 60" vs "60–85")
- [ ] Add the real logo (replace `src/components/Logo.astro` and `public/favicon.svg`)
- [ ] Re-run `node scripts/generate-images.mjs` after the logo lands
- [ ] Register the domain, set `SITE_URL`, verify the sending domain in Resend
- [ ] Set `SITE_INDEXABLE="true"` in production (and only production) so the
      site can be indexed
- [ ] Replace the Turnstile **test** keys in Vercel with real ones from the
      Cloudflare dashboard (staging currently uses the always-pass pair)
- [ ] Submit the live form end to end and confirm both emails arrive
- [ ] Set up the Google Business Profile once eligible

---

## Deploying

**Staging:** https://mc-management-solutions.vercel.app

The Vercel project `mc-management-solutions` is linked to this repository,
so every push to `main` deploys. The `@astrojs/vercel` adapter is already
configured; no build settings need changing.

Staging deliberately differs from production in three ways:

- `SITE_INDEXABLE` is unset, so the whole site is `noindex` and `robots.txt`
  serves `Disallow: /`.
- Turnstile uses Cloudflare's **published always-pass test keys**
  (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`). These
  are documented dummy values, not credentials. They exist because the handler
  rejects every submission when `TURNSTILE_SECRET_KEY` is missing in
  production, which would otherwise make the staging form look broken.
  **Replace both with real keys before launch.**
- Resend is not configured, so inquiries are stored in Neon but no email is
  sent. That path is exercised by the code; it just has nowhere to send until
  a sending domain is verified.

### Headers

`vercel.json` sets the cache and security headers that Vercel does not set by
default. Vercel serves everything as `max-age=0, must-revalidate` out of the
box, including content-hashed files, so every repeat visit was re-validating
99 KB of fonts and 30 KB of CSS. Now:

| Path | Cache-Control |
| --- | --- |
| `/_astro/*` (content-hashed) | `max-age=31536000, immutable` |
| `/fonts/*` | `max-age=31536000, immutable` |
| `og.png`, icons | `max-age=86400, stale-while-revalidate=604800` |
| HTML | unchanged: `max-age=0, must-revalidate` |

The font files are cached for a year under stable names, so **rename them if
you ever swap the font**, rather than overwriting in place.

It also sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy` and `Cross-Origin-Opener-Policy`. HSTS comes from Vercel.

### Content Security Policy

The CSP is generated by Astro (`experimental.csp` in `astro.config.mjs`), not
written by hand, and it is delivered as a `<meta>` tag on static pages and as a
response header on `/contact`.

This is not a stylistic preference. A hand-written `script-src 'self'` shipped
first and silently broke the mobile menu on `/contact`: Astro inlines that
script on on-demand rendered pages while bundling it into a file on static
ones, so the policy was correct on 15 pages and wrong on the 16th. Astro hashes
whatever it inlines and writes those hashes into the policy itself, so the two
cannot drift. Adding a hash list here by hand would rot the next time the
script changes.

If you add a third-party script or embed, add its origin to
`scriptDirective.resources` or `directives` — not `'unsafe-inline'`.

### Why `security.checkOrigin` is off

Astro's built-in cross-origin POST check compares the `Origin` header against
the host it sees on the request. Behind Vercel's proxy that is not the host the
browser addressed, so it returned `403 Cross-site POST form submissions are
forbidden` on every submission, including same-origin ones. The equivalent
check now lives in `sameOrigin()` in `src/lib/inquiry.ts` and reads
`x-forwarded-host` first, so it is correct behind the proxy. Verified both
ways against the live deployment: a same-origin POST succeeds, a POST carrying
a foreign `Origin` is refused.

Static pages are served from the CDN. `/contact` runs as a serverless function
because it accepts `POST`.

## Project layout

```
src/
├─ components/   Header, Footer, Seo, JsonLd, Cta, FaqList, InquiryForm, ...
├─ config/       site.ts (facts), compliance.ts (disclosures)
├─ content/      all page copy, as typed data
├─ layouts/      BaseLayout.astro
├─ lib/          inquiry.ts (validate/store/notify), schema.ts (JSON-LD)
├─ pages/        one file per route; robots.txt.ts is generated
└─ styles/       global.css (tokens), fonts.css (@font-face)
```

Structured data is built in `src/lib/schema.ts`: `RealEstateAgent` with the
Northern Virginia service area, `Person` for Antonio, `FAQPage` on `/faq`, and
breadcrumbs on inner pages. It deliberately omits any field that is still a
placeholder — wrong structured data hurts local search more than none.
