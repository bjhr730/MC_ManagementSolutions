# MC Management Solutions — working notes

Marketing site for a residential property manager in Northern Virginia.
Astro 5 + Tailwind 4 + TypeScript, Vercel adapter, near-zero JS.

Staging: https://mc-management-solutions.vercel.app (noindex until launch)

## Commands

```
npm run verify     # types + contrast + build. Run this before saying anything works.
npm run build
npm run check
node scripts/check-contrast.mjs
```

Asset generators, re-run only when source art changes:
`scripts/prepare-photos.mjs` · `prepare-nav-icons.mjs` · `prepare-logo.mjs`

## Invariants — these have each been rediscovered the hard way

**Gold never carries text.** The logo's gold is 2.25:1 on white. `--color-accent`
(blue) takes every text accent; `--color-gold` is ornament and reaches 3:1 for
marks that carry meaning; `--color-gold-bright` is decoration only.

**Run the contrast checker after touching any colour.** It reads tokens straight
out of `global.css`. It only knows the pairs it has been told about — if you move
text onto a new surface, add the pair, or the failure is invisible.

**Motion may move a thing, never reveal it.** Never animate from `opacity: 0`
above the fold. A hero block once sat invisible for 3.4s because `fill: both`
holds the `from` state until the animation starts. Scroll reveals go on small
elements only; on a tall wrapper the `entry` range leaves content on screen at
opacity 0.

**Text over a photograph gets a scrim, measured against the photo's own pixels** —
composite the image data with the scrim alpha and check the worst case. Do not
eyeball it.

**Cards use `.card` / `.panel`.** Don't hand-spell `rounded-* border bg-* p-*`;
that drifted to eight spellings once. Cards are always `--color-surface` so they
read as raised, which is why card-bearing sections are toned `muted` or `band`,
never `default`.

**Decorative images are `alt=""` on purpose.** Banners sit under a heading that
already says what the page is.

## Content rules (from the client's own checklists)

- **No public fee chart.** Pricing is per-owner; the site invites a proposal.
- **No "215+ transactions", "200+ properties" or "NVAR Top Producer"** anywhere.
- Legal text is draft: `REVIEW_MODE = true` in `src/config/compliance.ts` shows a
  visible notice. DPOR numbers and the brokerage name are deliberate placeholders.
- `SITE_INDEXABLE` off ⇒ `Disallow: /` + noindex. On only at launch, and
  `astro.config.mjs` fails the build if Resend / DATABASE_URL / real Turnstile
  keys / a real SITE_URL are missing.

## Verifying UI work

The browser pane is the source of truth, not the dev server's first paint.

- Lazy images and scroll animations need ~2s before a screenshot is meaningful;
  several "bugs" here were screenshots taken mid-animation.
- `:focus` does not match when the pane lacks document focus — `activeElement`
  is set but `matches(':focus')` is false. Not a CSS bug.
- `npm run build` does not refresh the dev server's CSS; reload the page.
- A `loading="lazy"` image reporting `complete: false` is usually NOT broken. The
  pane does not fire lazy loads reliably while it is hidden or the image is off
  screen, and `img.decode()` then never settles. Before calling one broken, check
  `performance.getEntriesByType('resource')`: no entry means never requested, not
  failed. Count `complete && naturalWidth === 0` for actually-broken.
- For a11y, run axe from the page across all 17 routes rather than trusting a
  visual pass. It caught nested landmarks on ten routes that looked fine.

## Windows shell traps

- The Bash tool eats backslashes in heredocs. Put Python in a file and run it
  with `python -I <file>`, or build backslashes with `chr(92)`.
- Use `npx.cmd`, not `npx` (execution policy blocks `npx.ps1`).
- `git commit -F -` with a heredoc, not `-m` with quotes.
- Renaming this folder fails while a shell's cwd is inside it.

## Open, and not design problems

No testimonial and no photographs of properties actually managed — stock only.
Those outrank any further visual work. Logo is a raster badge with an opaque
background; a vector version is the highest-leverage asset still missing.
