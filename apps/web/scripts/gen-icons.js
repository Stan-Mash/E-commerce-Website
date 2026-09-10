/**
 * Generates the PWA icon set, apple-touch-icon and the Open Graph social
 * preview image from the brand's typographic identity.
 *
 * The brand has no logo mark - it is the wordmark "Elite Style Co." set in a
 * Cormorant-style serif. These assets mirror that: ink background (--es-ink),
 * champagne accent (--es-champagne), serif letterforms. If a real logo is
 * commissioned later, swap the SVGs below for it and re-run.
 *
 * Run: node scripts/gen-icons.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const INK = "#0d0d0d";
const CHAMPAGNE = "#c9b3a0"; // display-only accent: on ink it reads 8.2:1
const SERIF = "Cormorant Garamond, Georgia, 'Times New Roman', Times, serif";

/**
 * Square app icon: "ES" monogram over ink.
 *
 * Below 48px the champagne rule and the letterforms collide into an unreadable
 * smudge, so small sizes drop the rule and set the monogram larger. Favicons
 * are read at a glance in a tab strip; legibility beats decoration there.
 */
function iconSvg(size) {
  const small = size < 48;
  const fontSize = Math.round(size * (small ? 0.62 : 0.42));
  const border = small
    ? ""
    : (() => {
        const inset = Math.round(size * 0.085);
        const rule = Math.max(1, Math.round(size * 0.012));
        return `<rect x="${inset}" y="${inset}" width="${size - inset * 2}" height="${size - inset * 2}"
        fill="none" stroke="${CHAMPAGNE}" stroke-width="${rule}" opacity="0.85"/>`;
      })();
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${INK}"/>
  ${border}
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
        font-family="${SERIF}" font-size="${fontSize}" font-weight="600"
        letter-spacing="${size * 0.01}" fill="${CHAMPAGNE}">ES</text>
</svg>`);
}

module.exports = { iconSvg };

/** 1200x630 Open Graph card: wordmark, rule, descriptor. */
function ogSvg(w, h) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <rect x="48" y="48" width="${w - 96}" height="${h - 96}" fill="none" stroke="${CHAMPAGNE}" stroke-width="2" opacity="0.5"/>
  <text x="50%" y="${h * 0.44}" text-anchor="middle" font-family="${SERIF}"
        font-size="96" font-weight="600" fill="#ffffff">Elite Style Co.</text>
  <line x1="${w / 2 - 90}" y1="${h * 0.545}" x2="${w / 2 + 90}" y2="${h * 0.545}" stroke="${CHAMPAGNE}" stroke-width="2"/>
  <text x="50%" y="${h * 0.66}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif"
        font-size="30" letter-spacing="9" fill="${CHAMPAGNE}">NAIROBI</text>
  <text x="50%" y="${h * 0.775}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif"
        font-size="25" letter-spacing="2" fill="#b9b9b9">Dressed for every moment</text>
</svg>`);
}

const outDir = path.resolve(__dirname, "../public/icons");
fs.mkdirSync(outDir, { recursive: true });

const ICONS = [72, 96, 128, 192, 384, 512];

async function main() {
  for (const size of ICONS) {
    const file = path.join(outDir, `icon-${size}x${size}.png`);
    await sharp(iconSvg(size)).png({ compressionLevel: 9 }).toFile(file);
    console.log(`icon-${size}x${size}.png`);
  }
  await sharp(iconSvg(180)).png({ compressionLevel: 9 }).toFile(path.join(outDir, "apple-touch-icon.png"));
  console.log("apple-touch-icon.png");

  await sharp(ogSvg(1200, 630)).png({ compressionLevel: 9 }).toFile(path.join(outDir, "og-image.png"));
  console.log("og-image.png");
}

// Only generate when run directly, so `require()`ing iconSvg (e.g. to build
// favicon.ico) doesn't rewrite the whole icon set as a side effect.
if (require.main === module) main();
