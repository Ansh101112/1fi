/**
 * EMI arithmetic and Indian-locale money formatting.
 *
 * Instalments are derived here rather than stored, so one `emi_plans` row
 * (tenure + rate + cashback) serves every variant of a product and a price
 * change is reflected everywhere without a data migration.
 */

/** Terms as stored in `emi_plans`. */
export type EmiTerms = {
  tenureMonths: number;
  /** Annual rate as a percentage, e.g. 10.5. Zero means a no-cost plan. */
  interestRate: number;
  /** Credited upfront, in rupees. */
  cashback: number;
  /** One-time fee charged at disbursal, in rupees. */
  processingFee: number;
};

/** Everything derived from terms + principal, all in whole rupees. */
export type EmiQuote = {
  principal: number;
  monthlyAmount: number;
  totalPayable: number;
  totalInterest: number;
  /** What the phone actually costs once cashback is netted off. */
  effectiveCost: number;
  isNoCost: boolean;
};

/**
 * Standard reducing-balance instalment:
 *
 *     EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 *
 * where `r` is the monthly rate and `n` the tenure in months. At r = 0 that
 * expression is 0/0, so no-cost plans simply split the principal evenly — the
 * total payable stays exactly the principal, which is what "no cost" means.
 */
export function calculateEmi(principal: number, terms: EmiTerms): EmiQuote {
  const { tenureMonths, interestRate, cashback, processingFee } = terms;

  if (!Number.isFinite(principal) || principal <= 0) {
    throw new Error(`Principal must be a positive amount, received ${principal}`);
  }
  if (!Number.isInteger(tenureMonths) || tenureMonths <= 0) {
    throw new Error(`Tenure must be a positive whole number of months, received ${tenureMonths}`);
  }
  if (interestRate < 0) {
    throw new Error(`Interest rate cannot be negative, received ${interestRate}`);
  }

  const isNoCost = interestRate === 0;

  let monthlyAmount: number;
  let totalPayable: number;

  if (isNoCost) {
    monthlyAmount = Math.round(principal / tenureMonths);
    // Rounding the instalment would make monthly x tenure drift a few rupees
    // from the price, so the headline total stays the true principal; the
    // final instalment absorbs the difference.
    totalPayable = principal;
  } else {
    const monthlyRate = interestRate / 12 / 100;
    const growth = Math.pow(1 + monthlyRate, tenureMonths);
    monthlyAmount = Math.round((principal * monthlyRate * growth) / (growth - 1));
    totalPayable = monthlyAmount * tenureMonths;
  }

  return {
    principal,
    monthlyAmount,
    totalPayable,
    totalInterest: totalPayable - principal,
    effectiveCost: totalPayable + processingFee - cashback,
    isNoCost,
  };
}

const RUPEES = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const PLAIN = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** `127400` -> `₹1,27,400` (Indian digit grouping). */
export function formatRupees(amount: number): string {
  return RUPEES.format(amount);
}

/** `127400` -> `1,27,400`, for when the symbol is rendered separately. */
export function formatNumber(amount: number): string {
  return PLAIN.format(amount);
}

/** `0` -> `0% interest`; `10.5` -> `10.5% interest`. */
export function formatInterestRate(rate: number): string {
  return `${Number.isInteger(rate) ? rate : rate.toFixed(2).replace(/0$/, '')}% interest`;
}

/** `3` -> `3 months`, `1` -> `1 month`. */
export function formatTenure(months: number): string {
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}

/** Percentage saved off list price, rounded down so we never overstate it. */
export function discountPercent(mrp: number, price: number): number {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.floor(((mrp - price) / mrp) * 100);
}
