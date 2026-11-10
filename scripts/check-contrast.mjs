/**
 * Contrast checker for the design tokens.
 *
 *   node scripts/check-contrast.mjs
 *
 * Reads the token values straight out of src/styles/global.css — the light
 * block and the dark override — and checks every text/surface pair the design
 * actually uses, in both themes. Run it after touching any colour.
 *
 * This exists because "more colour" is the easiest way to break a site for
 * people with low vision, and eyeballing a swatch does not catch it.
 */
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/global.css', 'utf8');

/** Pull `--name: #hex;` pairs out of a chunk of CSS. */
function tokensIn(chunk) {
  const out = {};
  for (const m of chunk.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

const themeBlock = css.slice(css.indexOf('@theme {'), css.indexOf('/* Dark mode'));
const darkBlock = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));

const light = tokensIn(themeBlock);
const dark = { ...light, ...tokensIn(darkBlock) };

function luminance(hex) {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.slice(0, 6);
  const channel = (v) => {
    const s = parseInt(v, 16) / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(full.slice(0, 2)) +
    0.7152 * channel(full.slice(2, 4)) +
    0.0722 * channel(full.slice(4, 6))
  );
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * [foreground token, background token, minimum, what it is]
 * 4.5 is AA for body text, 3.0 is AA for large text (>=24px, or 18.66px bold)
 * and for the boundary of a UI component.
 */
const PAIRS = [
  ['color-ink', 'color-surface', 4.5, 'body text'],
  ['color-ink', 'color-page', 4.5, 'body text on the page colour'],
  ['color-ink-muted', 'color-page', 4.5, 'secondary text on the page colour'],
  ['color-accent', 'color-page', 4.5, 'accent on the page colour'],
  ['color-gold', 'color-page', 3.0, 'gold rule on the page colour'],
  ['color-ink', 'color-surface-2', 4.5, 'body text on muted band'],
  ['color-ink', 'color-surface-3', 4.5, 'body text on deep band'],
  ['color-ink-muted', 'color-surface', 4.5, 'secondary text'],
  ['color-ink-muted', 'color-surface-2', 4.5, 'secondary text on muted band'],
  ['color-accent', 'color-surface', 4.5, 'eyebrow / accent text'],
  ['color-accent', 'color-surface-2', 4.5, 'accent on muted band'],
  ['color-cta-ink', 'color-cta', 4.5, 'primary button label'],
  ['color-ornament', 'color-surface', 3.0, 'large decorative numerals'],
  ['color-control-border', 'color-surface', 3.0, 'control borders'],
  ['color-focus', 'color-surface', 3.0, 'focus ring'],
  // The blue band and the deep blue band.
  ['color-ink', 'color-surface-band', 4.5, 'body text on blue band'],
  ['color-ink-muted', 'color-surface-band', 4.5, 'secondary text on blue band'],
  ['color-accent', 'color-surface-band', 4.5, 'accent on blue band'],
  ['color-on-band-deep', 'color-band-deep', 4.5, 'text on deep blue band'],
  ['color-band-deep-soft', 'color-band-deep', 4.5, 'body text on deep band'],
  ['color-band-deep-gold', 'color-band-deep', 4.5, 'gold eyebrow on deep band'],
  ['color-cost-on-deep', 'color-band-deep', 4.5, 'cost figure on deep band'],
  ['color-band-text', 'color-surface', 4.5, 'blue text on white'],
  ['color-band-text', 'color-surface-band', 4.5, 'blue text on blue band'],
  // Gold is ornament only. It never carries text, so it is held to the 3:1
  // required of a meaningful non-text mark, and only --color-gold is: the
  // bright one is decoration and is deliberately not checked, because
  // checking it would imply it may be used for something readable.
  ['color-gold', 'color-surface', 3.0, 'gold rule on white'],
  ['color-gold', 'color-surface-2', 3.0, 'gold rule on muted band'],
  ['color-gold', 'color-surface-band', 3.0, 'gold rule on blue band'],
  // Functional colour in the calculator.
  ['color-cost', 'color-surface', 4.5, 'cost figures'],
  ['color-cost', 'color-surface-2', 4.5, 'cost figures on muted band'],
];

let failures = 0;
for (const [theme, tokens] of [
  ['light', light],
  ['dark', dark],
]) {
  console.log(`\n${theme.toUpperCase()}`);
  for (const [fg, bg, min, label] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) {
      console.log(`  ?     missing token: ${!tokens[fg] ? fg : bg}  (${label})`);
      failures++;
      continue;
    }
    const r = ratio(tokens[fg], tokens[bg]);
    const ok = r >= min;
    if (!ok) failures++;
    console.log(
      `  ${ok ? 'ok  ' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${label}`
    );
  }
}

console.log(
  failures === 0
    ? `\nAll ${PAIRS.length * 2} pairs pass.`
    : `\n${failures} pair(s) FAILED.`
);
process.exit(failures === 0 ? 0 : 1);
