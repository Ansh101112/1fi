# 1Fi — buy on EMI, backed by mutual funds

A full-stack storefront for smartphones sold on instalments funded by a loan
against pledged mutual fund units. Every product, variant, price, image path and
EMI plan is served from PostgreSQL through the app's own APIs — nothing in the
UI is hardcoded.

```
Next.js 16 (App Router, React 19) · Tailwind CSS v4 · PostgreSQL on Neon · Neon Auth
```

## What it does

- **Dynamic product pages** at `/products/<slug>` — name, finish, storage, MRP,
  selling price and artwork, all read from the database.
- **Selectable EMI ladder** per product: monthly instalment, tenure, interest
  rate and cashback, with a live breakdown of interest, total payable and
  effective cost for the plan you pick.
- **Variant matrix** — changing finish or storage reprices the whole ladder
  instantly, and the exact configuration is linkable via `?variant=<sku>`.
- **Proceed with a plan** — signed-in users submit an application, which is
  snapshotted and given a reference at `/applications/<reference>`.
- **Authentication** via Neon Auth (email + password, or Google).

Four products, 25 variants and 25 plan definitions ship in the seed.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in the three values
npm run db:reset             # generates artwork, applies the schema, seeds it
npm run dev
```

`.env.local` needs:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `NEON_AUTH_BASE_URL` | Auth route root of your Neon Auth instance — `https://<endpoint-id>.neonauth.<region>.aws.neon.tech/<database>/auth` |
| `NEON_AUTH_COOKIE_SECRET` | 32+ characters; signs the local session cookie (`openssl rand -hex 32`) |

The `NEON_AUTH_BASE_URL` shape matters: the hosted service routes as
`/<database>/auth/<method>`, and the client appends the method itself. Point it
at `.../neondb` and every call 404s. `GET <base>/ok` should return `{"ok":true}`.

Other scripts: `npm run db:images` (regenerate artwork only), `npm run db:seed`
(schema + data only), `npm run typecheck`, `npm run lint`, `npm run build`.

## API

| Route | Purpose |
| --- | --- |
| `GET /api/products` | Every product as a card: colours, storage tiers, cheapest price, lowest instalment |
| `GET /api/products/:idOrSlug` | One product with all variants; each variant carries its EMI ladder already priced |
| `POST /api/applications` | Submit the selected variant + plan (session required) |
| `GET /api/applications` | The signed-in user's applications |
| `GET /api/health` | Liveness probe that actually queries Postgres |
| `/api/auth/[...path]` | Neon Auth proxy |

`:idOrSlug` accepts either the URL slug or the row's uuid, so one endpoint
serves both `/api/products/iphone-17-pro` and `/api/products/<uuid>`.

The detail response prices every variant's ladder server-side. That is why
switching finish or storage in the UI is instant and never refetches — and why
the browser can never influence what a plan costs.

## Schema

Four tables in `public` (full DDL with constraints in [`db/schema.sql`](db/schema.sql)):

```
products ──< product_variants ──< emi_applications >── emi_plans
    └──────────────────────────────────────────────────┘
```

- **`products`** — model-level copy and the `slug` that gives each product its URL.
- **`product_variants`** — one row per finish × storage, holding `mrp`, `price`
  and `image_url`. Prices live here because they differ per configuration.
- **`emi_plans`** — the ladder offered on a product. Stores only *terms*
  (tenure, rate, cashback, fee), never an instalment amount.
- **`emi_applications`** — a submitted plan, with its figures snapshotted.

Two decisions worth calling out:

**Money is `integer` rupees.** Indian retail prices are quoted in whole rupees
and the largest value here is far inside `int4`. That sidesteps floating-point
rounding *and* the string-typed results `numeric` returns through
node-postgres.

**Instalments are derived, not stored.** One `emi_plans` row serves every
variant of a product, so a price change reprices the ladder with no data
migration and the 9 iPhone variants share 7 plan rows rather than 63. The
snapshot on `emi_applications` is the deliberate exception — a submitted
application must not be rewritten by a later price change.

## The EMI arithmetic

[`src/lib/emi.ts`](src/lib/emi.ts) is the only place money is calculated.

Interest-bearing plans use the standard reducing-balance instalment:

```
EMI = P · r · (1 + r)ⁿ / ((1 + r)ⁿ − 1)
```

with `r` the monthly rate and `n` the tenure. At `r = 0` that expression is
0/0, so no-cost plans split the principal evenly instead; the headline total
stays exactly the principal and the final instalment absorbs the rounding —
which is what "no cost" has to mean.

Worked example — iPhone 17 Pro 1TB at ₹1,65,900 over 36 months at 10.5%:
₹5,392/month, ₹1,94,112 total, ₹28,212 interest, ₹1,86,612 after ₹7,500
cashback.

## Notes on the build

**Product artwork is generated, not sourced.**
[`scripts/generate-product-images.mjs`](scripts/generate-product-images.mjs)
renders one SVG per variant from the same catalogue the seed uses, so a finish
always matches its swatch hex exactly and there is no third-party image host in
the critical path. The database still owns every image *path*.

**Route protection is page-level, not middleware.** Neon Auth ships a
`neonAuthMiddleware`, but it redirects to a bare login URL and so loses the
destination. The server-side guard in each protected page redirects to
`/sign-in?next=<destination>` instead, which survives the round trip and brings
you back to the exact variant you were configuring.

**Sign-in and sign-out do a full navigation.** The header lives in the root
layout, which the App Router keeps mounted across client-side navigation — a
`router.push` would land on the destination still wearing a signed-out header.

**Auth errors are thrown, not returned.** Neon Auth's client throws a typed
error for a failed request rather than returning `{ error }` the way plain
Better Auth does, so `describeAuthError` in
[`src/components/auth-form.tsx`](src/components/auth-form.tsx) unwraps it.
Without that, "User already exists" surfaced as a generic network failure.

## Layout

```
db/
  schema.sql      DDL, re-runnable
  catalog.mjs     seed catalogue — shared by the seeder and the artwork script
  seed.mjs        applies the schema and loads the catalogue
scripts/
  generate-product-images.mjs
src/
  app/
    api/          route handlers
    products/[slug]/       product page
    applications/          application list and confirmation
    sign-in, sign-up
  components/     UI, client components marked 'use client'
  lib/
    db.ts         pooled Postgres client
    emi.ts        instalment maths and rupee formatting
    products.ts   catalogue reads
    applications.ts
    auth.ts       Neon Auth server singleton
    types.ts      API response shapes
```
