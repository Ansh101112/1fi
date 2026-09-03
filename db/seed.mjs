/**
 * Applies db/schema.sql and loads the catalogue into Postgres.
 *
 * Destructive by design: schema.sql drops and recreates the application tables
 * so the seed is idempotent. It never touches the `neon_auth` schema, which
 * Neon manages, so signed-up users survive a reseed.
 *
 * Run: npm run db:seed
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

import { PRODUCTS, buildVariants } from './catalog.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

try {
  await client.query('begin');

  const schema = await readFile(join(HERE, 'schema.sql'), 'utf8');
  await client.query(schema);
  console.log('Applied db/schema.sql');

  let variantCount = 0;
  let planCount = 0;

  for (const [index, product] of PRODUCTS.entries()) {
    const { rows } = await client.query(
      `insert into products
         (slug, brand, name, tagline, description, highlights, is_new, rating, review_count, position)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       returning id`,
      [
        product.slug,
        product.brand,
        product.name,
        product.tagline,
        product.description,
        product.highlights,
        product.isNew,
        product.rating,
        product.reviewCount,
        index,
      ],
    );
    const productId = rows[0].id;

    for (const variant of buildVariants(product)) {
      await client.query(
        `insert into product_variants
           (product_id, sku, color_name, color_hex, storage, mrp, price, image_url, is_default, position)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          productId,
          variant.sku,
          variant.colorName,
          variant.colorHex,
          variant.storage,
          variant.mrp,
          variant.price,
          variant.imageUrl,
          variant.isDefault,
          variant.position,
        ],
      );
      variantCount += 1;
    }

    for (const [planIndex, plan] of product.emiPlans.entries()) {
      await client.query(
        `insert into emi_plans
           (product_id, tenure_months, interest_rate, cashback, processing_fee, is_popular, position)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          productId,
          plan.tenureMonths,
          plan.interestRate,
          plan.cashback,
          plan.processingFee ?? 0,
          plan.isPopular ?? false,
          planIndex,
        ],
      );
      planCount += 1;
    }

    console.log(
      `  ${product.slug}: ${buildVariants(product).length} variants, ${product.emiPlans.length} EMI plans`,
    );
  }

  await client.query('commit');
  console.log(`\nSeeded ${PRODUCTS.length} products, ${variantCount} variants, ${planCount} EMI plans.`);
} catch (error) {
  await client.query('rollback');
  console.error('Seed failed, rolled back:', error);
  process.exitCode = 1;
} finally {
  await client.end();
}
