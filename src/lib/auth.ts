import 'server-only';

import { createNeonAuth } from '@neondatabase/auth/next/server';

/**
 * Server-side Neon Auth singleton.
 *
 * Neon Auth runs as a hosted service against the same Neon project as the app
 * database. It owns the `neon_auth` schema, which is why db/schema.sql never
 * touches it. `auth.handler()` proxies the browser's /api/auth/* calls upstream
 * and mints a signed, httpOnly session cookie on this origin, so the auth
 * service's own cookie never has to be readable cross-site.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Copy .env.example to .env.local and fill it in.`);
  }
  return value;
}

export const auth = createNeonAuth({
  baseUrl: requireEnv('NEON_AUTH_BASE_URL'),
  cookies: {
    secret: requireEnv('NEON_AUTH_COOKIE_SECRET'),
  },
});

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

/**
 * The signed-in user, or null.
 *
 * Never throws: the header renders on every page, and a transient failure
 * reaching the auth service should degrade to a signed-out header rather than
 * take the whole page down.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const { data } = await auth.getSession();
    const user = data?.user;
    if (!user?.id || !user.email) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      image: user.image ?? null,
    };
  } catch (error) {
    console.error('[auth] failed to read session', error);
    return null;
  }
}
