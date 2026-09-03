import { NextResponse } from 'next/server';

import { getProduct } from '@/lib/products';
import type { ApiError, ProductDetail } from '@/lib/types';

// GET /api/products/:idOrSlug
//
// One product with every variant, each carrying its own priced EMI ladder.
// Pricing them all here is what makes switching finish instant in the UI.
// :idOrSlug takes either the slug (iphone-17-pro) or the uuid.

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ idOrSlug: string }> },
): Promise<NextResponse<{ product: ProductDetail } | ApiError>> {
  const { idOrSlug } = await context.params;

  try {
    const product = await getProduct(idOrSlug);

    if (!product) {
      return NextResponse.json<ApiError>(
        { error: 'not_found', message: `No product matches "${idOrSlug}".` },
        { status: 404 },
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error(`[api] GET /api/products/${idOrSlug} failed`, error);
    return NextResponse.json<ApiError>(
      { error: 'internal_error', message: 'Could not load this product.' },
      { status: 500 },
    );
  }
}
