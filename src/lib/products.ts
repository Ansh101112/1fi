import 'server-only';

import { query, queryOne } from '@/lib/db';
import { calculateEmi, discountPercent } from '@/lib/emi';
import type {
  ColorOption,
  EmiPlan,
  LowestEmi,
  ProductDetail,
  ProductSummary,
  ProductVariant,
} from '@/lib/types';


type ProductRow = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  highlights: string[];
  is_new: boolean;
  rating: number | null;
  review_count: number;
};

type VariantRow = {
  id: string;
  product_id: string;
  sku: string;
  color_name: string;
  color_hex: string;
  storage: string;
  mrp: number;
  price: number;
  image_url: string;
  in_stock: boolean;
  is_default: boolean;
};

type PlanRow = {
  id: string;
  product_id: string;
  tenure_months: number;
  interest_rate: number;
  cashback: number;
  processing_fee: number;
  funded_by: string;
  is_popular: boolean;
};

const PRODUCT_COLUMNS = `
  p.id, p.slug, p.brand, p.name, p.tagline, p.description, p.category,
  p.highlights, p.is_new, p.rating, p.review_count`;

const VARIANT_COLUMNS = `
  v.id, v.product_id, v.sku, v.color_name, v.color_hex, v.storage,
  v.mrp, v.price, v.image_url, v.in_stock, v.is_default`;

const PLAN_COLUMNS = `
  e.id, e.product_id, e.tenure_months, e.interest_rate, e.cashback,
  e.processing_fee, e.funded_by, e.is_popular`;

function groupByProduct<T extends { product_id: string }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const bucket = grouped.get(row.product_id);
    if (bucket) bucket.push(row);
    else grouped.set(row.product_id, [row]);
  }
  return grouped;
}

/** Price the whole plan ladder against one variant. */
function quotePlans(plans: PlanRow[], price: number): EmiPlan[] {
  return plans.map((plan) => {
    const quote = calculateEmi(price, {
      tenureMonths: plan.tenure_months,
      interestRate: plan.interest_rate,
      cashback: plan.cashback,
      processingFee: plan.processing_fee,
    });

    return {
      id: plan.id,
      tenureMonths: plan.tenure_months,
      interestRate: plan.interest_rate,
      cashback: plan.cashback,
      processingFee: plan.processing_fee,
      fundedBy: plan.funded_by,
      isPopular: plan.is_popular,
      principal: quote.principal,
      monthlyAmount: quote.monthlyAmount,
      totalPayable: quote.totalPayable,
      totalInterest: quote.totalInterest,
      effectiveCost: quote.effectiveCost,
      isNoCost: quote.isNoCost,
    };
  });
}

function pickDefaultVariant(variants: VariantRow[]): VariantRow | undefined {
  return variants.find((variant) => variant.is_default) ?? variants[0];
}

function distinctColors(variants: VariantRow[]): ColorOption[] {
  const seen = new Map<string, ColorOption>();
  for (const variant of variants) {
    if (!seen.has(variant.color_name)) {
      seen.set(variant.color_name, { name: variant.color_name, hex: variant.color_hex });
    }
  }
  return [...seen.values()];
}

/** Distinct storage tiers in variant order. */
function distinctStorages(variants: VariantRow[]): string[] {
  return [...new Set(variants.map((variant) => variant.storage))];
}

/** The smallest monthly instalment available at the given price. */
function lowestEmi(plans: PlanRow[], price: number): LowestEmi | null {
  const quoted = quotePlans(plans, price);
  if (quoted.length === 0) return null;

  return quoted.reduce<LowestEmi>(
    (lowest, plan) =>
      plan.monthlyAmount < lowest.monthlyAmount
        ? {
            monthlyAmount: plan.monthlyAmount,
            tenureMonths: plan.tenureMonths,
            interestRate: plan.interestRate,
          }
        : lowest,
    {
      monthlyAmount: quoted[0].monthlyAmount,
      tenureMonths: quoted[0].tenureMonths,
      interestRate: quoted[0].interestRate,
    },
  );
}

function toSummary(product: ProductRow, variants: VariantRow[], plans: PlanRow[]): ProductSummary {
  const cheapest = variants.reduce(
    (min, variant) => (variant.price < min.price ? variant : min),
    variants[0],
  );
  const hero = pickDefaultVariant(variants) ?? cheapest;

  return {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    name: product.name,
    tagline: product.tagline,
    category: product.category,
    isNew: product.is_new,
    rating: product.rating,
    reviewCount: product.review_count,
    colors: distinctColors(variants),
    storages: distinctStorages(variants),
    variantCount: variants.length,
    priceFrom: cheapest.price,
    mrpFrom: cheapest.mrp,
    discountPercent: discountPercent(cheapest.mrp, cheapest.price),
    imageUrl: hero.image_url,
    lowestEmi: lowestEmi(plans, cheapest.price),
  };
}

function toVariant(variant: VariantRow, plans: PlanRow[]): ProductVariant {
  return {
    id: variant.id,
    sku: variant.sku,
    colorName: variant.color_name,
    colorHex: variant.color_hex,
    storage: variant.storage,
    mrp: variant.mrp,
    price: variant.price,
    discountPercent: discountPercent(variant.mrp, variant.price),
    imageUrl: variant.image_url,
    inStock: variant.in_stock,
    isDefault: variant.is_default,
    emiPlans: quotePlans(plans, variant.price),
  };
}

/** Every product as a card. Products with no variants are skipped. */
export async function listProducts(): Promise<ProductSummary[]> {
  const products = await query<ProductRow>(
    `select ${PRODUCT_COLUMNS} from products p order by p.position, p.name`,
  );
  if (products.length === 0) return [];

  const productIds = products.map((product) => product.id);

  const [variants, plans] = await Promise.all([
    query<VariantRow>(
      `select ${VARIANT_COLUMNS} from product_variants v
        where v.product_id = any($1::uuid[])
        order by v.position, v.sku`,
      [productIds],
    ),
    query<PlanRow>(
      `select ${PLAN_COLUMNS} from emi_plans e
        where e.product_id = any($1::uuid[])
        order by e.position, e.tenure_months`,
      [productIds],
    ),
  ]);

  const variantsByProduct = groupByProduct(variants);
  const plansByProduct = groupByProduct(plans);

  return products
    .map((product) => {
      const productVariants = variantsByProduct.get(product.id) ?? [];
      if (productVariants.length === 0) return null;
      return toSummary(product, productVariants, plansByProduct.get(product.id) ?? []);
    })
    .filter((summary): summary is ProductSummary => summary !== null);
}

/** One product with all its variants and their priced plans. Slug or uuid. */
export async function getProduct(idOrSlug: string): Promise<ProductDetail | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const product = await queryOne<ProductRow>(
    `select ${PRODUCT_COLUMNS} from products p
      where ${isUuid ? 'p.id = $1::uuid' : 'p.slug = $1'}
      limit 1`,
    [idOrSlug],
  );
  if (!product) return null;

  const [variants, plans] = await Promise.all([
    query<VariantRow>(
      `select ${VARIANT_COLUMNS} from product_variants v
        where v.product_id = $1 order by v.position, v.sku`,
      [product.id],
    ),
    query<PlanRow>(
      `select ${PLAN_COLUMNS} from emi_plans e
        where e.product_id = $1 order by e.position, e.tenure_months`,
      [product.id],
    ),
  ]);

  if (variants.length === 0) return null;

  return {
    ...toSummary(product, variants, plans),
    description: product.description,
    highlights: product.highlights,
    variants: variants.map((variant) => toVariant(variant, plans)),
  };
}

/** Slugs for generateStaticParams and the sitemap. */
export async function listProductSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>('select slug from products order by position, name');
  return rows.map((row) => row.slug);
}
