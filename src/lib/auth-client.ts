'use client';

import { createAuthClient } from '@neondatabase/auth/next';

// No config needed: calls go to /api/auth/* on this origin, which proxies
// upstream, so nothing about the auth instance ends up in the client bundle.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
