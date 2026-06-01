-- 012_coming_soon_status.sql
-- Adds a 'coming_soon' product status so items can be showcased before they
-- are purchasable. Coming-soon products are publicly visible (so they appear
-- on the storefront with a badge) but the checkout RPC still only sells
-- 'active' products.
--
-- Run in: Supabase Dashboard → SQL Editor

-- 1. Extend the status CHECK constraint to allow 'coming_soon'.
alter table products
  drop constraint if exists products_status_check;

alter table products
  add constraint products_status_check
  check (status in ('active', 'draft', 'archived', 'coming_soon'));

-- 2. Ensure public read access includes coming_soon (RLS).
--    The original public policy typically reads `status = 'active'`; replace it
--    with one that also exposes coming_soon items to anonymous visitors.
do $$
begin
  if exists (
    select 1 from pg_policies
    where tablename = 'products' and policyname = 'public_read_active_products'
  ) then
    drop policy "public_read_active_products" on products;
  end if;
end $$;

create policy "public_read_visible_products"
  on products for select
  using (status in ('active', 'coming_soon'));

-- 3. Update the join-table read policies (added in migration 004) so a
--    coming-soon product's SKUs / images / videos are also publicly readable.
drop policy if exists "public_read_skus" on skus;
create policy "public_read_skus" on skus
  for select
  using (
    exists (
      select 1 from products
      where products.id = skus.product_id
        and products.status in ('active', 'coming_soon')
    )
  );

drop policy if exists "public_read_images" on product_images;
create policy "public_read_images" on product_images
  for select
  using (
    exists (
      select 1 from products
      where products.id = product_images.product_id
        and products.status in ('active', 'coming_soon')
    )
  );

drop policy if exists "public_read_videos" on product_videos;
create policy "public_read_videos" on product_videos
  for select
  using (
    exists (
      select 1 from products
      where products.id = product_videos.product_id
        and products.status in ('active', 'coming_soon')
    )
  );

-- 4. Optional: track an expected availability date for coming-soon items.
alter table products
  add column if not exists available_from date;

-- 5. Extend orders.delivery_type to support CBD vs outside-CBD delivery.
--    Keeps legacy 'door' valid so historical orders still satisfy the check.
alter table orders
  drop constraint if exists orders_delivery_type_check;

alter table orders
  add constraint orders_delivery_type_check
  check (delivery_type in ('pickup', 'door', 'cbd', 'outside_cbd'));

-- 6. Track which payment provider an order used (M-Pesa STK, Paybill, card).
alter table orders
  add column if not exists payment_provider text;
