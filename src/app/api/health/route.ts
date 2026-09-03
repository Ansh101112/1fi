import { NextResponse } from 'next/server';

import { queryOne } from '@/lib/db';

/**
 * GET /api/health: a liveness probe that actually touches the database.
 *
 * Returns 503 when Postgres is unreachable so a deploy check can tell a broken
 * connection string apart from a healthy app.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const row = await queryOne<{ products: number; variants: number; plans: number }>(
      `select
         (select count(*) from products)         ::int as products,
         (select count(*) from product_variants) ::int as variants,
         (select count(*) from emi_plans)        ::int as plans`,
    );

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      counts: row,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[api] health check failed', error);
    return NextResponse.json(
      { status: 'error', database: 'unreachable', timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
