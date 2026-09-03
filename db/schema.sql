-- =============================================================================
-- 1Fi — EMI-on-mutual-funds storefront
-- Application schema (public). Neon Auth owns the `neon_auth` schema separately.
--
-- Money convention: every amount is a whole number of Indian rupees stored as
-- `integer`. Indian retail prices are quoted in whole rupees and the largest
-- value we handle is well inside int4, so this avoids both floating-point
-- rounding and the string-typed results `numeric` returns through node-postgres.
-- =============================================================================

-- Dropped children-first so the file is safely re-runnable.
drop table if exists emi_applications cascade;
drop table if exists emi_plans        cascade;
drop table if exists product_variants cascade;
drop table if exists products         cascade;

-- -----------------------------------------------------------------------------
-- products — one row per model. The `slug` is the public URL key, which is what
-- gives every product its own address at /products/<slug>.
-- -----------------------------------------------------------------------------
create table products (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        not null unique,
  brand        text        not null,
  name         text        not null,
  tagline      text        not null,
  description  text        not null,
  category     text        not null default 'smartphone',
  highlights   text[]      not null default '{}',
  is_new       boolean     not null default false,
  rating       numeric(2,1),
  review_count integer     not null default 0,
  position     integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_rating_range check (rating is null or (rating >= 0 and rating <= 5))
);

create index products_position_idx on products (position, name);

-- -----------------------------------------------------------------------------
-- product_variants — a buyable configuration (finish x storage). Price and MRP
-- live here, not on the product, because they differ per configuration.
-- -----------------------------------------------------------------------------
create table product_variants (
  id         uuid        primary key default gen_random_uuid(),
  product_id uuid        not null references products (id) on delete cascade,
  sku        text        not null unique,
  color_name text        not null,
  color_hex  text        not null,
  storage    text        not null,
  mrp        integer     not null,   -- list price, INR
  price      integer     not null,   -- selling price, INR
  image_url  text        not null,
  in_stock   boolean     not null default true,
  is_default boolean     not null default false,
  position   integer     not null default 0,
  created_at timestamptz not null default now(),

  constraint variants_price_positive  check (price > 0 and mrp > 0),
  constraint variants_price_under_mrp check (price <= mrp),
  constraint variants_hex_format      check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  constraint variants_unique_config   unique (product_id, color_name, storage)
);

create index variants_product_idx on product_variants (product_id, position);

-- At most one default variant per product; the API falls back to the lowest
-- `position` when a product has none.
create unique index variants_one_default_per_product
  on product_variants (product_id)
  where is_default;

-- -----------------------------------------------------------------------------
-- emi_plans — the financing ladder offered on a product. Only the *terms* are
-- stored (tenure, rate, cashback, fee); the monthly instalment is derived from
-- the selected variant's price at read time, so one row serves every variant.
-- -----------------------------------------------------------------------------
create table emi_plans (
  id             uuid         primary key default gen_random_uuid(),
  product_id     uuid         not null references products (id) on delete cascade,
  tenure_months  integer      not null,
  interest_rate  numeric(5,2) not null default 0,  -- annual %, reducing balance
  cashback       integer      not null default 0,  -- INR, credited upfront
  processing_fee integer      not null default 0,  -- INR
  funded_by      text         not null default 'Mutual Fund Pledge',
  is_popular     boolean      not null default false,
  position       integer      not null default 0,
  created_at     timestamptz  not null default now(),

  constraint plans_tenure_positive  check (tenure_months between 1 and 84),
  constraint plans_rate_range       check (interest_rate >= 0 and interest_rate < 100),
  constraint plans_cashback_positive check (cashback >= 0 and processing_fee >= 0),
  constraint plans_unique_tenure    unique (product_id, tenure_months)
);

create index plans_product_idx on emi_plans (product_id, position);

-- -----------------------------------------------------------------------------
-- emi_applications — what the "Proceed" button records. The chosen plan's
-- derived figures are snapshotted so a later price or rate change never
-- rewrites an application that was already submitted.
--
-- `user_id` points at neon_auth."user".id but is deliberately not a foreign key:
-- the auth schema is managed by Neon and may be reset independently of ours.
-- -----------------------------------------------------------------------------
create table emi_applications (
  id             uuid        primary key default gen_random_uuid(),
  reference      text        not null unique,
  user_id        uuid        not null,
  user_email     text        not null,
  user_name      text,
  variant_id     uuid        not null references product_variants (id) on delete restrict,
  emi_plan_id    uuid        not null references emi_plans (id)        on delete restrict,
  principal      integer     not null,
  monthly_amount integer     not null,
  total_payable  integer     not null,
  total_interest integer     not null,
  cashback       integer     not null default 0,
  processing_fee integer     not null default 0,
  tenure_months  integer     not null,
  interest_rate  numeric(5,2) not null,
  status         text        not null default 'submitted',
  created_at     timestamptz not null default now(),

  constraint applications_status_allowed
    check (status in ('submitted', 'under_review', 'approved', 'rejected', 'cancelled')),
  constraint applications_reference_format check (reference ~ '^1FI-[0-9A-Z]{8}$')
);

create index applications_user_idx on emi_applications (user_id, created_at desc);
