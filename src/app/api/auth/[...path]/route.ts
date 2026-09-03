import { auth } from '@/lib/auth';

/**
 * Catch-all for Neon Auth.
 *
 * The browser talks only to this origin; the handler forwards to the hosted
 * Neon Auth service and converts its response into a signed, httpOnly cookie
 * on our own domain.
 */
export const { GET, POST, PUT, PATCH, DELETE } = auth.handler();
