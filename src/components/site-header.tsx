import Link from 'next/link';

import { Logo } from '@/components/logo';
import { UserMenu } from '@/components/user-menu';
import type { SessionUser } from '@/lib/auth';

export function SiteHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="1Fi home" className="rounded-lg">
          <Logo />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:text-ink"
          >
            Store
          </Link>

          {user ? (
            <>
              <Link
                href="/applications"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:text-ink sm:block"
              >
                Applications
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:text-ink"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface transition hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
