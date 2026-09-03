'use client';

import { createAuthClient } from '@neondatabase/auth/next';

/**
 * Browser-side Neon Auth client.
 *
 * It takes no configuration: every call goes to this origin's
 * /api/auth/[...all] route, which proxies upstream and holds the session
 * cookie. Nothing about the Neon Auth instance is exposed to the client bundle.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
