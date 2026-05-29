-- 011_product_images.sql
-- Adds image support to the products table and creates a public Storage bucket.
--
-- Run in: Supabase Dashboard → SQL Editor
-- (or applied automatically via the /api/admin/setup-images endpoint after deploy)

-- 1. Add image_url column to products
alter table products
  add column if not exists image_url text;

-- 2. Allow multiple images per product via a join table (optional future use)
create table if not exists product_images (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  url         text not null,
  alt_text    text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on product_images(product_id);

-- RLS for product_images
alter table product_images enable row level security;
create policy if not exists "public_read_product_images"   on product_images for select using (true);
create policy if not exists "service_role_all_prod_images" on product_images using (auth.role() = 'service_role');
