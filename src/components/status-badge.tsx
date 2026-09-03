import type { EmiApplication } from '@/lib/types';

const STYLES: Record<EmiApplication['status'], { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-brand-tint text-brand-strong' },
  under_review: { label: 'Under review', className: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Approved', className: 'bg-gain-tint text-gain' },
  rejected: { label: 'Rejected', className: 'bg-flag/10 text-flag' },
  cancelled: { label: 'Cancelled', className: 'bg-sunken text-ink-muted' },
};

export function StatusBadge({ status }: { status: EmiApplication['status'] }) {
  const style = STYLES[status] ?? STYLES.submitted;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  );
}
