-- App tables. Neon Auth owns the neon_auth schema, so nothing here touches it.
--
-- Money is whole rupees in an `integer`. Indian prices are quoted in whole
-- rupees and everything here fits int4, which keeps us clear of float rounding
-- and of the strings node-postgres returns for `numeric`.

-- Children first, so the file can be re-run.
drop table if exists emi_applications cascade;
drop table if exists emi_plans        cascade;
drop table if exists product_variants cascade;
drop table if exists products         cascade;

-- One row per model. The slug is the URL key: /products/<slug>.
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

-- A buyable configuration (finish x storage). Price and MRP live here rather
-- than on the product because they differ per configuration.
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

-- At most one default per product. The API falls back to the lowest position.
create unique index variants_one_default_per_product
  on product_variants (product_id)
  where is_default;

-- The financing ladder for a product. Only the terms are stored; the monthly
-- instalment is worked out from the chosen variant's price at read time, so
-- one row covers every variant.
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

-- What the Proceed button records. The figures are snapshotted so a later
-- price change never rewrites an application that is already submitted.
--
-- user_id points at neon_auth."user".id but is not a foreign key: Neon manages
-- that schema and can reset it independently of ours.
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
