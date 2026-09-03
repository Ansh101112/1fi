'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { signOut } from '@/lib/auth-client';
import type { SessionUser } from '@/lib/auth';

/** "Ansh Tiwari" -> "AT", falling back to the email. */
function initials(user: SessionUser): string {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? '?').concat(parts[1]?.[0] ?? '').toUpperCase();
}

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape, otherwise it traps you on touch.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      // Full navigation, same reason as sign-in: the root layout survives
      // client navigation and would keep showing the old user. router.push is
      // what the lint rule wants and is exactly what does not work here.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/');
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${user.name || user.email}`}
        className="flex items-center gap-1 rounded-full border border-line bg-surface p-1 text-sm font-medium text-ink transition hover:border-line-strong"
      >
        {/* Avatar only. The full name goes in the menu, where it fits. */}
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-tint text-xs font-semibold text-brand-strong">
          {initials(user)}
        </span>
        <svg viewBox="0 0 20 20" className="mr-0.5 h-4 w-4 text-ink-faint" fill="none" aria-hidden>
          <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-lg shadow-ink/5"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-medium text-ink">{user.name || 'Your account'}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
          <Link
            href="/applications"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-ink transition hover:bg-sunken"
          >
            My EMI applications
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            className="block w-full px-4 py-2.5 text-left text-sm text-ink transition hover:bg-sunken disabled:opacity-60"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
