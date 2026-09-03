import { ProductCard } from '@/components/product-card';
import { listProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    title: 'Pick a phone and a plan',
    body: 'Choose your finish and storage, then the tenure that suits you — from 3 months to 5 years.',
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
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-tint px-3 py-1 text-xs font-medium text-brand-strong">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Loan against mutual funds
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Buy it now. Keep your portfolio invested.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          Pay for your next phone in instalments backed by the mutual funds you already own — from
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

      <section className="mt-14 rounded-panel border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-ink">How the EMI works</h2>
        <ol className="mt-5 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sunken text-xs font-semibold text-ink">
                {index + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
