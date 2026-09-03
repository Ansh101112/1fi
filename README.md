# 1Fi

An online store for phones you buy on EMI, where the instalments are funded by
a loan against your mutual funds instead of a credit card. You pledge units, the
units stay invested, and you pay the phone off monthly.

Products, prices, images and EMI plans all come from Postgres through the app's
own API. Nothing in the UI is hardcoded.

Live at https://1fi-mu.vercel.app

## Tech stack

| Layer | Used |
| --- | --- |
| Frontend | React 19, Next.js 16 App Router, Tailwind CSS v4 |
| Backend | Node.js, Next.js route handlers under `src/app/api` |
| Database | PostgreSQL, hosted on Neon |
| DB driver | `pg`, plain SQL, no ORM |
| Auth | Neon Auth (email and password, plus Google) |
| Language | TypeScript |
| Hosting | Vercel |

## What you can do

- Browse four phones on the store page.
- Open a product, pick a finish and a storage size, and watch the price and
  every EMI option update.
- Pick an EMI plan and see exactly what it costs: monthly amount, interest,
  total payable, cashback.
- Sign in and hit Proceed. That saves the plan you picked and gives you a
  reference number you can look up later.

Four products, 25 variants and 25 EMI plans ship in the seed data.

## Running it

You need Node 20+ and a Neon database.

```bash
npm install
cp .env.example .env.local
npm run db:reset
npm run dev
```

Then open http://localhost:3000.

`db:reset` downloads the product images, creates the tables and loads the seed
data. It drops and recreates the app tables every time, so it is safe to re-run.
It does not touch the `neon_auth` schema, so any accounts you created stick
around.

### Environment variables

Fill these into `.env.local`:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Your Neon Postgres connection string |
| `NEON_AUTH_BASE_URL` | Your Neon Auth URL, ending in `/<database>/auth` |
| `NEON_AUTH_COOKIE_SECRET` | Any random string, 32 characters or longer |

Generate the secret with `openssl rand -hex 32`.

The auth URL trips people up. It looks like this:

```
https://<endpoint-id>.neonauth.<region>.aws.neon.tech/neondb/auth
```

The database name and `/auth` are both part of it. If you stop at `/neondb`,
every auth call 404s. To check you have it right, open `<that URL>/ok` in a
browser. You should see `{"ok":true}`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm run db:reset` | Images, schema and seed data in one go |
| `npm run db:images` | Just re-download the product images |
| `npm run db:seed` | Just recreate the tables and reload the data |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

### Deploying

Set the same three environment variables on your host.

**Add your deployed URL to Trusted origins first.** Neon Auth allows
`localhost` out of the box and nothing else, and it rejects every
state-changing auth call from an origin it does not know:

```json
{ "message": "Invalid origin", "code": "INVALID_ORIGIN" }
```

Sign in, sign up and sign out all return `403`, so the site looks like it has a
broken sign-out button rather than a config problem. Google sign-in still works,
because that comes back through a redirect instead of a same-origin POST, which
makes the whole thing more confusing: you can get signed in and then find you
cannot get out.

Add the origin in the Neon Console under Auth, or straight in SQL:

```sql
update neon_auth.project_config
   set trusted_origins = trusted_origins || '["https://your-app.vercel.app"]'::jsonb,
       updated_at = now();
```

Check it took with `select trusted_origins from neon_auth.project_config;`.

## API

| Route | What it returns |
| --- | --- |
| `GET /api/products` | All products, with colours, storage tiers, cheapest price and lowest EMI |
| `GET /api/products/:idOrSlug` | One product with every variant and its priced EMI plans |
| `POST /api/applications` | Saves the variant and plan you picked (needs login) |
| `GET /api/applications` | Your saved applications (needs login) |
| `GET /api/health` | Checks the database is reachable |
| `/api/auth/[...path]` | Neon Auth, proxied through this app |

`:idOrSlug` takes either the URL slug or the row's uuid, so both of these work.
The uuids change every time you reseed, the slugs do not:

```
/api/products/iphone-17-pro
/api/products/1bcdb727-a3fd-4c7c-9815-6aec0bf501df
```

The product detail response prices every variant's EMI plans on the server. That
is why switching finish or storage in the UI is instant, and it also means the
browser can never change what a plan costs.

### Example responses

**`GET /api/products`** returns one entry per product, enough to draw a card.
Trimmed to the first of four:

```json
{
  "products": [
    {
      "id": "1bcdb727-a3fd-4c7c-9815-6aec0bf501df",
      "slug": "iphone-17-pro",
      "brand": "Apple",
      "name": "iPhone 17 Pro",
      "tagline": "Aerospace-grade titanium. A19 Pro. All-day battery.",
      "category": "smartphone",
      "isNew": true,
      "rating": 4.8,
      "reviewCount": 2431,
      "colors": [
        { "name": "Cosmic Orange", "hex": "#C86B34" },
        { "name": "Silver", "hex": "#DCDEE1" },
        { "name": "Deep Blue", "hex": "#2E4A6B" }
      ],
      "storages": ["256GB", "512GB", "1TB"],
      "variantCount": 9,
      "priceFrom": 127400,
      "mrpFrom": 134900,
      "discountPercent": 5,
      "imageUrl": "/products/iphone-17-pro-cosmic-orange.png",
      "lowestEmi": { "monthlyAmount": 2738, "tenureMonths": 60, "interestRate": 10.5 }
    }
  ]
}
```

**`GET /api/products/iphone-17-pro`** adds `description`, `highlights` and the
full `variants` array. Each variant carries its own price and its own priced EMI
plans. Trimmed to one variant and two of its seven plans:

```json
{
  "product": {
    "id": "1bcdb727-a3fd-4c7c-9815-6aec0bf501df",
    "slug": "iphone-17-pro",
    "brand": "Apple",
    "name": "iPhone 17 Pro",
    "description": "The iPhone 17 Pro pairs a forged titanium unibody with the A19 Pro chip...",
    "highlights": [
      "6.3\" Super Retina XDR, ProMotion 120Hz",
      "A19 Pro chip with 6-core GPU"
    ],
    "variants": [
      {
        "id": "b2325631-c758-4147-bb8a-61a6f441827d",
        "sku": "IPHONE-17-PRO-COSMIC-ORANGE-256GB",
        "colorName": "Cosmic Orange",
        "colorHex": "#C86B34",
        "storage": "256GB",
        "mrp": 134900,
        "price": 127400,
        "discountPercent": 5,
        "imageUrl": "/products/iphone-17-pro-cosmic-orange.png",
        "inStock": true,
        "isDefault": true,
        "emiPlans": [
          {
            "id": "94d0014f-8bba-4aa8-a2e1-e15316e9a10e",
            "tenureMonths": 3,
            "interestRate": 0,
            "cashback": 7500,
            "processingFee": 0,
            "fundedBy": "Mutual Fund Pledge",
            "isPopular": false,
            "principal": 127400,
            "monthlyAmount": 42467,
            "totalPayable": 127400,
            "totalInterest": 0,
            "effectiveCost": 119900,
            "isNoCost": true
          },
          {
            "id": "4d28e2fc-bef4-41e6-8693-846c2a50bd90",
            "tenureMonths": 36,
            "interestRate": 10.5,
            "cashback": 7500,
            "processingFee": 0,
            "fundedBy": "Mutual Fund Pledge",
            "isPopular": false,
            "principal": 127400,
            "monthlyAmount": 4141,
            "totalPayable": 149076,
            "totalInterest": 21676,
            "effectiveCost": 141576,
            "isNoCost": false
          }
        ]
      }
    ]
  }
}
```

**`POST /api/applications`** takes the variant and plan you picked. Everything
else is worked out on the server:

```json
{
  "variantId": "b2325631-c758-4147-bb8a-61a6f441827d",
  "emiPlanId": "8f1c4b2e-4a71-4c39-9f0e-2b5d7c1a3e64"
}
```

It replies `201` with the saved application. `GET /api/applications` returns the
same objects in an `applications` array:

```json
{
  "application": {
    "id": "f0c1a9d4-6f22-4a1b-9a3c-72d8e5b04c11",
    "reference": "1FI-R98VLZLL",
    "status": "submitted",
    "createdAt": "2026-09-03T11:15:54.019Z",
    "principal": 127400,
    "monthlyAmount": 10617,
    "totalPayable": 127400,
    "totalInterest": 0,
    "cashback": 7500,
    "processingFee": 0,
    "tenureMonths": 12,
    "interestRate": 0,
    "product": { "slug": "iphone-17-pro", "brand": "Apple", "name": "iPhone 17 Pro" },
    "variant": {
      "sku": "IPHONE-17-PRO-COSMIC-ORANGE-256GB",
      "colorName": "Cosmic Orange",
      "colorHex": "#C86B34",
      "storage": "256GB",
      "imageUrl": "/products/iphone-17-pro-cosmic-orange.png"
    }
  }
}
```

**`GET /api/health`**:

```json
{
  "status": "ok",
  "database": "connected",
  "counts": { "products": 4, "variants": 25, "plans": 25 },
  "timestamp": "2026-09-03T11:18:38.398Z"
}
```

Errors are the same shape everywhere, an `error` code and a `message` you can
show the user:

```json
{ "error": "not_found", "message": "No product matches \"nope\"." }
```

```json
{ "error": "unauthorized", "message": "Sign in to continue with an EMI plan." }
```

| Status | When |
| --- | --- |
| `400` | `variantId` or `emiPlanId` missing or not a uuid |
| `401` | No session on an applications route |
| `404` | No such product, or the plan is not offered on that product |
| `409` | That variant is out of stock |
| `503` | `/api/health` could not reach Postgres |

## Database

Four tables. Full SQL with every constraint, index and check is in
[`db/schema.sql`](db/schema.sql). Seed data is in
[`db/catalog.mjs`](db/catalog.mjs), loaded by [`db/seed.mjs`](db/seed.mjs).

```
products ──< product_variants ──< emi_applications >── emi_plans
    └──────────────────< emi_plans                        │
                                                          │
                          (an application points at one variant and one plan)
```

**`products`** one row per model.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | primary key |
| `slug` | text | unique, used in the URL |
| `brand`, `name`, `tagline`, `description` | text | |
| `category` | text | defaults to `smartphone` |
| `highlights` | text[] | bullets on the product page |
| `is_new` | boolean | shows the NEW badge |
| `rating`, `review_count` | numeric(2,1), integer | |
| `position` | integer | sort order on the store page |

**`product_variants`** one row per finish x storage. Price lives here, not on
the product, because it differs per configuration.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | primary key |
| `product_id` | uuid | to `products`, cascade delete |
| `sku` | text | unique, used as `?variant=` in the URL |
| `color_name`, `color_hex` | text | hex is checked against `^#[0-9A-Fa-f]{6}$` |
| `storage` | text | `256GB`, `1TB` |
| `mrp`, `price` | integer | rupees, `price <= mrp` |
| `image_url` | text | path under `public/products/` |
| `in_stock`, `is_default` | boolean | one default per product, enforced by a partial unique index |

**`emi_plans`** the tenures offered on a product. Terms only, no amounts.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | primary key |
| `product_id` | uuid | to `products`, cascade delete |
| `tenure_months` | integer | 1 to 84, unique per product |
| `interest_rate` | numeric(5,2) | annual percentage, 0 means no cost |
| `cashback`, `processing_fee` | integer | rupees |
| `funded_by` | text | defaults to `Mutual Fund Pledge` |
| `is_popular` | boolean | the "most chosen" tag |

**`emi_applications`** a plan someone picked, with the numbers copied in.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | primary key |
| `reference` | text | unique, checked against `^1FI-[0-9A-Z]{8}$` |
| `user_id`, `user_email`, `user_name` | uuid, text | |
| `variant_id`, `emi_plan_id` | uuid | restrict delete, so you cannot remove a product someone applied for |
| `principal`, `monthly_amount`, `total_payable`, `total_interest` | integer | snapshotted |
| `cashback`, `processing_fee`, `tenure_months` | integer | snapshotted |
| `interest_rate` | numeric(5,2) | snapshotted |
| `status` | text | one of submitted, under_review, approved, rejected, cancelled |

`user_id` points at `neon_auth."user".id` but is not a foreign key on purpose.
Neon manages that schema and can reset it independently of ours.

Two things worth knowing:

**Money is stored as whole rupees in an `integer`.** Indian prices are quoted in
whole rupees and nothing here comes close to overflowing an int4. It also avoids
`numeric`, which node-postgres hands back as a string.

**Monthly instalments are not stored.** `emi_plans` only holds the terms, and
the instalment is worked out from the variant's price when you read it. So one
plan row covers all nine iPhone variants instead of needing sixty-three, and
changing a price updates every plan automatically.

The exception is `emi_applications`, which copies the numbers in when you
submit. An application you already made should not change because a price moved
later.

## How the EMI is calculated

All of it lives in [`src/lib/emi.ts`](src/lib/emi.ts).

Plans with interest use the normal reducing-balance formula:

```
EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
```

`P` is the price, `r` is the monthly rate, `n` is the number of months.

At 0% that formula divides by zero, so no-cost plans just split the price
evenly. The total stays exactly the price, and the last instalment absorbs the
rounding, which is what "no cost" has to mean.

An example, the iPhone 17 Pro 1TB at ₹1,65,900 over 36 months at 10.5%:

- ₹5,392 a month
- ₹1,94,112 in total
- ₹28,212 of that is interest
- ₹1,86,612 after ₹7,500 cashback

## A few notes

**Where the product images come from.**
[`scripts/fetch-product-images.mjs`](scripts/fetch-product-images.mjs) downloads
the image each manufacturer's own store shows for that exact finish, so the
colour swatch always matches the photo. They go into `public/products/` and the
database stores the path.

Those URLs have cache-busting tokens that the manufacturers change now and then.
If a download 404s, open the buy page, copy the new image URL, and paste it into
[`db/catalog.mjs`](db/catalog.mjs). Images already on disk are left alone when a
download fails, so nothing breaks in the meantime.

These are the manufacturers' marketing images being used to fill out a demo. A
real store would use its own.

**Login is checked per page, not in middleware.** Neon Auth ships a middleware
you can use, but it redirects to a plain login URL and forgets where you were
going. Each protected page checks the session itself and redirects to
`/sign-in?next=...`, so after logging in you land back on the exact phone and
finish you were looking at.

**Except on `/auth/callback`, which does need the middleware.** Google sends
people back with a `?neon_auth_session_verifier=` token, and only Neon Auth's
middleware knows how to swap that for a session cookie. Without it you land back
on the site with the token still in the URL and no session. Email and password
never touch that path, so it is easy to miss until you try Google.

[`src/proxy.ts`](src/proxy.ts) runs the middleware on `/auth/callback` and
nowhere else, because it protects whatever it matches and pointing it at the
whole app would put the store behind a login. Google's `callbackURL` is
`/auth/callback?next=<where you were>`, and the page there forwards you on.

**Login and logout reload the page instead of using the router.** The header is
in the root layout, which Next keeps mounted while you navigate. A
`router.push` would take you to the next page still showing the old header.

**Auth errors are thrown, not returned.** The Neon Auth client throws a typed
error when a request fails, rather than returning `{ error }` like plain Better
Auth. `describeAuthError` in
[`src/components/auth-form.tsx`](src/components/auth-form.tsx) unwraps it.
Without that, "User already exists" showed up as a generic network error.

## Where things live

```
db/
  schema.sql      the tables
  catalog.mjs     the seed data, plus where each image comes from
  seed.mjs        creates the tables and loads the data
scripts/
  fetch-product-images.mjs
src/
  app/
    api/                    the routes above
    products/[slug]/        product page
    applications/           your applications and the confirmation page
    sign-in/, sign-up/
  components/               UI
  lib/
    db.ts                   Postgres pool
    emi.ts                  EMI maths and rupee formatting
    products.ts             reading the catalogue
    applications.ts         saving and reading applications
    auth.ts                 Neon Auth on the server
    types.ts                what the API returns
```
