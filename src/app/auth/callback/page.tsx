import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Same-origin paths only, so ?next= cannot bounce anyone off-site. */
function safeNext(next: string | string[] | undefined): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

// Where Google sends people back to. src/proxy.ts has already swapped the
// verifier for a session cookie by the time this renders, so all that is left
// is to forward them to wherever they started.
export default async function AuthCallbackPage({ searchParams }: PageProps<'/auth/callback'>) {
  const { next } = await searchParams;
  const destination = safeNext(next);

  // If the exchange did not produce a session, send them back to sign in
  // rather than to a page that will look mysteriously signed out.
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(destination)}`);
  }

  redirect(destination);
}
