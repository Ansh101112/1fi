// What the API returns. camelCase here, snake_case in the database.

/** A plan already priced against one variant. */
export type EmiPlan = {
  id: string;
  tenureMonths: number;
  /** Annual rate as a percentage. 0 marks a no-cost plan. */
  interestRate: number;
  cashback: number;
  processingFee: number;
  fundedBy: string;
  isPopular: boolean;
  /** Worked out in src/lib/emi.ts. Whole rupees. */
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
  /** The plan ladder, priced for this variant. */
  emiPlans: EmiPlan[];
};

export type ColorOption = {
  name: string;
  hex: string;
};

/** Cheapest instalment on offer. */
export type LowestEmi = {
  monthlyAmount: number;
  tenureMonths: number;
  interestRate: number;
};

/** One row from /api/products, enough to draw a card. */
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

/** A submitted application. */
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

/** Error body used by every route. */
export type ApiError = {
  error: string;
  message: string;
};
