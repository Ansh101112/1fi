import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getCurrentUser } from '@/lib/auth';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: '1Fi: Buy on EMI backed by your mutual funds',
    template: '%s · 1Fi',
  },
  description:
    'Pledge your mutual funds and pay for your next phone in instalments from 0% interest. Your portfolio stays invested.',
};

/**
 * The header reads the session, so every page is rendered per-request. Product
 * data is dynamic anyway: it all comes from Postgres on each request.
 */
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader user={user} />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
