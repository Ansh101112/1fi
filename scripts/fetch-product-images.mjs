/**
 * Downloads the official product render for every finish in the catalogue into
 * public/products/.
 *
 * Every URL below is the image the manufacturer's own store serves on its buy
 * page, so the artwork is the real device in the real finish rather than an
 * illustration. The seed writes the resulting path into
 * product_variants.image_url, which is why the app still reads every image
 * location out of the database.
 *
 * These are third-party marketing assets used here to dress a demo catalogue.
 * A production storefront would serve assets it has the rights to.
 *
 * The URLs carry cache-busting tokens that the vendors rotate when they refresh
 * a page, so a 404 here means the token moved on: reopen the buy page, read the
 * new image URL off it, and update the entry. Existing files are kept, so a
 * partial failure never leaves the catalogue without artwork.
 *
 * Run: npm run db:images
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRODUCTS } from '../db/catalog.mjs';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'products');

/** Vendor CDNs reject requests without a browser UA, and Apple's also wants a referer. */
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  // Deliberately no avif/webp: Samsung content-negotiates and would hand back a
  // WebP body under a .jpg filename, leaving the static handler serving the
  // wrong content type.
  Accept: 'image/png,image/jpeg;q=0.9,*/*;q=0.5',
};

/** Guards against a filename that disagrees with what the CDN actually sent. */
const EXTENSION_FOR_TYPE = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

const REFERERS = {
  'store.storeimages.cdn-apple.com': 'https://www.apple.com/',
  'images.samsung.com': 'https://www.samsung.com/',
  'lh3.googleusercontent.com': 'https://store.google.com/',
};

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function download(url, file) {
  const target = join(OUT_DIR, file);
  const referer = REFERERS[new URL(url).hostname];

  const response = await fetch(url, {
    headers: referer ? { ...HEADERS, Referer: referer } : HEADERS,
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const type = (response.headers.get('content-type') ?? '').split(';')[0].trim();
  if (!type.startsWith('image/')) {
    throw new Error(`expected an image, got ${type || 'no content-type'}`);
  }

  const expected = EXTENSION_FOR_TYPE[type];
  if (expected && !file.endsWith(expected)) {
    throw new Error(`served ${type} but catalogue names the file ${file}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  // A CDN that has lost the asset sometimes answers 200 with a stub body.
  if (bytes.length < 5_000) {
    throw new Error(`suspiciously small response (${bytes.length} bytes)`);
  }

  await writeFile(target, bytes);
  return bytes.length;
}

await mkdir(OUT_DIR, { recursive: true });

const finishes = PRODUCTS.flatMap((product) =>
  product.colors.map((color) => ({ product: product.slug, ...color })),
);

let downloaded = 0;
let kept = 0;
const failures = [];

for (const finish of finishes) {
  if (!finish.source) {
    failures.push(`${finish.image}: no source URL in db/catalog.mjs`);
    continue;
  }

  try {
    const size = await download(finish.source, finish.image);
    console.log(`  ${finish.image} (${Math.round(size / 1024)} KB)`);
    downloaded += 1;
  } catch (error) {
    if (await exists(join(OUT_DIR, finish.image))) {
      console.warn(`  ${finish.image}: ${error.message}, keeping the copy on disk`);
      kept += 1;
    } else {
      failures.push(`${finish.image}: ${error.message}`);
    }
  }
}

console.log(`\n${downloaded} downloaded, ${kept} kept, ${failures.length} missing`);

if (failures.length > 0) {
  console.error('\nMissing artwork:');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exitCode = 1;
}
