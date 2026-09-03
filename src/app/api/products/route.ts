import { NextResponse } from 'next/server';

import { listProducts } from '@/lib/products';
import type { ApiError, ProductSummary } from '@/lib/types';

/**
 * GET /api/products
 *
 * Every product as a card: colours, storage tiers, the cheapest variant's
 * price and the lowest monthly instalment available on it.
 */

// Prices and plans are editable in the database at any time, so this must never
// be prerendered at build time.
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
