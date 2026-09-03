// Downloads the official render for every finish into public/products/.
//
// Each URL is what the manufacturer's own store serves on its buy page, so
// these are real product photos, not illustrations. The seed writes the
// resulting path into product_variants.image_url.
//
// The URLs carry cache-busting tokens the vendors rotate, so a 404 means the
// token moved: reopen the buy page, copy the new URL, update db/catalog.mjs.
// Files already on disk are kept if a fetch fails.
//
// These are third-party marketing assets dressing a demo catalogue. A real
// storefront would serve assets it holds the rights to.
//
// Run: npm run db:images
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRODUCTS } from '../db/catalog.mjs';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'products');

/** These CDNs reject anything without a browser UA; Apple also wants a referer. */
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  // No avif/webp on purpose: Samsung content-negotiates and would return a
  // WebP body under a .jpg name, so the static handler serves the wrong type.
  Accept: 'image/png,image/jpeg;q=0.9,*/*;q=0.5',
};

/** Catches a filename that disagrees with what the CDN actually sent. */
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
  // A CDN that lost the asset sometimes answers 200 with a stub body.
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
