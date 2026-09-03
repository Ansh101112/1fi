import { NextResponse } from 'next/server';

import { listProducts } from '@/lib/products';
import type { ApiError, ProductSummary } from '@/lib/types';

// GET /api/products
//
// Every product as a card: colours, storage tiers, cheapest price and the
// lowest instalment on offer. Never prerendered, since prices can change.
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<{ products: ProductSummary[] } | ApiError>> {
  try {
    const products = await listProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('[api] GET /api/products failed', error);
    return NextResponse.json<ApiError>(
      { error: 'internal_error', message: 'Could not load products.' },
      { status: 500 },
    );
  }
}
