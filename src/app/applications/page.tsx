import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { StatusBadge } from '@/components/status-badge';
import { listApplications } from '@/lib/applications';
import { getCurrentUser } from '@/lib/auth';
import { formatRupees, formatTenure } from '@/lib/emi';

export const metadata: Metadata = { title: 'My EMI applications' };
export const dynamic = 'force-dynamic';

const DATE = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in?next=%2Fapplications');

  const applications = await listApplications(user.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">My EMI applications</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Every plan you have taken forward, newest first.
      </p>

      {applications.length === 0 ? (
        <div className="mt-8 rounded-panel border border-dashed border-line-strong bg-surface p-12 text-center">
          <p className="text-sm text-ink-muted">You have not started an EMI plan yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-card bg-ink px-5 py-2.5 text-sm font-semibold text-surface transition hover:opacity-90"
          >
            Browse the store
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {applications.map((application) => (
            <li key={application.id}>
              <Link
                href={`/applications/${application.reference}`}
                className="flex items-center gap-4 rounded-panel border border-line bg-surface p-4 transition hover:border-line-strong hover:shadow-md hover:shadow-ink/5 sm:p-5"
              >
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-card bg-sunken">
                  <Image
                    src={application.variant.imageUrl}
                    alt={application.product.name}
                    width={640}
                    height={800}
                    unoptimized
                    className="h-16 w-auto"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-ink">
                      {application.product.name}
                    </h2>
                    <StatusBadge status={application.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {application.variant.storage} · {application.variant.colorName}
                  </p>
                  <p className="tnum mt-1.5 text-sm text-ink">
                    <span className="font-semibold">
                      {formatRupees(application.monthlyAmount)}
                    </span>{' '}
                    × {formatTenure(application.tenureMonths)}
                    <span className="text-ink-faint">
                      {' '}
                      · {application.interestRate === 0 ? '0%' : `${application.interestRate}%`}{' '}
                      interest
                    </span>
                  </p>
                </div>

                <div className="hidden shrink-0 text-right sm:block">
                  <p className="tnum font-mono text-xs text-ink-muted">{application.reference}</p>
                  <p className="tnum mt-1 text-xs text-ink-faint">
                    {DATE.format(new Date(application.createdAt))}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
