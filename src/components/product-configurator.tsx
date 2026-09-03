'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { formatRupees, formatTenure } from '@/lib/emi';
import type { EmiPlan, ProductDetail, ProductVariant } from '@/lib/types';

/**
 * Product page interaction: pick a finish and storage, pick an EMI plan,
 * proceed.
 *
 * Every variant arrives from the server with its EMI ladder already priced, so
 * switching finish or storage re-reads props rather than re-fetching. Nothing
 * here recomputes money: it only chooses which precomputed quote to show.
 */

type Props = {
  product: ProductDetail;
  initialVariantId: string;
  isSignedIn: boolean;
};

/** The plan a product should land on: the flagged one, else the first. */
function defaultPlanId(variant: ProductVariant): string | null {
  return (variant.emiPlans.find((plan) => plan.isPopular) ?? variant.emiPlans[0])?.id ?? null;
}

export function ProductConfigurator({ product, initialVariantId, isSignedIn }: Props) {
  const router = useRouter();

  const initialVariant =
    product.variants.find((variant) => variant.id === initialVariantId) ?? product.variants[0];

  const [colorName, setColorName] = useState(initialVariant.colorName);
  const [storage, setStorage] = useState(initialVariant.storage);
  const [planId, setPlanId] = useState<string | null>(defaultPlanId(initialVariant));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Distinct options, in the order the API returned variants.
  const colors = product.colors;
  const storages = product.storages;

  const variant = useMemo(() => {
    const exact = product.variants.find(
      (candidate) => candidate.colorName === colorName && candidate.storage === storage,
    );
    // A colour x storage pair can be missing from the catalogue; fall back to
    // the same colour in another size rather than rendering nothing.
    return (
      exact ??
      product.variants.find((candidate) => candidate.colorName === colorName) ??
      product.variants[0]
    );
  }, [product.variants, colorName, storage]);

  const selectedPlan =
    variant.emiPlans.find((plan) => plan.id === planId) ?? variant.emiPlans[0] ?? null;

  /**
   * Keeps ?variant= in step with the selection so the exact configuration can
   * be linked or reloaded. `history.replaceState` rather than router.replace:
   * this must not re-run the server component or add history entries as the
   * user tries finishes.
   */
  function syncUrl(next: ProductVariant) {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('variant', next.sku);
    window.history.replaceState(null, '', url);
  }

  function selectColor(nextColor: string) {
    setColorName(nextColor);
    setError(null);
    const next =
      product.variants.find((c) => c.colorName === nextColor && c.storage === storage) ??
      product.variants.find((c) => c.colorName === nextColor);
    if (next) syncUrl(next);
  }

  function selectStorage(nextStorage: string) {
    setStorage(nextStorage);
    setError(null);
    const next =
      product.variants.find((c) => c.colorName === colorName && c.storage === nextStorage) ??
      product.variants.find((c) => c.storage === nextStorage);
    if (next) syncUrl(next);
  }

  const continueHref = `/sign-in?next=${encodeURIComponent(
    `/products/${product.slug}?variant=${variant.sku}`,
  )}`;

  async function proceed() {
    if (!selectedPlan) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: variant.id, emiPlanId: selectedPlan.id }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push(continueHref);
          return;
        }
        setError(payload?.message ?? 'Something went wrong. Please try again.');
        return;
      }

      router.push(`/applications/${payload.application.reference}`);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8">
      {/* ---------------------------------------------------------------- */}
      {/* Product panel                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="flex flex-col rounded-panel border border-line bg-surface p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            {product.isNew ? (
              <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-flag">New</p>
            ) : null}
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {variant.storage} · {variant.colorName}
            </p>
          </div>

          {product.rating ? (
            <div className="shrink-0 text-right">
              <p className="tnum text-sm font-semibold text-ink">★ {product.rating.toFixed(1)}</p>
              <p className="tnum text-xs text-ink-faint">
                {product.reviewCount.toLocaleString('en-IN')} reviews
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-1 items-center justify-center rounded-card bg-sunken py-6">
          <Image
            key={variant.sku}
            src={variant.imageUrl}
            alt={`${product.brand} ${product.name} in ${variant.colorName}`}
            width={1000}
            height={1000}
            unoptimized
            priority
            className="h-72 w-full object-contain sm:h-80"
          />
        </div>

        {/* Finish ------------------------------------------------------- */}
        <fieldset className="mt-6">
          <legend className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Finish
          </legend>
          <div role="radiogroup" aria-label="Finish" className="mt-2 flex flex-wrap gap-2">
            {colors.map((color) => {
              const active = color.name === colorName;
              return (
                <button
                  key={color.name}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => selectColor(color.name)}
                  className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm transition ${
                    active
                      ? 'border-ink bg-ink text-surface'
                      : 'border-line bg-surface text-ink hover:border-line-strong'
                  }`}
                >
                  <span
                    style={{ backgroundColor: color.hex }}
                    className="h-5 w-5 rounded-full ring-1 ring-inset ring-ink/20"
                  />
                  {color.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Storage ------------------------------------------------------ */}
        <fieldset className="mt-5">
          <legend className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Storage
          </legend>
          <div role="radiogroup" aria-label="Storage" className="mt-2 flex flex-wrap gap-2">
            {storages.map((size) => {
              const active = size === storage;
              const priced = product.variants.find(
                (candidate) => candidate.colorName === colorName && candidate.storage === size,
              );
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => selectStorage(size)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? 'border-ink bg-ink text-surface'
                      : 'border-line bg-surface text-ink hover:border-line-strong'
                  }`}
                >
                  <span className="font-medium">{size}</span>
                  {priced ? (
                    <span
                      className={`tnum ml-2 text-xs ${active ? 'text-surface/70' : 'text-ink-faint'}`}
                    >
                      {formatRupees(priced.price)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>

        <ul className="mt-6 grid gap-2 border-t border-line pt-5">
          {product.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-2 text-sm text-ink-muted">
              <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-gain" fill="none" aria-hidden>
                <path
                  d="m3.5 8.5 3 3 6-7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {highlight}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Pricing and plans                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="flex flex-col rounded-panel border border-line bg-surface p-6 sm:p-8">
        <div>
          <p className="tnum text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {formatRupees(variant.price)}
          </p>
          <p className="tnum mt-1 flex items-center gap-2 text-sm">
            <span className="text-ink-faint line-through">{formatRupees(variant.mrp)}</span>
            {variant.discountPercent > 0 ? (
              <span className="rounded-full bg-gain-tint px-2 py-0.5 text-xs font-semibold text-gain">
                Save {formatRupees(variant.mrp - variant.price)}
              </span>
            ) : null}
          </p>
        </div>

        <h2 className="mt-6 text-base font-semibold text-ink">EMI plans backed by mutual funds</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Pledge units instead of selling them. Pick the tenure that fits.
        </p>

        <div
          role="radiogroup"
          aria-label="EMI plans"
          className="mt-4 flex flex-col gap-2.5"
        >
          {variant.emiPlans.map((plan) => (
            <PlanOption
              key={plan.id}
              plan={plan}
              selected={plan.id === selectedPlan?.id}
              onSelect={() => {
                setPlanId(plan.id);
                setError(null);
              }}
            />
          ))}
        </div>

        {selectedPlan ? <PlanSummary plan={selectedPlan} /> : null}

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-card border border-flag/25 bg-flag/5 px-4 py-3 text-sm text-flag"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-5">
          {isSignedIn ? (
            <button
              type="button"
              onClick={proceed}
              disabled={submitting || !selectedPlan || !variant.inStock}
              className="w-full rounded-card bg-ink px-5 py-3.5 text-sm font-semibold text-surface transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? 'Submitting…'
                : selectedPlan
                  ? `Proceed with ${formatRupees(selectedPlan.monthlyAmount)} × ${selectedPlan.tenureMonths}`
                  : 'Select a plan'}
            </button>
          ) : (
            <Link
              href={continueHref}
              className="block w-full rounded-card bg-ink px-5 py-3.5 text-center text-sm font-semibold text-surface transition hover:opacity-90"
            >
              Sign in to proceed
            </Link>
          )}

          <p className="mt-3 text-center text-xs leading-relaxed text-ink-faint">
            No credit card needed. Your mutual fund units stay invested throughout the tenure.
          </p>
        </div>
      </section>
    </div>
  );
}

/** One selectable row in the EMI ladder, matching the reference layout. */
function PlanOption({
  plan,
  selected,
  onSelect,
}: {
  plan: EmiPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`rounded-card border px-4 py-3 text-left transition ${
        selected
          ? 'border-brand bg-brand-tint ring-1 ring-brand'
          : 'border-line bg-surface hover:border-line-strong'
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="tnum text-[0.95rem] font-semibold text-ink">
          {formatRupees(plan.monthlyAmount)} × {formatTenure(plan.tenureMonths)}
        </span>
        <span
          className={`tnum shrink-0 text-sm font-medium ${
            plan.isNoCost ? 'text-gain' : 'text-ink-muted'
          }`}
        >
          {plan.isNoCost ? '0% interest' : `${plan.interestRate}% interest`}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        {plan.cashback > 0 ? (
          <span className="tnum text-xs font-medium text-gain">
            Additional cashback of {formatRupees(plan.cashback)}
          </span>
        ) : null}
        {plan.isPopular ? (
          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
            Most chosen
          </span>
        ) : null}
      </div>
    </button>
  );
}

/** The arithmetic behind the selected plan, so the numbers can be checked. */
function PlanSummary({ plan }: { plan: EmiPlan }) {
  const rows: Array<{ label: string; value: string; tone?: 'gain' }> = [
    { label: 'Amount financed', value: formatRupees(plan.principal) },
    {
      label: 'Interest over ' + formatTenure(plan.tenureMonths),
      value: plan.totalInterest > 0 ? formatRupees(plan.totalInterest) : 'Nil',
    },
    { label: 'Total payable', value: formatRupees(plan.totalPayable) },
  ];

  if (plan.processingFee > 0) {
    rows.push({ label: 'Processing fee', value: formatRupees(plan.processingFee) });
  }
  if (plan.cashback > 0) {
    rows.push({ label: 'Cashback', value: `− ${formatRupees(plan.cashback)}`, tone: 'gain' });
  }

  return (
    <dl className="mt-5 rounded-card bg-sunken px-4 py-3.5">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4 py-1 text-sm">
          <dt className="text-ink-muted">{row.label}</dt>
          <dd className={`tnum font-medium ${row.tone === 'gain' ? 'text-gain' : 'text-ink'}`}>
            {row.value}
          </dd>
        </div>
      ))}

      <div className="mt-1.5 flex justify-between gap-4 border-t border-line-strong pt-2.5 text-sm">
        <dt className="font-medium text-ink">Effective cost</dt>
        <dd className="tnum font-semibold text-ink">{formatRupees(plan.effectiveCost)}</dd>
      </div>

      <p className="mt-2 text-xs text-ink-faint">Funded by {plan.fundedBy.toLowerCase()}.</p>
    </dl>
  );
}
