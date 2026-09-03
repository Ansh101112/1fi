import { ProductCard } from '@/components/product-card';
import { listProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    title: 'Pick a phone and a plan',
    body: 'Choose your finish and storage, then the tenure that suits you, from 3 months to 5 years.',
  },
  {
    title: 'Pledge, don’t redeem',
    body: 'We place a lien on a slice of your mutual fund units. They stay invested and keep compounding.',
  },
  {
    title: 'Pay in instalments',
    body: 'Shorter tenures are interest free. Longer ones are priced against your portfolio, not a credit score.',
  },
];

export default async function HomePage() {
  const products = await listProducts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Buy it now. Keep your portfolio invested.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          Pay for your next phone in instalments backed by the mutual funds you already own, from
          0% interest, with no need to sell a single unit.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="catalogue">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="catalogue" className="text-lg font-semibold text-ink">
            Smartphones on EMI
          </h2>
          <p className="text-sm text-ink-muted">
            {products.length} {products.length === 1 ? 'model' : 'models'}
          </p>
        </div>

        {products.length === 0 ? (
          <p className="mt-6 rounded-panel border border-dashed border-line-strong bg-surface p-10 text-center text-sm text-ink-muted">
            No products yet. Run <code className="font-mono text-ink">npm run db:reset</code> to load
            the catalogue.
          </p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Collapsed by default. Native <details> so it works without client JS. */}
      <section className="mt-14 rounded-panel border border-line bg-surface px-6 py-2 sm:px-8">
        {STEPS.map((step, index) => (
          <details key={step.title} className="group border-b border-line last:border-b-0">
            <summary className="flex cursor-pointer list-none items-center gap-3 py-4 [&::-webkit-details-marker]:hidden">
              <span className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sunken text-xs font-semibold text-ink">
                {index + 1}
              </span>
              <h2 className="flex-1 text-sm font-semibold text-ink">{step.title}</h2>
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4 shrink-0 text-ink-faint transition group-open:rotate-180"
                fill="none"
                aria-hidden
              >
                <path
                  d="m6 8 4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>
            <p className="pb-4 pl-10 text-sm leading-relaxed text-ink-muted">{step.body}</p>
          </details>
        ))}
      </section>
    </main>
  );
}
