import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Create an account' };
export const dynamic = 'force-dynamic';

export default async function SignUpPage({ searchParams }: PageProps<'/sign-up'>) {
  const { next } = await searchParams;
  const target = Array.isArray(next) ? next[0] : next;

  if (await getCurrentUser()) {
    redirect(target && target.startsWith('/') && !target.startsWith('//') ? target : '/');
  }

  return (
    <main className="mx-auto flex max-w-6xl justify-center px-4 py-12 sm:px-6 sm:py-16">
      <AuthForm mode="sign-up" next={target} />
    </main>
  );
}
