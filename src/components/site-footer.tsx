import { Logo } from '@/components/logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl px-4 py-8 sm:px-6">
        <Logo />
      </div>
    </footer>
  );
}
