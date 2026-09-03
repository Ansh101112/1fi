/**
 * Seed catalogue: the single source of truth for `npm run db:seed` and
 * `npm run db:images`.
 *
 * Nothing here is read at runtime. The app only ever sees this data after it
 * has been written to Postgres and read back through the API; keeping the two
 * scripts on one definition is what stops a finish's swatch, its price and its
 * artwork from drifting apart.
 *
 * Each colour carries an `image` (the filename under public/products/) and a
 * `source` (where scripts/fetch-product-images.mjs downloads it from). Every
 * source is the manufacturer's own store CDN, so the artwork is the real device
 * in the real finish.
 *
 * Prices are whole rupees, matching the `integer` columns in db/schema.sql.
 */

/** `Cosmic Orange` -> `cosmic-orange` */
export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const APPLE = 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is';
const SAMSUNG = 'https://images.samsung.com/in/smartphones';
const GOOGLE = 'https://lh3.googleusercontent.com';

export const PRODUCTS = [
  {
    slug: 'iphone-17-pro',
    brand: 'Apple',
    name: 'iPhone 17 Pro',
    tagline: 'Aerospace-grade titanium. A19 Pro. All-day battery.',
    description:
      'The iPhone 17 Pro pairs a forged titanium unibody with the A19 Pro chip and a 48MP Fusion camera system. Pledge your mutual funds and take it home today while your portfolio stays invested.',
    highlights: [
      '6.3" Super Retina XDR, ProMotion 120Hz',
      'A19 Pro chip with 6-core GPU',
      '48MP Fusion main + 48MP ultra wide',
      'Up to 33 hours video playback',
    ],
    isNew: true,
    rating: 4.8,
    reviewCount: 2431,
    colors: [
      {
        name: 'Cosmic Orange',
        hex: '#C86B34',
        image: 'iphone-17-pro-cosmic-orange.png',
        source: `${APPLE}/iphone-17-pro-finish-select-cosmicorange-202509?wid=940&hei=1112&fmt=png-alpha&.v=NUNzdzNKR0FJbmhKWm5YamRHb05tVmdrMFhaMHcxOUdwN3E1MFVmcEJVQTNyWks3T2VGaWZmcXRuQXczU1ZaZ0V3S0grNWRDVTNuaVhuc2dPbTQ4Q0V1RGVGY05iMGVCVXhlTE1BQUZjMDAxZ3c4akdEMUU0TzY2L3ZNM3pjZ1o`,
      },
      {
        name: 'Silver',
        hex: '#DCDEE1',
        image: 'iphone-17-pro-silver.png',
        source: `${APPLE}/iphone-17-pro-finish-select-silver-202509?wid=940&hei=1112&fmt=png-alpha&.v=NUNzdzNKR0FJbmhKWm5YamRHb05tVGJOdEdsYjE3KzExOGFjT0NXdW5CRVVkSEJvenlBdXoyaDlFZmx3NUNqSlQ5NVJ4OStiQklybHZqYkJwOUI0UWgyOXkwakE4NktvanUvRWt1bE04RG1tZGZRaE5TcFF1Um5PY0c2UnZPZVU`,
      },
      {
        name: 'Deep Blue',
        hex: '#2E4A6B',
        image: 'iphone-17-pro-deep-blue.png',
        source: `${APPLE}/iphone-17-pro-finish-select-deepblue-202509?wid=940&hei=1112&fmt=png-alpha&.v=NUNzdzNKR0FJbmhKWm5YamRHb05tZUV6Rm9QZCtVTmthVDZRTDBVMjU4VUtjUUZlOFlHK1IxMzVQZmxQM3JKakJ2MUJtQ2VhYWlBc1UxbHhMSzFTQjhlcC9qYU9xUXZmS1NmbGxtTVBCNVBzR0ZiVDU2djVyRHE3eS9mZXV0Q1Q`,
      },
    ],
    storages: [
      { size: '256GB', mrp: 134900, price: 127400 },
      { size: '512GB', mrp: 154900, price: 146900 },
      { size: '1TB', mrp: 174900, price: 165900 },
    ],
    emiPlans: [
      { tenureMonths: 3, interestRate: 0, cashback: 7500 },
      { tenureMonths: 6, interestRate: 0, cashback: 7500 },
      { tenureMonths: 12, interestRate: 0, cashback: 7500, isPopular: true },
      { tenureMonths: 24, interestRate: 0, cashback: 7500 },
      { tenureMonths: 36, interestRate: 10.5, cashback: 7500 },
      { tenureMonths: 48, interestRate: 10.5, cashback: 7500 },
      { tenureMonths: 60, interestRate: 10.5, cashback: 7500 },
    ],
  },
  {
    slug: 'samsung-galaxy-s25-ultra',
    brand: 'Samsung',
    name: 'Galaxy S25 Ultra',
    tagline: 'Titanium build, 200MP camera, S Pen built in.',
    description:
      'A 6.9" Dynamic AMOLED 2X display, Snapdragon 8 Elite silicon and a 200MP wide camera, with the S Pen tucked into the frame. Available on mutual-fund backed EMI from three months to three years.',
    highlights: [
      '6.9" Dynamic AMOLED 2X, 1-120Hz',
      'Snapdragon 8 Elite for Galaxy',
      '200MP wide + 50MP periscope',
      'Built-in S Pen, 5000mAh battery',
    ],
    isNew: false,
    rating: 4.7,
    reviewCount: 3187,
    colors: [
      {
        name: 'Titanium Black',
        hex: '#3A3B3D',
        image: 'galaxy-s25-ultra-titanium-black.jpg',
        source: `${SAMSUNG}/galaxy-s25-ultra/buy/product_color_black_PC.png`,
      },
      {
        name: 'Titanium Gray',
        hex: '#8A8D91',
        image: 'galaxy-s25-ultra-titanium-gray.jpg',
        source: `${SAMSUNG}/galaxy-s25-ultra/buy/product_color_gray_PC.png`,
      },
      {
        name: 'Titanium Whitesilver',
        hex: '#DEDCD6',
        image: 'galaxy-s25-ultra-titanium-whitesilver.jpg',
        source: `${SAMSUNG}/galaxy-s25-ultra/buy/product_color_whiteSilver_PC.png`,
      },
    ],
    storages: [
      { size: '256GB', mrp: 129999, price: 119999 },
      { size: '512GB', mrp: 141999, price: 131999 },
    ],
    emiPlans: [
      { tenureMonths: 3, interestRate: 0, cashback: 6000 },
      { tenureMonths: 6, interestRate: 0, cashback: 6000 },
      { tenureMonths: 9, interestRate: 0, cashback: 6000 },
      { tenureMonths: 12, interestRate: 0, cashback: 6000, isPopular: true },
      { tenureMonths: 18, interestRate: 11.25, cashback: 6000 },
      { tenureMonths: 24, interestRate: 11.25, cashback: 6000 },
      { tenureMonths: 36, interestRate: 11.25, cashback: 6000 },
    ],
  },
  {
    slug: 'google-pixel-10-pro',
    brand: 'Google',
    name: 'Pixel 10 Pro',
    tagline: 'Tensor G5 and the best computational camera on Android.',
    description:
      'Google Tensor G5 drives on-device Gemini, Magic Editor and Best Take across a 50MP triple camera. Seven years of OS and security updates, financed against your mutual fund portfolio.',
    highlights: [
      '6.3" Super Actua LTPO, 3000 nits',
      'Google Tensor G5 with Titan M2',
      '50MP wide + 48MP 5x telephoto',
      '7 years of OS and security updates',
    ],
    isNew: true,
    rating: 4.6,
    reviewCount: 1204,
    colors: [
      {
        name: 'Porcelain',
        hex: '#EDE7DD',
        image: 'pixel-10-pro-porcelain.png',
        source: `${GOOGLE}/bcUVbUQMLQN1ZNMtHeYu9jb_taQtU_wEX1UA7UHHL_watRVemdeXEXJRryHWT8f_iHQDTJrFxZ2sFrfsG9PMsSZA3QJNx3sPCifc=w1000`,
      },
      {
        name: 'Jade',
        hex: '#BCD3AE',
        image: 'pixel-10-pro-jade.png',
        source: `${GOOGLE}/2Vg1iI0kOA5QkpG20fisNjNrXJfPj4hh45wUypykOy-rlymd28eq17BtTvqIAOPP3OXmBpJ4ywa8LLVqWkTb--jCbMXbEbYYEB0=w1000`,
      },
    ],
    storages: [
      { size: '128GB', mrp: 106999, price: 99999 },
      { size: '256GB', mrp: 116999, price: 108999 },
    ],
    emiPlans: [
      { tenureMonths: 3, interestRate: 0, cashback: 4500 },
      { tenureMonths: 6, interestRate: 0, cashback: 4500, isPopular: true },
      { tenureMonths: 12, interestRate: 0, cashback: 4500 },
      { tenureMonths: 18, interestRate: 9.99, cashback: 4500 },
      { tenureMonths: 24, interestRate: 9.99, cashback: 4500 },
    ],
  },
  {
    slug: 'samsung-galaxy-s25',
    brand: 'Samsung',
    name: 'Galaxy S25',
    tagline: 'Flagship silicon in a phone you can hold one-handed.',
    description:
      'The compact Galaxy S25 runs the same Snapdragon 8 Elite as its Ultra sibling behind a 6.2" display. The shortest EMI ladder on the store starts at three months, interest free.',
    highlights: [
      '6.2" Dynamic AMOLED 2X, 120Hz',
      'Snapdragon 8 Elite for Galaxy',
      '50MP wide + 10MP 3x telephoto',
      'Galaxy AI with Now Brief',
    ],
    isNew: false,
    rating: 4.5,
    reviewCount: 1876,
    colors: [
      {
        name: 'Navy',
        hex: '#2C3B4E',
        image: 'galaxy-s25-navy.jpg',
        source: `${SAMSUNG}/galaxy-s25/buy/product_color_navy_PC.png`,
      },
      {
        name: 'Mint',
        hex: '#C4DBC6',
        image: 'galaxy-s25-mint.jpg',
        source: `${SAMSUNG}/galaxy-s25/buy/product_color_mint_PC.png`,
      },
      {
        name: 'Silver Shadow',
        hex: '#A9ACAF',
        image: 'galaxy-s25-silver-shadow.jpg',
        source: `${SAMSUNG}/galaxy-s25/buy/product_color_silverShadow_PC.png`,
      },
    ],
    storages: [
      { size: '128GB', mrp: 80999, price: 74999 },
      { size: '256GB', mrp: 85999, price: 79999 },
    ],
    emiPlans: [
      { tenureMonths: 3, interestRate: 0, cashback: 3000 },
      { tenureMonths: 6, interestRate: 0, cashback: 3000 },
      { tenureMonths: 9, interestRate: 0, cashback: 3000 },
      { tenureMonths: 12, interestRate: 0, cashback: 3000, isPopular: true },
      { tenureMonths: 24, interestRate: 12, cashback: 3000 },
      { tenureMonths: 36, interestRate: 12, cashback: 3000 },
    ],
  },
];

/**
 * Expands each product into its colour x storage matrix.
 *
 * The first colour of the first storage tier becomes the product's default
 * variant, which is what the listing page prices against and what the detail
 * page preselects. Artwork is per finish, so every storage tier of a colour
 * points at the same file.
 */
export function buildVariants(product) {
  const variants = [];
  let position = 0;

  for (const color of product.colors) {
    for (const storage of product.storages) {
      variants.push({
        sku: `${product.slug}-${slugify(color.name)}-${slugify(storage.size)}`.toUpperCase(),
        colorName: color.name,
        colorHex: color.hex,
        imageUrl: `/products/${color.image}`,
        storage: storage.size,
        mrp: storage.mrp,
        price: storage.price,
        isDefault: position === 0,
        position: position++,
      });
    }
  }

  return variants;
}
