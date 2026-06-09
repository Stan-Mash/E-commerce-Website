-- Nairobi Fashion - Initial Schema
-- Run: supabase db push (or paste in Supabase SQL editor)

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- fuzzy search on product names

-- Enums
create type order_status as enum (
  'pending_payment',
  'paid',
  'payment_failed',
  'processing',
  'ready_for_pickup',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

create type return_status as enum (
  'requested',
  'approved',
  'rejected',
  'refunded'
);

create type return_resolution as enum (
  'refund',
  'store_credit',
  'exchange'
);

-- Products
create table products (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  slug             text not null unique,
  description      text,
  category         text not null check (category in ('women','men','children','accessories')),
  base_price       numeric(10,2) not null check (base_price >= 0),
  compare_price    numeric(10,2) check (compare_price is null or compare_price >= base_price),
  material         text,
  care_instructions text,
  is_featured      boolean not null default false,
  status           text not null default 'draft' check (status in ('active','draft','archived')),
  search_vector    tsvector generated always as (
    to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(category,''))
  ) stored,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index products_slug_idx on products(slug);
create index products_status_idx on products(status);
create index products_category_idx on products(category);
create index products_featured_idx on products(is_featured) where is_featured = true;
create index products_search_idx on products using gin(search_vector);

-- SKUs
create table skus (
  id               uuid primary key default uuid_generate_v4(),
  product_id       uuid not null references products(id) on delete cascade,
  sku_code         text not null unique,
  size             text not null,
  color            text,
  color_hex        text,
  stock_quantity   integer not null default 0 check (stock_quantity >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index skus_product_id_idx on skus(product_id);

-- Product Images
create table product_images (
  id                    uuid primary key default uuid_generate_v4(),
  product_id            uuid not null references products(id) on delete cascade,
  url                   text not null,
  alt                   text,
  cloudinary_public_id  text,
  media_type            text not null default 'image' check (media_type in ('image','video')),
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now(),
  unique (product_id, sort_order)
);

create index product_images_product_id_idx on product_images(product_id);

-- Product Videos
create table product_videos (
  id                    uuid primary key default uuid_generate_v4(),
  product_id            uuid not null references products(id) on delete cascade,
  cloudinary_url        text not null,
  cloudinary_public_id  text not null,
  thumbnail_url         text,
  duration_seconds      integer,
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now(),
  unique (product_id, sort_order)
);

create index product_videos_product_id_idx on product_videos(product_id);

-- Customers
create table customers (
  id          uuid primary key default uuid_generate_v4(),
  phone       text not null unique,               -- 254XXXXXXXXX normalised
  name        text,
  email       text unique,
  whatsapp_opt_in boolean not null default false,
  sms_opt_in  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index customers_phone_idx on customers(phone);

-- Orders
create table orders (
  id               uuid primary key default uuid_generate_v4(),
  order_ref        text not null unique,
  customer_id      uuid references customers(id),
  status           order_status not null default 'pending_payment',
  subtotal         numeric(10,2) not null,
  delivery_fee     numeric(10,2) not null default 0,
  total            numeric(10,2) not null,
  delivery_type    text not null check (delivery_type in ('pickup','door')),
  delivery_address text,
  phone            text not null,
  notes            text,
  paid_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index orders_status_idx on orders(status);
create index orders_phone_idx on orders(phone);
create index orders_created_at_idx on orders(created_at desc);
create index orders_order_ref_idx on orders(order_ref);

-- Order Items
create table order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  sku_id      uuid not null references skus(id),
  quantity    integer not null check (quantity > 0),
  unit_price  numeric(10,2) not null,
  subtotal    numeric(10,2) not null,
  created_at  timestamptz not null default now()
);

create index order_items_order_id_idx on order_items(order_id);

-- M-Pesa Transactions
create table mpesa_transactions (
  id                    uuid primary key default uuid_generate_v4(),
  order_id              uuid references orders(id),
  checkout_request_id   text not null unique,  -- Daraja CheckoutRequestID
  merchant_request_id   text not null,
  status                text not null default 'pending' check (status in ('pending','completed','failed')),
  amount                numeric(10,2),
  amount_paid           numeric(10,2),
  phone_number          text,
  mpesa_receipt_number  text unique,
  result_desc           text,
  transaction_date      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index mpesa_transactions_order_id_idx on mpesa_transactions(order_id);
create index mpesa_transactions_checkout_request_idx on mpesa_transactions(checkout_request_id);

-- Notification Jobs
create table notification_jobs (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id),
  job_type    text not null,   -- 'order_confirmation', 'shipping_update', etc.
  status      text not null default 'queued' check (status in ('queued','processing','done','failed')),
  attempts    integer not null default 0,
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index notification_jobs_status_idx on notification_jobs(status) where status in ('queued','failed');

-- Returns
create table returns (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id),
  reason      text not null,
  status      return_status not null default 'requested',
  resolution  return_resolution,
  amount      numeric(10,2),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index returns_order_id_idx on returns(order_id);
create index returns_status_idx on returns(status);

-- Inventory Audit Log
create table inventory_log (
  id          uuid primary key default uuid_generate_v4(),
  sku_id      uuid not null references skus(id),
  delta       integer not null,                  -- positive = restock, negative = sale
  reason      text not null,                     -- 'sale', 'restock', 'adjustment', 'return'
  reference   text,                              -- order_id, return_id, etc.
  created_at  timestamptz not null default now()
);

create index inventory_log_sku_id_idx on inventory_log(sku_id);

-- Updated_at triggers
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger skus_updated_at before update on skus
  for each row execute function set_updated_at();
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger mpesa_transactions_updated_at before update on mpesa_transactions
  for each row execute function set_updated_at();
create trigger notification_jobs_updated_at before update on notification_jobs
  for each row execute function set_updated_at();
create trigger returns_updated_at before update on returns
  for each row execute function set_updated_at();
create trigger customers_updated_at before update on customers
  for each row execute function set_updated_at();

-- Row Level Security

-- Products: public read of active products only
alter table products enable row level security;
create policy "public_read_active_products" on products
  for select using (status = 'active');
create policy "service_role_all_products" on products
  using (auth.role() = 'service_role');

-- SKUs: public read
alter table skus enable row level security;
create policy "public_read_skus" on skus for select using (true);
create policy "service_role_all_skus" on skus using (auth.role() = 'service_role');

-- Product images: public read
alter table product_images enable row level security;
create policy "public_read_images" on product_images for select using (true);
create policy "service_role_all_images" on product_images using (auth.role() = 'service_role');

-- Product videos: public read
alter table product_videos enable row level security;
create policy "public_read_videos" on product_videos for select using (true);
create policy "service_role_all_videos" on product_videos using (auth.role() = 'service_role');

-- Orders: only service_role (orders go through API, not direct client access)
alter table orders enable row level security;
create policy "service_role_all_orders" on orders using (auth.role() = 'service_role');

-- Order items
alter table order_items enable row level security;
create policy "service_role_all_order_items" on order_items using (auth.role() = 'service_role');

-- M-Pesa transactions: service_role only
alter table mpesa_transactions enable row level security;
create policy "service_role_all_mpesa" on mpesa_transactions using (auth.role() = 'service_role');

-- Notification jobs: service_role only
alter table notification_jobs enable row level security;
create policy "service_role_all_notif" on notification_jobs using (auth.role() = 'service_role');

-- Returns: service_role only
alter table returns enable row level security;
create policy "service_role_all_returns" on returns using (auth.role() = 'service_role');

-- Customers: service_role only
alter table customers enable row level security;
create policy "service_role_all_customers" on customers using (auth.role() = 'service_role');

-- Inventory log: service_role only
alter table inventory_log enable row level security;
create policy "service_role_all_inventory" on inventory_log using (auth.role() = 'service_role');
