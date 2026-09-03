# 1Fi

An online store for phones you buy on EMI, where the instalments are funded by
a loan against your mutual funds instead of a credit card. You pledge units, the
units stay invested, and you pay the phone off monthly.

Products, prices, images and EMI plans all come from Postgres through the app's
own API. Nothing in the UI is hardcoded.

Built with Next.js 16, React 19, Tailwind CSS v4, Postgres on Neon, and Neon
Auth for login.

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

Neon Auth allows `localhost` by default and nothing else. Before your first
deploy, add your production URL under **Trusted origins** in the Neon Auth
settings, or login will work locally and fail with a CORS error once deployed.
Set the same three environment variables on your host.

## API

| Route | What it returns |
| --- | --- |
| `GET /api/products` | All products, with colours, storage tiers, cheapest price and lowest EMI |
| `GET /api/products/:idOrSlug` | One product with every variant and its priced EMI plans |
| `POST /api/applications` | Saves the variant and plan you picked (needs login) |
| `GET /api/applications` | Your saved applications (needs login) |
| `GET /api/health` | Checks the database is reachable |
| `/api/auth/[...path]` | Neon Auth, proxied through this app |

`:idOrSlug` takes either the URL slug or the row's uuid, so both of these work:

```
/api/products/iphone-17-pro
/api/products/74d67b14-e7da-449a-9e61-584a708f21ca
```

The product detail response prices every variant's EMI plans on the server. That
is why switching finish or storage in the UI is instant, and it also means the
browser can never change what a plan costs.

## Database

Four tables. Full SQL with all the constraints is in
[`db/schema.sql`](db/schema.sql).

| Table | Holds |
| --- | --- |
| `products` | One row per model, plus the slug used in the URL |
| `product_variants` | One row per finish x storage, with its own price, MRP and image |
| `emi_plans` | The tenures offered on a product, with rate and cashback |
| `emi_applications` | A plan someone actually picked |

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
