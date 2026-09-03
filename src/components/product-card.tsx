import Image from 'next/image';
import Link from 'next/link';

import { formatRupees } from '@/lib/emi';
import type { ProductSummary } from '@/lib/types';

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-panel border border-line bg-surface transition hover:border-line-strong hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="relative flex items-center justify-center bg-sunken px-6 pb-4 pt-6">
        {product.isNew ? (
          <span className="absolute left-5 top-5 text-[0.65rem] font-semibold uppercase tracking-widest text-flag">
            New
          </span>
        ) : null}

        {product.discountPercent > 0 ? (
          <span className="absolute right-5 top-5 rounded-full bg-gain-tint px-2 py-1 text-[0.65rem] font-semibold text-gain">
            {product.discountPercent}% off
          </span>
        ) : null}

        {/* Vendors ship different shapes: Apple a tall transparent PNG, Samsung
            a wide render on white. A fixed box plus object-contain lets both
            sit at the same visual size without distortion. */}
        <Image
          src={product.imageUrl}
          alt={`${product.brand} ${product.name}`}
          width={1000}
          height={1000}
          unoptimized
          className="h-48 w-full object-contain transition duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            {product.brand}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-ink">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{product.tagline}</p>
        </div>

        <div className="flex items-center gap-1.5" aria-label={`${product.colors.length} finishes`}>
          {product.colors.map((color) => (
            <span
              key={color.name}
              title={color.name}
              style={{ backgroundColor: color.hex }}
              className="h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-ink/15"
            />
          ))}
          <span className="ml-1 text-xs text-ink-faint">
            {product.storages.join(' · ')}
          </span>
        </div>

        <div className="mt-auto border-t border-line pt-3">
          <p className="tnum text-lg font-semibold text-ink">
            {formatRupees(product.priceFrom)}
            <span className="ml-2 text-xs font-normal text-ink-faint line-through">
              {formatRupees(product.mrpFrom)}
            </span>
          </p>

          {product.lowestEmi ? (
            <p className="tnum mt-1 text-sm text-ink-muted">
              EMI from{' '}
              <span className="font-semibold text-ink">
                {formatRupees(product.lowestEmi.monthlyAmount)}/mo
              </span>{' '}
              · {product.lowestEmi.tenureMonths} months
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
