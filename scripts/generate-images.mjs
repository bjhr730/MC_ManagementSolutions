/**
 * Regenerates the social card from the logo, so it is reproducible rather
 * than a binary nobody can rebuild.
 *
 *   node scripts/prepare-logo.mjs src/assets/mc-logo-source.webp
 *   node scripts/generate-images.mjs
 *
 * The first command derives the logo assets and the icons; this one builds
 * the Open Graph card from them. Run both after a logo change.
 */
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SILVER = '#c8ced6';

const LOGO = 'src/assets/mc-logo-full.webp';

// Social card: the supplied logo on the badge navy, with the tagline under
// it. The logo already carries the brand name, so nothing is drawn twice.
const CARD = { width: 1200, height: 630 };

const logo = await sharp(LOGO)
  .resize({ width: 620, withoutEnlargement: true })
  .toBuffer();
const logoMeta = await sharp(logo).metadata();

const tagline = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.width}" height="120">
     <text x="${CARD.width / 2}" y="54" text-anchor="middle"
           font-family="Georgia, serif" font-size="36" font-style="italic"
           fill="#ffffff">Your Property. Our Responsibility.</text>
     <text x="${CARD.width / 2}" y="100" text-anchor="middle"
           font-family="Helvetica, Arial, sans-serif" font-size="26"
           fill="${SILVER}">Northern Virginia property management</text>
   </svg>`
);

await writeFile(
  'public/og.png',
  await sharp({
    create: {
      width: CARD.width,
      height: CARD.height,
      channels: 4,
      background: { r: 1, g: 12, b: 40, alpha: 1 },
    },
  })
    .composite([
      {
        input: logo,
        left: Math.round((CARD.width - (logoMeta.width ?? 0)) / 2),
        top: 56,
      },
      { input: tagline, left: 0, top: 476 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer()
);

console.log('Wrote public/og.png');
