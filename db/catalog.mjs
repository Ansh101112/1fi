/**
 * Seed catalogue — the single source of truth for `npm run db:seed` and
 * `npm run db:images`.
 *
 * Nothing here is read at runtime. The app only ever sees this data after it
 * has been written to Postgres and read back through the API; keeping the two
 * scripts on one definition is what stops a variant's swatch and its rendered
 * artwork from drifting apart.
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
    cameraStyle: 'apple',
    colors: [
      { name: 'Cosmic Orange', hex: '#C86B34', accent: '#FF8A3D' },
      { name: 'Silver', hex: '#DCDEE1', accent: '#93AEC9' },
      { name: 'Deep Blue', hex: '#2E4A6B', accent: '#4C8FD1' },
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
    cameraStyle: 'samsung',
    colors: [
      { name: 'Titanium Black', hex: '#3A3B3D', accent: '#6E7A8A' },
      { name: 'Titanium Gray', hex: '#8A8D91', accent: '#AAB5C1' },
      { name: 'Titanium Whitesilver', hex: '#DEDCD6', accent: '#B9C6D6' },
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
    cameraStyle: 'google',
    colors: [
      { name: 'Obsidian', hex: '#22242A', accent: '#6E86FF' },
      { name: 'Porcelain', hex: '#EDE7DD', accent: '#F0B67F' },
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
    slug: 'oneplus-13',
    brand: 'OnePlus',
    name: 'OnePlus 13',
    tagline: 'Hasselblad optics and 100W charging, under a lakh.',
    description:
      'Snapdragon 8 Elite, a 6000mAh silicon-carbon battery and a Hasselblad-tuned triple camera. The shortest EMI ladder on the store starts at three months, interest free.',
    highlights: [
      '6.82" 2K LTPO AMOLED, 4500 nits',
      'Snapdragon 8 Elite, up to 16GB RAM',
      'Hasselblad 50MP triple camera',
      '6000mAh battery, 100W SuperVOOC',
    ],
    isNew: false,
    rating: 4.5,
    reviewCount: 876,
    cameraStyle: 'oneplus',
    colors: [
      { name: 'Midnight Ocean', hex: '#1B3E63', accent: '#2F7FD1' },
      { name: 'Arctic Dawn', hex: '#D9D3C7', accent: '#8FB9A8' },
      { name: 'Black Eclipse', hex: '#1E1F22', accent: '#7A7F8A' },
    ],
    storages: [
      { size: '256GB', mrp: 72999, price: 69999 },
      { size: '512GB', mrp: 79999, price: 76999 },
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
 * page preselects.
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
        accentHex: color.accent,
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

/** Flat list consumed by scripts/generate-product-images.mjs. */
export const VARIANT_RENDERS = PRODUCTS.flatMap((product) =>
  buildVariants(product).map((variant) => ({
    sku: variant.sku,
    colorHex: variant.colorHex,
    accentHex: variant.accentHex,
    cameraStyle: product.cameraStyle,
  })),
);
