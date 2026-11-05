/**
 * Derives the logo assets the site uses from the single file Antonio
 * supplied.
 *
 *   node scripts/prepare-logo.mjs <source image>
 *
 * The source is a 2:1 badge with an opaque dark-navy background, so it cannot
 * sit on a light surface without looking pasted on. Two assets come out of it:
 *
 *   mc-logo-mark   the house-and-MC symbol, squared off, for the header and
 *                  the favicon, where it reads as a deliberate badge
 *   mc-logo-full   the whole lockup, trimmed, for the social card
 *
 * Re-run this when a proper logo arrives — ideally one with a transparent
 * background, which would let the mark sit directly on any surface.
 */
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SOURCE = process.argv[2];
if (!SOURCE) {
  console.error('Usage: node scripts/prepare-logo.mjs <source image>');
  process.exit(1);
}

/** The badge background, sampled from a corner. */
const NAVY = { r: 1, g: 12, b: 40, alpha: 1 };

const meta = await sharp(SOURCE).metadata();
const { width = 0, height = 0 } = meta;

// The wordmark sits in the bottom third; the symbol is everything above it.
const markRegion = {
  left: 0,
  top: 0,
  width,
  height: Math.round(height * 0.68),
};

// Two passes: sharp applies trim before extract within one pipeline, so
// cropping and then trimming has to happen in separate instances.
const markCropped = await sharp(SOURCE).extract(markRegion).toBuffer();
const markTrimmed = await sharp(markCropped)
  .trim({ threshold: 20 })
  .toBuffer({ resolveWithObject: true });

// Measure the trimmed buffer directly: the info returned alongside a trim
// describes the operation, not reliably the resulting canvas.
const trimmedMeta = await sharp(markTrimmed.data).metadata();
const trimmedW = trimmedMeta.width ?? 0;
const trimmedH = trimmedMeta.height ?? 0;

// Square it off with the badge colour, leaving a little breathing room.
const side = Math.max(trimmedW, trimmedH);
const pad = Math.round(side * 0.1);
const box = side + pad * 2;

// Again two passes: sharp resizes before it composites, so squaring up and
// scaling down in one pipeline shrinks the canvas before the mark lands on
// it, and the composite then fails as "larger than the destination".
const squared = await sharp({
  create: { width: box, height: box, channels: 4, background: NAVY },
})
  .composite([
    {
      input: markTrimmed.data,
      left: Math.round((box - trimmedW) / 2),
      top: Math.round((box - trimmedH) / 2),
    },
  ])
  .webp({ quality: 95 })
  .toBuffer();

const mark = await sharp(squared).resize(512, 512).webp({ quality: 90 }).toBuffer();

await writeFile('src/assets/mc-logo-mark.webp', mark);

const full = await sharp(SOURCE)
  .trim({ threshold: 20 })
  .resize({ width: 1200, withoutEnlargement: true })
  .webp({ quality: 90 })
  .toBuffer();

await writeFile('src/assets/mc-logo-full.webp', full);

// A PNG of the mark for the favicon and the Apple touch icon.
await writeFile(
  'public/apple-touch-icon.png',
  await sharp(mark).resize(180, 180).png({ compressionLevel: 9 }).toBuffer()
);
await writeFile(
  'public/favicon.png',
  await sharp(mark).resize(64, 64).png({ compressionLevel: 9 }).toBuffer()
);

const markMeta = await sharp(mark).metadata();
const fullMeta = await sharp(full).metadata();
console.log(
  `mark ${markMeta.width}x${markMeta.height} (${(mark.length / 1024).toFixed(1)} KB), ` +
    `full ${fullMeta.width}x${fullMeta.height} (${(full.length / 1024).toFixed(1)} KB)`
);
