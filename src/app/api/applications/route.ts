import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { createApplication, listApplications } from '@/lib/applications';
import type { ApiError, EmiApplication } from '@/lib/types';

/**
 * /api/applications — the EMI applications belonging to the signed-in user.
 *
 * GET  lists them, newest first.
 * POST records the plan chosen on a product page.
 *
 * Both require a session: a credit application has to belong to somebody.
 */

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function unauthorized(): NextResponse<ApiError> {
  return NextResponse.json<ApiError>(
    { error: 'unauthorized', message: 'Sign in to continue with an EMI plan.' },
    { status: 401 },
  );
}

export async function GET(): Promise<NextResponse<{ applications: EmiApplication[] } | ApiError>> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    return NextResponse.json({ applications: await listApplications(user.id) });
  } catch (error) {
    console.error('[api] GET /api/applications failed', error);
    return NextResponse.json<ApiError>(
      { error: 'internal_error', message: 'Could not load your applications.' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
): Promise<NextResponse<{ application: EmiApplication } | ApiError>> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: 'invalid_body', message: 'Expected a JSON body.' },
      { status: 400 },
    );
  }

  const { variantId, emiPlanId } = (body ?? {}) as Record<string, unknown>;

  if (typeof variantId !== 'string' || !UUID.test(variantId)) {
    return NextResponse.json<ApiError>(
      { error: 'invalid_body', message: 'variantId must be a variant uuid.' },
      { status: 400 },
    );
  }
  if (typeof emiPlanId !== 'string' || !UUID.test(emiPlanId)) {
    return NextResponse.json<ApiError>(
      { error: 'invalid_body', message: 'emiPlanId must be an EMI plan uuid.' },
      { status: 400 },
    );
  }

  try {
    const result = await createApplication(user, { variantId, emiPlanId });

    if (!result.ok) {
      const messages = {
        variant_not_found: 'That configuration is no longer available.',
        plan_not_found: 'That EMI plan is not offered on this product.',
        out_of_stock: 'That configuration is out of stock.',
      } as const;

      return NextResponse.json<ApiError>(
        { error: result.reason, message: messages[result.reason] },
        { status: result.reason === 'out_of_stock' ? 409 : 404 },
      );
    }

    return NextResponse.json({ application: result.application }, { status: 201 });
  } catch (error) {
    console.error('[api] POST /api/applications failed', error);
    return NextResponse.json<ApiError>(
      { error: 'internal_error', message: 'Could not submit your application.' },
      { status: 500 },
    );
  }
}
