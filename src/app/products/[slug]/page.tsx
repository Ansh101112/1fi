import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProductConfigurator } from '@/components/product-configurator';
import { getCurrentUser } from '@/lib/auth';
import { formatRupees } from '@/lib/emi';
import { getProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: 'Product not found' };

  return {
    title: `${product.name} on EMI`,
    description: `${product.tagline} From ${formatRupees(product.priceFrom)}, or EMI from ${
      product.lowestEmi ? formatRupees(product.lowestEmi.monthlyAmount) : formatRupees(product.priceFrom)
    }/month backed by your mutual funds.`,
  };
}

export default async function ProductPage({ params, searchParams }: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  const { variant: requestedSku } = await searchParams;

  const [product, user] = await Promise.all([getProduct(slug), getCurrentUser()]);

  if (!product) notFound();

  // ?variant=<sku> makes an exact configuration linkable. An unknown sku falls
  // back to the product default rather than 404-ing the whole page.
  const requested = Array.isArray(requestedSku) ? requestedSku[0] : requestedSku;
  const initialVariant =
    product.variants.find((candidate) => candidate.sku === requested) ??
    product.variants.find((candidate) => candidate.isDefault) ??
    product.variants[0];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="transition hover:text-ink">
              Store
            </Link>
          </li>
          <li aria-hidden className="text-ink-faint">
            /
          </li>
          <li>
            <span className="text-ink-faint">{product.brand}</span>
          </li>
          <li aria-hidden className="text-ink-faint">
            /
          </li>
          <li aria-current="page" className="text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <ProductConfigurator
        product={product}
        initialVariantId={initialVariant.id}
        isSignedIn={user !== null}
      />

      <section className="mt-8 rounded-panel border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-base font-semibold text-ink">About the {product.name}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
          {product.description}
        </p>
      </section>
    </main>
  );
}
