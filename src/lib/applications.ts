import 'server-only';

import { randomBytes } from 'node:crypto';

import { query, queryOne } from '@/lib/db';
import { calculateEmi } from '@/lib/emi';
import type { EmiApplication } from '@/lib/types';
import type { SessionUser } from '@/lib/auth';

/**
 * EMI applications: what the "Proceed" button on a product page records.
 *
 * The instalment figures are recomputed here from the variant's current price
 * and the plan's current terms, never taken from the request body: the browser
 * gets to choose *which* variant and plan, not what they cost. The result is
 * then snapshotted onto the row so a later price change cannot rewrite history.
 */

type ApplicationRow = {
  id: string;
  reference: string;
  status: EmiApplication['status'];
  created_at: Date;
  principal: number;
  monthly_amount: number;
  total_payable: number;
  total_interest: number;
  cashback: number;
  processing_fee: number;
  tenure_months: number;
  interest_rate: number;
  product_slug: string;
  product_brand: string;
  product_name: string;
  sku: string;
  color_name: string;
  color_hex: string;
  storage: string;
  image_url: string;
};

const APPLICATION_COLUMNS = `
  a.id, a.reference, a.status, a.created_at, a.principal, a.monthly_amount,
  a.total_payable, a.total_interest, a.cashback, a.processing_fee,
  a.tenure_months, a.interest_rate,
  p.slug as product_slug, p.brand as product_brand, p.name as product_name,
  v.sku, v.color_name, v.color_hex, v.storage, v.image_url`;

const APPLICATION_JOINS = `
  from emi_applications a
  join product_variants v on v.id = a.variant_id
  join products p on p.id = v.product_id`;

function toApplication(row: ApplicationRow): EmiApplication {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    principal: row.principal,
    monthlyAmount: row.monthly_amount,
    totalPayable: row.total_payable,
    totalInterest: row.total_interest,
    cashback: row.cashback,
    processingFee: row.processing_fee,
    tenureMonths: row.tenure_months,
    interestRate: row.interest_rate,
    product: {
      slug: row.product_slug,
      brand: row.product_brand,
      name: row.product_name,
    },
    variant: {
      sku: row.sku,
      colorName: row.color_name,
      colorHex: row.color_hex,
      storage: row.storage,
      imageUrl: row.image_url,
    },
  };
}

/** `1FI-` plus 8 crockford-ish uppercase characters, matching the CHECK constraint. */
function generateReference(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const bytes = randomBytes(8);
  let suffix = '';
  for (const byte of bytes) {
    suffix += alphabet[byte % alphabet.length];
  }
  return `1FI-${suffix}`;
}

export type CreateApplicationInput = {
  variantId: string;
  emiPlanId: string;
};

export type CreateApplicationResult =
  | { ok: true; application: EmiApplication }
  | { ok: false; reason: 'variant_not_found' | 'plan_not_found' | 'out_of_stock' };

export async function createApplication(
  user: SessionUser,
  input: CreateApplicationInput,
): Promise<CreateApplicationResult> {
  const variant = await queryOne<{
    id: string;
    product_id: string;
    price: number;
    in_stock: boolean;
  }>(
    'select id, product_id, price, in_stock from product_variants where id = $1::uuid',
    [input.variantId],
  );
  if (!variant) return { ok: false, reason: 'variant_not_found' };
  if (!variant.in_stock) return { ok: false, reason: 'out_of_stock' };

  // Scoped to the variant's product so a plan cannot be borrowed from a
  // cheaper product to get its rate.
  const plan = await queryOne<{
    id: string;
    tenure_months: number;
    interest_rate: number;
    cashback: number;
    processing_fee: number;
  }>(
    `select id, tenure_months, interest_rate, cashback, processing_fee
       from emi_plans where id = $1::uuid and product_id = $2::uuid`,
    [input.emiPlanId, variant.product_id],
  );
  if (!plan) return { ok: false, reason: 'plan_not_found' };

  const quote = calculateEmi(variant.price, {
    tenureMonths: plan.tenure_months,
    interestRate: plan.interest_rate,
    cashback: plan.cashback,
    processingFee: plan.processing_fee,
  });

  const rows = await query<ApplicationRow>(
    `with inserted as (
       insert into emi_applications (
         reference, user_id, user_email, user_name, variant_id, emi_plan_id,
         principal, monthly_amount, total_payable, total_interest,
         cashback, processing_fee, tenure_months, interest_rate
       )
       values ($1, $2::uuid, $3, $4, $5::uuid, $6::uuid, $7, $8, $9, $10, $11, $12, $13, $14)
       returning *
     )
     select ${APPLICATION_COLUMNS}
       from inserted a
       join product_variants v on v.id = a.variant_id
       join products p on p.id = v.product_id`,
    [
      generateReference(),
      user.id,
      user.email,
      user.name,
      variant.id,
      plan.id,
      quote.principal,
      quote.monthlyAmount,
      quote.totalPayable,
      quote.totalInterest,
      plan.cashback,
      plan.processing_fee,
      plan.tenure_months,
      plan.interest_rate,
    ],
  );

  return { ok: true, application: toApplication(rows[0]) };
}

/** Newest first. */
export async function listApplications(userId: string): Promise<EmiApplication[]> {
  const rows = await query<ApplicationRow>(
    `select ${APPLICATION_COLUMNS} ${APPLICATION_JOINS}
      where a.user_id = $1::uuid
      order by a.created_at desc`,
    [userId],
  );
  return rows.map(toApplication);
}

/** Scoped to the owner, so a guessed reference leaks nothing. */
export async function getApplication(
  userId: string,
  reference: string,
): Promise<EmiApplication | null> {
  const row = await queryOne<ApplicationRow>(
    `select ${APPLICATION_COLUMNS} ${APPLICATION_JOINS}
      where a.user_id = $1::uuid and a.reference = $2
      limit 1`,
    [userId, reference],
  );
  return row ? toApplication(row) : null;
}
