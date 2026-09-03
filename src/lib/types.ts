/**
 * The shapes the API returns. These are the contract between the route
 * handlers in src/app/api and everything that renders. Keep them in camelCase
 * even though the columns behind them are snake_case.
 */

/** An EMI plan already quoted against a specific variant's price. */
export type EmiPlan = {
  id: string;
  tenureMonths: number;
  /** Annual rate as a percentage. 0 marks a no-cost plan. */
  interestRate: number;
  cashback: number;
  processingFee: number;
  fundedBy: string;
  isPopular: boolean;
  /** Derived fields, computed in src/lib/emi.ts. All whole rupees. */
  principal: number;
  monthlyAmount: number;
  totalPayable: number;
  totalInterest: number;
  effectiveCost: number;
  isNoCost: boolean;
};

export type ProductVariant = {
  id: string;
  sku: string;
  colorName: string;
  colorHex: string;
  storage: string;
  mrp: number;
  price: number;
  discountPercent: number;
  imageUrl: string;
  inStock: boolean;
  isDefault: boolean;
  /** The product's plan ladder, priced for this variant. */
  emiPlans: EmiPlan[];
};

export type ColorOption = {
  name: string;
  hex: string;
};

/** The cheapest instalment on offer, used as the "EMI from" hook. */
export type LowestEmi = {
  monthlyAmount: number;
  tenureMonths: number;
  interestRate: number;
};

/** What /api/products returns per row: enough to render a card. */
export type ProductSummary = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  tagline: string;
  category: string;
  isNew: boolean;
  rating: number | null;
  reviewCount: number;
  colors: ColorOption[];
  storages: string[];
  variantCount: number;
  priceFrom: number;
  mrpFrom: number;
  discountPercent: number;
  imageUrl: string;
  lowestEmi: LowestEmi | null;
};

/** What /api/products/:idOrSlug returns. */
export type ProductDetail = ProductSummary & {
  description: string;
  highlights: string[];
  variants: ProductVariant[];
};

/** A submitted EMI application, as stored and returned. */
export type EmiApplication = {
  id: string;
  reference: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  principal: number;
  monthlyAmount: number;
  totalPayable: number;
  totalInterest: number;
  cashback: number;
  processingFee: number;
  tenureMonths: number;
  interestRate: number;
  product: {
    slug: string;
    brand: string;
    name: string;
  };
  variant: {
    sku: string;
    colorName: string;
    colorHex: string;
    storage: string;
    imageUrl: string;
  };
};

/** Uniform error body for every route handler. */
export type ApiError = {
  error: string;
  message: string;
};
