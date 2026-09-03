import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-ink-faint">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        We couldn’t find that page
      </h1>
      <p className="mt-2 max-w-md text-sm text-ink-muted">
        The product may have been renamed or is no longer on the store.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-card bg-ink px-5 py-2.5 text-sm font-semibold text-surface transition hover:opacity-90"
      >
        Back to the store
      </Link>
    </main>
  );
}
