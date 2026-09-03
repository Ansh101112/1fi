import 'server-only';

import { createNeonAuth } from '@neondatabase/auth/next/server';

// Neon Auth runs as a hosted service on the same Neon project. It owns the
// neon_auth schema, which is why db/schema.sql never touches it.

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
 * The signed-in user, or null. Never throws: the header is on every page, so a
 * blip reaching the auth service should show a signed-out header, not a crash.
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
