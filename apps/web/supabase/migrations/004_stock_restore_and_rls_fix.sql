--
-- Migration 004: stock restore RPC + RLS data-leak fix
--
-- Fixes two confirmed bugs from Round 4 audit:
--
-- 1. increment_sku_stock(p_sku_id, p_delta)
-- Called by the M-Pesa webhook failure handler to restore stock that was
-- deducted atomically by checkout_and_reserve_stock when the order was first
-- created. Using a function (rather than a raw UPDATE) keeps stock mutation
-- inside a single statement - safe under concurrent writes.
--
-- 2. RLS policy fix for skus / product_images / product_videos
-- The original policies used `using (true)`, which exposed rows belonging to
-- draft and archived products to any anonymous request. The corrected
-- policies join back to the parent product and enforce status = 'active'.
--

-- 1. increment_sku_stock

create or replace function increment_sku_stock(
  p_sku_id uuid,
  p_delta   integer   -- positive = add stock, negative = deduct stock
)
returns void
language plpgsql
security definer          -- runs as the function owner (postgres), not the caller
as $$
begin
  update skus
  set    stock_quantity = stock_quantity + p_delta,
         updated_at     = now()
  where  id = p_sku_id;

  if not found then
    raise exception 'SKU % not found', p_sku_id;
  end if;
end;
$$;

-- 2. Fix RLS data leak
-- Drop the overly-permissive policies and replace them with ones that check
-- the parent product's status.

-- skus
drop policy if exists "public_read_skus" on skus;
create policy "public_read_skus" on skus
  for select
  using (
    exists (
      select 1 from products
      where products.id = skus.product_id
        and products.status = 'active'
    )
  );

-- product_images
drop policy if exists "public_read_images" on product_images;
create policy "public_read_images" on product_images
  for select
  using (
    exists (
      select 1 from products
      where products.id = product_images.product_id
        and products.status = 'active'
    )
  );

-- product_videos
drop policy if exists "public_read_videos" on product_videos;
create policy "public_read_videos" on product_videos
  for select
  using (
    exists (
      select 1 from products
      where products.id = product_videos.product_id
        and products.status = 'active'
    )
  );
