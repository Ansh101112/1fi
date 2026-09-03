import { auth } from '@/lib/auth';

// Finishes the Google sign-in round trip.
//
// The OAuth provider sends the browser back with ?neon_auth_session_verifier=,
// and that token has to be swapped for a session cookie before any page runs.
// Only Neon Auth's middleware does that swap, so without this the browser lands
// back on the site with the verifier still in the URL and no session. Email and
// password never hit this path, which is why it worked and Google did not.
//
// Scoped to /auth/callback on purpose. This middleware also protects whatever
// it matches, so pointing it at the whole app would put the store behind a
// login. /auth/callback is on the package's skip list, so it does the exchange
// there and protects nothing.
export const proxy = auth.middleware({ loginUrl: '/sign-in' });

export default proxy;

export const config = {
  matcher: ['/auth/callback'],
};
