import { Logo } from '@/components/logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="max-w-md text-xs leading-relaxed text-ink-muted">
            EMI plans are funded by a loan against your pledged mutual fund units. Your units stay
            invested and keep earning. Representative figures shown for demonstration.
          </p>
        </div>
        <p className="text-xs text-ink-faint">
          Built with Next.js, PostgreSQL on Neon, and Neon Auth.
        </p>
      </div>
    </footer>
  );
}
