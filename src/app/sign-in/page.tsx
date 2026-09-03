import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  const { next } = await searchParams;
  const target = Array.isArray(next) ? next[0] : next;

  // Already signed in, so send them straight where they were headed.
  if (await getCurrentUser()) {
    redirect(target && target.startsWith('/') && !target.startsWith('//') ? target : '/');
  }

  return (
    <main className="mx-auto flex max-w-6xl justify-center px-4 py-12 sm:px-6 sm:py-16">
      <AuthForm mode="sign-in" next={target} />
    </main>
  );
}
