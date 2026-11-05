/**
 * Derives the navigation icons from the seven PNGs Antonio supplied.
 *
 *   node scripts/prepare-nav-icons.mjs <source directory>
 *
 * The sources already carry an alpha channel, but the background is not
 * cleanly transparent: the corners sit at alpha 8-17 rather than 0, so there
 * is a faint white haze over the whole canvas. It is invisible on a light
 * surface and an obvious grey box on a dark one, so it gets cleared here
 * rather than being discovered later on the footer or in dark mode.
 *
 * The sources also have different aspect ratios (375x245 through 350x315).
 * Dropping those into one row would make the wide ones read as smaller than
 * the tall ones, so each is trimmed to its own content and then fitted into a
 * square, which gives every icon the same optical bounding box.
 *
 * Re-run this when Antonio sends new or revised icons.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const SOURCE_DIR = process.argv[2];
if (!SOURCE_DIR) {
  console.error('Usage: node scripts/prepare-nav-icons.mjs <source directory>');
  process.exit(1);
}

/** Source file -> the nav slug it belongs to. */
const ICONS = [
  ['ma_icon_services.png', 'services'],
  ['ma_icon_management_plans.png', 'management-plans'],
  ['ma_icon_why_choose_us.png', 'why-us'],
  ['ma_icon_about.png', 'about'],
  ['ma_icon_tools.png', 'tools'],
  ['ma_icon_faq.png', 'faq'],
  ['ma_icon_contact_us.png', 'contact'],
];

/** Anything at or below this alpha is background haze, not artwork. */
const HAZE = 24;

/**
 * The icons are navy line art with gold accents and white fills. On the dark
 * header the navy disappears and the white fills turn into solid blobs, so a
 * second set is generated for dark mode.
 *
 * Gold is left alone: it already reads at 8.4:1 on the dark surface. Every
 * other pixel is treated as a point on the navy-to-white axis and remapped
 * onto a light-ink-to-dark-surface axis, which inverts the artwork without
 * touching its colour and interpolates the antialiased edges correctly.
 *
 * The two endpoints are the real dark-mode tokens from global.css.
 */
const DARK_INK = { r: 0xe6, g: 0xea, b: 0xef }; // --color-ink, dark
const DARK_SURFACE = { r: 0x15, g: 0x1a, b: 0x20 }; // --color-surface, dark

/** A pixel this much redder than it is blue is one of the gold accents. */
const GOLD_MARGIN = 40;

function toDarkMode(data, channels) {
  for (let i = 0; i < data.length; i += channels) {
    if (data[i + 3] === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r - b > GOLD_MARGIN) continue; // gold accent, keep as drawn

    // Relative luminance, 0 = navy, 1 = white.
    const t = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    data[i] = Math.round(DARK_INK.r + (DARK_SURFACE.r - DARK_INK.r) * t);
    data[i + 1] = Math.round(DARK_INK.g + (DARK_SURFACE.g - DARK_INK.g) * t);
    data[i + 2] = Math.round(DARK_INK.b + (DARK_SURFACE.b - DARK_INK.b) * t);
  }
  return data;
}

/** Painted at 28-36px, so 128 covers a 3x display without being wasteful. */
const SIZE = 128;

const OUT_DIR = 'src/assets/nav';
await mkdir(OUT_DIR, { recursive: true });

for (const [file, slug] of ICONS) {
  const src = join(SOURCE_DIR, file);

  // 1. Clear the haze. Work on raw pixels: zero the alpha below the
  //    threshold, and zero the colour with it so no white fringe survives
  //    to be blended back in during the resize.
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let cleared = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] <= HAZE) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
      cleared++;
    }
  }

  const cleaned = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();

  // 2. Trim to the artwork. Separate pipeline: sharp applies trim before
  //    extract within one pipeline, so trimming and then measuring has to
  //    happen on its own.
  const trimmed = await sharp(cleaned).trim({ threshold: 1 }).png().toBuffer();
  const t = await sharp(trimmed).metadata();

  // 3. Fit the trimmed artwork into a square, centred, with a little room
  //    so neighbouring icons never touch.
  const box = Math.round(Math.max(t.width ?? 0, t.height ?? 0) * 1.08);

  const squared = await sharp({
    create: {
      width: box,
      height: box,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: trimmed,
        left: Math.round((box - (t.width ?? 0)) / 2),
        top: Math.round((box - (t.height ?? 0)) / 2),
      },
    ])
    .png()
    .toBuffer();

  // 4. Scale down separately, because sharp resizes before it composites.
  const resized = await sharp(squared)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const out = await sharp(resized).webp({ quality: 92, alphaQuality: 100 }).toBuffer();
  await writeFile(join(OUT_DIR, `${slug}.webp`), out);

  // 5. The dark-mode twin, remapped from the already-scaled artwork so both
  //    files are pixel-aligned.
  const darkRaw = await sharp(resized).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const darkOut = await sharp(toDarkMode(darkRaw.data, darkRaw.info.channels), {
    raw: {
      width: darkRaw.info.width,
      height: darkRaw.info.height,
      channels: darkRaw.info.channels,
    },
  })
    .webp({ quality: 92, alphaQuality: 100 })
    .toBuffer();

  await writeFile(join(OUT_DIR, `${slug}-dark.webp`), darkOut);

  console.log(
    `${slug.padEnd(18)} ${info.width}x${info.height} -> trimmed ${t.width}x${t.height} ` +
      `-> ${SIZE}x${SIZE} (light ${(out.length / 1024).toFixed(1)} KB, ` +
      `dark ${(darkOut.length / 1024).toFixed(1)} KB, ${cleared} haze px cleared)`
  );
}
