// EMI maths and rupee formatting. Instalments are worked out here rather than
// stored, so one emi_plans row covers every variant of a product.

/** A row from `emi_plans`. */
export type EmiTerms = {
  tenureMonths: number;
  /** Annual rate as a percentage, e.g. 10.5. Zero means a no-cost plan. */
  interestRate: number;
  /** Credited upfront, in rupees. */
  cashback: number;
  /** One-time fee charged at disbursal, in rupees. */
  processingFee: number;
};

/** Worked out from the terms and the principal. Whole rupees. */
export type EmiQuote = {
  principal: number;
  monthlyAmount: number;
  totalPayable: number;
  totalInterest: number;
  /** What it really costs after cashback. */
  effectiveCost: number;
  isNoCost: boolean;
};

/**
 * EMI = P * r * (1 + r)^n / ((1 + r)^n - 1), r being the monthly rate.
 * At r = 0 that is 0/0, so no-cost plans just split the principal evenly.
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
    // monthly * tenure drifts a few rupees once rounded, so keep the real
    // principal as the total and let the last instalment absorb it.
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

/** 127400 -> ₹1,27,400 */
export function formatRupees(amount: number): string {
  return RUPEES.format(amount);
}

/** 127400 -> 1,27,400, when the ₹ is rendered separately. */
export function formatNumber(amount: number): string {
  return PLAIN.format(amount);
}

/** 0 -> "0% interest", 10.5 -> "10.5% interest". */
export function formatInterestRate(rate: number): string {
  return `${Number.isInteger(rate) ? rate : rate.toFixed(2).replace(/0$/, '')}% interest`;
}

/** 3 -> "3 months", 1 -> "1 month". */
export function formatTenure(months: number): string {
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}

/** Percent off list price, rounded down so we never overstate it. */
export function discountPercent(mrp: number, price: number): number {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.floor(((mrp - price) / mrp) * 100);
}
