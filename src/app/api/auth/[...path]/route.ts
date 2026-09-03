import { auth } from '@/lib/auth';

// Catch-all for Neon Auth. The browser only ever talks to this origin; the
// handler forwards upstream and sets a signed httpOnly cookie on our domain.
//
// The segment has to be named [...path]: the handler reads params.path.
export const { GET, POST, PUT, PATCH, DELETE } = auth.handler();
