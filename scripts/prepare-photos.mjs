/**
 * Downloads the site's photography from Unsplash and converts it to WebP.
 *
 *   node scripts/prepare-photos.mjs
 *
 * The files are committed, not fetched at build time, for three reasons: the
 * build must not depend on a third party being up, the content security
 * policy has no img-src for unsplash.com and should not need one, and
 * astro:assets can only generate responsive variants and intrinsic
 * dimensions for an image it has on disk — which is what keeps these from
 * causing layout shift.
 *
 * Unsplash License: free to use, commercial use included, no permission
 * needed. Attribution is not required but is recorded in CREDITS.md anyway.
 *
 * Re-run only when swapping a photo. The ids below are Unsplash photo ids.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT_DIR = 'src/assets/photos';

/**
 * [slug, unsplash photo id, description, aspect]
 *
 * The aspect is cropped here rather than left to object-fit in the browser.
 * Several of these arrive 1800x2700, and shipping a 2700px-tall file to be
 * displayed as a 16:7 banner means the visitor downloads roughly three times
 * the pixels they are shown.
 */
const PHOTOS = [
  ['hero', 'photo-1781264896328-c7ce738762fc', 'Three residential houses with driveways and green trees', 16 / 9],
  ['neighborhood', 'photo-1781264896328-c7ce738762fc', 'Three residential houses with driveways and green trees', 4 / 3],
  ['homes-street', 'photo-1782116987589-046f4908e130', 'Row of traditional brick houses along a sidewalk', 16 / 7],
  ['living-room', 'photo-1649083048770-82e8ffd80431', 'A living room with a couch, a chair and a fireplace', 16 / 7],
  ['reporting', 'photo-1518455027359-f3f8164ba6bd', 'A bright home office with a desk and chair', 16 / 7],
  ['agreement', 'photo-1714836982299-7a3b6930e2f5', 'A house with a porch and steps leading to the front door', 16 / 7],
  ['keys', 'photo-1741156386380-0236c72eb6f9', 'Holding house keys in front of an entrance', 16 / 7],
  ['numbers', 'photo-1742318592061-15c5f19e1e47', 'A hand holding keys with a house-shaped keychain over coins', 16 / 7],
  ['houses-trees', 'photo-1576375801517-45814f908aa4', 'Brown houses behind trees', 16 / 7],
  ['street-row', 'photo-1672626881472-b96d3eb5445e', 'A row of houses on a residential street', 16 / 7],
];

/** Master width. astro:assets derives everything smaller from this. */
const WIDTH = 2400;

await mkdir(OUT_DIR, { recursive: true });

const credits = [
  '# Photography credits',
  '',
  'All photographs are from Unsplash and used under the Unsplash License,',
  'which permits commercial use without permission or attribution. They are',
  'credited here regardless.',
  '',
  'Regenerate with `node scripts/prepare-photos.mjs`.',
  '',
  '| File | Unsplash photo | Description |',
  '| --- | --- | --- |',
];

for (const [slug, id, description, aspect] of PHOTOS) {
  const url = `https://images.unsplash.com/${id}?w=${WIDTH}&q=80&fm=jpg&fit=max`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${slug}: ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());

  // `cover` with a north-ish gravity: these are buildings and hands, and the
  // subject sits above centre far more often than below it.
  const out = await sharp(buf)
    .resize({
      width: WIDTH,
      height: Math.round(WIDTH / aspect),
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true,
    })
    .webp({ quality: 78 })
    .toBuffer();

  const meta = await sharp(out).metadata();
  await writeFile(join(OUT_DIR, `${slug}.webp`), out);

  credits.push(`| \`${slug}.webp\` | https://unsplash.com/photos/${id.replace('photo-', '')} | ${description} |`);
  console.log(
    `${slug.padEnd(14)} ${meta.width}x${meta.height}  ${(out.length / 1024).toFixed(0)} KB`
  );
}

await writeFile(join(OUT_DIR, 'CREDITS.md'), credits.join('\n') + '\n');
console.log(`\nWrote ${PHOTOS.length} photos and CREDITS.md to ${OUT_DIR}`);
