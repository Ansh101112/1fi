/**
 * Renders one SVG per variant into public/products/<sku>.svg.
 *
 * The seed writes the resulting path into product_variants.image_url, so the
 * app still reads every image location out of the database — this script only
 * produces the asset that path points at. Generating the artwork keeps each
 * finish exactly on its swatch hex and keeps a third-party image host out of
 * the critical path.
 *
 * Run: npm run db:images
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { VARIANT_RENDERS } from '../db/catalog.mjs';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'products');

/** Mixes a hex colour towards white (amount > 0) or black (amount < 0). */
function shade(hex, amount) {
  const n = Number.parseInt(hex.slice(1), 16);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const mix = (channel) => Math.round(channel + (target - channel) * t);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

const LENS_IDS = ['a1', 'a2', 'a3', 's1', 's2', 's3', 'g1', 'g2', 'o1', 'o2', 'o3'];

/** One camera lens: metal ring, dark well, coated glass, single glint. */
function lens(cx, cy, r, id) {
  return [
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#ring-' + id + ')" />',
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r * 0.78 + '" fill="#0b0d10" />',
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r * 0.52 + '" fill="url(#glass-' + id + ')" />',
    '<circle cx="' + (cx - r * 0.2) + '" cy="' + (cy - r * 0.24) + '" r="' + r * 0.16 +
      '" fill="#ffffff" opacity="0.5" />',
  ].join('');
}

/**
 * Camera islands drawn to the silhouette each brand is actually recognised by.
 * (x, y) is the top-left of the phone back and w its width.
 */
function cameraModule(style, x, y, w, body) {
  const plate = shade(body, -0.14);
  const edge = shade(body, 0.16);

  if (style === 'apple') {
    // Full-width plateau with a triangular lens cluster.
    const px = x + 22;
    const py = y + 26;
    const pw = w - 44;
    return [
      '<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="132" rx="34" fill="' +
        plate + '" stroke="' + edge + '" stroke-width="1.5" />',
      lens(px + 46, py + 44, 25, 'a1'),
      lens(px + 46, py + 94, 25, 'a2'),
      lens(px + 104, py + 69, 25, 'a3'),
      '<circle cx="' + (px + pw - 36) + '" cy="' + (py + 44) + '" r="11" fill="#f6f2e4" opacity="0.9" />',
      '<circle cx="' + (px + pw - 36) + '" cy="' + (py + 86) + '" r="7" fill="#1b1e24" />',
    ].join('');
  }

  if (style === 'samsung') {
    // No island — the lenses sit straight on the glass, down the left edge.
    const cx = x + 62;
    return [
      lens(cx, y + 58, 26, 's1'),
      lens(cx, y + 120, 26, 's2'),
      lens(cx, y + 182, 22, 's3'),
      '<rect x="' + (cx + 38) + '" y="' + (y + 46) + '" width="20" height="46" rx="10" fill="' + plate + '" />',
      '<circle cx="' + (cx + 48) + '" cy="' + (y + 58) + '" r="6" fill="#f6f2e4" opacity="0.85" />',
      '<circle cx="' + (cx + 48) + '" cy="' + (y + 79) + '" r="5" fill="#1b1e24" />',
    ].join('');
  }

  if (style === 'google') {
    // The Pixel visor: an edge-to-edge bar across the full width of the back.
    const vy = y + 62;
    return [
      '<rect x="' + x + '" y="' + vy + '" width="' + w + '" height="76" rx="38" fill="' +
        plate + '" stroke="' + edge + '" stroke-width="1.5" />',
      lens(x + w * 0.36, vy + 38, 26, 'g1'),
      lens(x + w * 0.6, vy + 38, 26, 'g2'),
      '<rect x="' + (x + w * 0.74) + '" y="' + (vy + 26) + '" width="34" height="24" rx="12" fill="#12151a" />',
      '<circle cx="' + (x + w * 0.2) + '" cy="' + (vy + 38) + '" r="9" fill="#f6f2e4" opacity="0.85" />',
    ].join('');
  }

  // oneplus — a single large circular module.
  const cx = x + w * 0.34;
  const cy = y + 122;
  return [
    '<circle cx="' + cx + '" cy="' + cy + '" r="86" fill="' + plate + '" stroke="' + edge + '" stroke-width="1.5" />',
    lens(cx - 34, cy - 26, 27, 'o1'),
    lens(cx + 30, cy - 26, 27, 'o2'),
    lens(cx - 4, cy + 38, 24, 'o3'),
    '<circle cx="' + (cx + 52) + '" cy="' + (cy + 40) + '" r="9" fill="#f6f2e4" opacity="0.85" />',
  ].join('');
}

function lensGradients() {
  return LENS_IDS.map(
    (id) =>
      '<linearGradient id="ring-' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#6f757e" /><stop offset="100%" stop-color="#191c21" />' +
      '</linearGradient>' +
      '<radialGradient id="glass-' + id + '" cx="0.36" cy="0.32" r="0.8">' +
      '<stop offset="0%" stop-color="#3d5a7a" /><stop offset="70%" stop-color="#10151c" />' +
      '<stop offset="100%" stop-color="#05070a" /></radialGradient>',
  ).join('');
}

/**
 * Two-unit composition: the screen-forward phone sits behind and to the right,
 * the finish-forward phone in front and to the left — the same arrangement the
 * product photography on the brief uses.
 */
function render({ colorHex, accentHex, cameraStyle }) {
  const light = shade(colorHex, 0.3);
  const dark = shade(colorHex, -0.32);
  const rim = shade(colorHex, 0.42);
  const accent = accentHex || colorHex;

  const sx = 316;
  const sy = 96;
  const sw = 262;
  const sh = 556;

  const bx = 74;
  const by = 138;
  const bw = 286;
  const bh = 596;

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 800" width="640" height="800" role="img">',
    '<defs>',
    '<linearGradient id="body" x1="0" y1="0" x2="1" y2="1">',
    '<stop offset="0%" stop-color="' + light + '" />',
    '<stop offset="42%" stop-color="' + colorHex + '" />',
    '<stop offset="100%" stop-color="' + dark + '" />',
    '</linearGradient>',
    '<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">',
    '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.34" />',
    '<stop offset="45%" stop-color="#ffffff" stop-opacity="0.04" />',
    '<stop offset="100%" stop-color="#ffffff" stop-opacity="0.14" />',
    '</linearGradient>',
    '<linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">',
    '<stop offset="0%" stop-color="#4a4f57" /><stop offset="50%" stop-color="#23262b" />',
    '<stop offset="100%" stop-color="#3c4148" />',
    '</linearGradient>',
    '<linearGradient id="wall" x1="0.1" y1="0" x2="0.9" y2="1">',
    '<stop offset="0%" stop-color="#05070a" />',
    '<stop offset="55%" stop-color="' + shade(accent, -0.55) + '" />',
    '<stop offset="100%" stop-color="#05070a" />',
    '</linearGradient>',
    '<radialGradient id="bloom" cx="0.62" cy="0.44" r="0.62">',
    '<stop offset="0%" stop-color="' + shade(accent, 0.34) + '" stop-opacity="0.95" />',
    '<stop offset="55%" stop-color="' + accent + '" stop-opacity="0.42" />',
    '<stop offset="100%" stop-color="' + accent + '" stop-opacity="0" />',
    '</radialGradient>',
    lensGradients(),
    '<clipPath id="screen-clip"><rect x="' + (sx + 9) + '" y="' + (sy + 9) + '" width="' +
      (sw - 18) + '" height="' + (sh - 18) + '" rx="34" /></clipPath>',
    '<clipPath id="back-clip"><rect x="' + bx + '" y="' + by + '" width="' + bw +
      '" height="' + bh + '" rx="46" /></clipPath>',
    '<filter id="soft" x="-30%" y="-30%" width="160%" height="160%">',
    '<feGaussianBlur stdDeviation="22" /></filter>',
    '</defs>',

    // Contact shadow.
    '<ellipse cx="322" cy="744" rx="228" ry="30" fill="#0b1220" opacity="0.2" filter="url(#soft)" />',

    // Screen-forward unit.
    '<rect x="' + sx + '" y="' + sy + '" width="' + sw + '" height="' + sh + '" rx="42" fill="url(#frame)" />',
    '<rect x="' + (sx + 9) + '" y="' + (sy + 9) + '" width="' + (sw - 18) + '" height="' +
      (sh - 18) + '" rx="34" fill="url(#wall)" />',
    '<g clip-path="url(#screen-clip)">',
    '<ellipse cx="' + (sx + sw * 0.62) + '" cy="' + (sy + sh * 0.42) + '" rx="' + sw * 0.72 +
      '" ry="' + sh * 0.4 + '" fill="url(#bloom)" />',
    '<path d="M' + (sx - 20) + ' ' + (sy + sh * 0.74) + ' C ' + (sx + sw * 0.34) + ' ' + (sy + sh * 0.5) +
      ', ' + (sx + sw * 0.62) + ' ' + (sy + sh * 0.9) + ', ' + (sx + sw + 20) + ' ' + (sy + sh * 0.6) +
      '" stroke="' + shade(accent, 0.42) + '" stroke-opacity="0.5" stroke-width="26" fill="none" stroke-linecap="round" />',
    '<path d="M' + (sx - 20) + ' ' + (sy + sh * 0.86) + ' C ' + (sx + sw * 0.4) + ' ' + (sy + sh * 0.62) +
      ', ' + (sx + sw * 0.7) + ' ' + (sy + sh * 1.02) + ', ' + (sx + sw + 20) + ' ' + (sy + sh * 0.72) +
      '" stroke="' + shade(accent, 0.1) + '" stroke-opacity="0.42" stroke-width="16" fill="none" stroke-linecap="round" />',
    '</g>',
    '<rect x="' + (sx + sw / 2 - 34) + '" y="' + (sy + 22) + '" width="68" height="21" rx="11" fill="#05070a" />',
    '<rect x="' + sx + '" y="' + sy + '" width="' + sw + '" height="' + sh +
      '" rx="42" fill="none" stroke="#5a6069" stroke-width="1.2" opacity="0.7" />',

    // Finish-forward unit.
    '<rect x="' + (bx - 3) + '" y="' + (by - 3) + '" width="' + (bw + 6) + '" height="' +
      (bh + 6) + '" rx="49" fill="url(#frame)" />',
    '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="46" fill="url(#body)" />',
    '<g clip-path="url(#back-clip)">',
    '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" fill="url(#sheen)" />',
    '<path d="M' + (bx - 40) + ' ' + (by + bh * 0.16) + ' L ' + (bx + bw * 0.78) + ' ' + (by - 40) +
      ' L ' + (bx + bw + 40) + ' ' + (by + bh * 0.1) + ' L ' + (bx + bw * 0.3) + ' ' + (by + bh + 40) +
      ' Z" fill="#ffffff" opacity="0.06" />',
    cameraModule(cameraStyle, bx, by, bw, colorHex),
    '</g>',
    '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh +
      '" rx="46" fill="none" stroke="' + rim + '" stroke-width="1.6" opacity="0.85" />',
    '</svg>',
    '',
  ].join('\n');
}

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

for (const variant of VARIANT_RENDERS) {
  await writeFile(join(OUT_DIR, variant.sku + '.svg'), render(variant), 'utf8');
}

console.log('Wrote ' + VARIANT_RENDERS.length + ' product renders to public/products/');
