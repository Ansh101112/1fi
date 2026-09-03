import { isAuthApiError, isAuthError } from '@neondatabase/auth/next';

export const GENERIC_AUTH_ERROR = 'Could not reach the authentication service. Please try again.';

/**
 * Neon Auth throws a typed error instead of returning { error } the way plain
 * Better Auth does. Without unwrapping it, a real answer like "User already
 * exists" or "Invalid origin" shows up as a network failure and tells the user
 * nothing.
 */
export function describeAuthError(error: unknown): string {
  if (isAuthApiError(error) || isAuthError(error)) {
    const message = error.message || GENERIC_AUTH_ERROR;

    // INVALID_ORIGIN means this site's URL is not on the Neon Auth project's
    // trusted origins list. It reads as nonsense to whoever is clicking, so
    // point it at the person who can actually fix it.
    if (/invalid origin/i.test(message)) {
      return 'This site is not an allowed origin for sign-in. Add it to Trusted origins in the Neon Auth settings.';
    }

    return message;
  }

  return GENERIC_AUTH_ERROR;
}
