import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { StatusBadge } from '@/components/status-badge';
import { getApplication } from '@/lib/applications';
import { getCurrentUser } from '@/lib/auth';
import { formatRupees, formatTenure } from '@/lib/emi';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: PageProps<'/applications/[reference]'>): Promise<Metadata> {
  const { reference } = await params;
  return { title: `Application ${reference}` };
}

const DATE = new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short' });

export default async function ApplicationPage({ params }: PageProps<'/applications/[reference]'>) {
  const { reference } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/applications/${reference}`)}`);

  // Scoped to the signed-in user, so an application that exists but belongs to
  // somebody else is indistinguishable from one that does not exist.
  const application = await getApplication(user.id, reference);
  if (!application) notFound();

  const rows = [
    { label: 'Amount financed', value: formatRupees(application.principal) },
    { label: 'Monthly instalment', value: formatRupees(application.monthlyAmount) },
    { label: 'Tenure', value: formatTenure(application.tenureMonths) },
    {
      label: 'Interest rate',
      value: application.interestRate === 0 ? '0% (no cost)' : `${application.interestRate}% p.a.`,
    },
    {
      label: 'Total interest',
      value: application.totalInterest > 0 ? formatRupees(application.totalInterest) : 'Nil',
    },
    { label: 'Total payable', value: formatRupees(application.totalPayable) },
  ];

  if (application.processingFee > 0) {
    rows.push({ label: 'Processing fee', value: formatRupees(application.processingFee) });
  }
  if (application.cashback > 0) {
    rows.push({ label: 'Cashback credited', value: `− ${formatRupees(application.cashback)}` });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-panel border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gain-tint text-gain">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
                  <path
                    d="m3.5 8.5 3 3 6-7"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h1 className="text-xl font-semibold tracking-tight text-ink">
                Your EMI plan is locked in
              </h1>
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              Reference{' '}
              <span className="tnum font-mono font-medium text-ink">{application.reference}</span> ·{' '}
              {DATE.format(new Date(application.createdAt))}
            </p>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-card bg-sunken p-4">
          <div className="grid h-24 w-24 shrink-0 place-items-center">
            <Image
              src={application.variant.imageUrl}
              alt={application.product.name}
              width={400}
              height={400}
              unoptimized
              className="h-20 w-20 object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              {application.product.brand}
            </p>
            <h2 className="text-base font-semibold text-ink">{application.product.name}</h2>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-ink-muted">
              <span
                style={{ backgroundColor: application.variant.colorHex }}
                className="h-3 w-3 rounded-full ring-1 ring-inset ring-ink/15"
              />
              {application.variant.colorName} · {application.variant.storage}
            </p>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-line rounded-card border border-line">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-ink-muted">{row.label}</dt>
              <dd className="tnum font-medium text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 rounded-card bg-brand-tint px-4 py-3 text-sm leading-relaxed text-brand-strong">
          Next step: we will place a lien on mutual fund units worth{' '}
          <span className="tnum font-semibold">{formatRupees(application.principal)}</span> and email
          you the pledge mandate. Your units stay invested for the whole tenure.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/applications"
            className="rounded-card bg-ink px-5 py-2.5 text-sm font-semibold text-surface transition hover:opacity-90"
          >
            All applications
          </Link>
          <Link
            href={`/products/${application.product.slug}`}
            className="rounded-card border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-line-strong"
          >
            Back to product
          </Link>
        </div>
      </div>
    </main>
  );
}
