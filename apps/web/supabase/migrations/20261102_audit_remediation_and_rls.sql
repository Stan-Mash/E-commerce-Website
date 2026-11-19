-- =============================================================================
-- Elite Style Co. — Audit Remediation & RLS Hardening
-- Migration: 20261102_audit_remediation_and_rls.sql
-- Run in: Supabase SQL Editor (project mcujpfiuygnubiewzyko)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PHASE 1.1 — PRICE RECONCILIATION
-- IMPORTANT: Review each price before running. The audit found discrepancies
-- between pages. The values below use the price that appeared on more views
-- (Homepage / /products), but YOU should confirm against your actual pricing
-- before executing these UPDATE statements.
-- -----------------------------------------------------------------------------

-- Tweed Jacket & Skirt Set: /products shows 6500, /woman shows 4500
-- Set to 6500 (the higher / more prominent price). CONFIRM BEFORE RUNNING.
UPDATE products SET base_price = 6500
WHERE slug = 'tweed-jacket-skirt-set'
  AND base_price != 6500;

-- Pointed Buckle Boots: /products+PDP show 4000, /woman shows 3500
UPDATE products SET base_price = 4000
WHERE slug = 'pointed-buckle-boots'
  AND base_price != 4000;

-- Versatile Pointed-Tip Heel: /products shows 2500, /woman+PDP show 1800
-- CONFIRM which is correct.
UPDATE products SET base_price = 2500
WHERE slug = 'versatile-pointed-heel'
  AND base_price != 2500;

-- Small-Chic Pointed High Heels: /products shows 2500, /woman+PDP show 1800
UPDATE products SET base_price = 2500
WHERE slug = 'pointed-high-heels'
  AND base_price != 2500;

-- The Ivory Glow Pearl Set: /products shows 300, /woman+PDP show 650
-- 650 is more plausible for a pearl set — CONFIRM.
UPDATE products SET base_price = 650
WHERE slug = 'the-ivory-glow-pearl-set'
  AND base_price != 650;

-- Classic Quilted Chain Crossbody Bag: Homepage+/products show 2500, widget shows 1800
UPDATE products SET base_price = 2500
WHERE slug = 'classic-quilted-chain-crossbody-bag'
  AND base_price != 2500;

-- Men's Classic Tassel Leather Loafers: /products shows 1000, /man+PDP show 1200
UPDATE products SET base_price = 1200
WHERE slug ILIKE '%tassel%loafer%'
  AND base_price != 1200;

-- -----------------------------------------------------------------------------
-- PHASE 1.3 — THRIFT SUBCATEGORY NORMALIZATION
-- Tag existing "thrifted" catch-all items as "thrift-standard"
-- so /thrifted/standard shows them correctly.
-- -----------------------------------------------------------------------------
UPDATE products
SET category = 'thrift-standard'
WHERE category IN ('thrifted', 'Thrifted', 'THRIFTED')
  AND status = 'active';

-- -----------------------------------------------------------------------------
-- PHASE 1.5 — PRODUCT TITLE, SLUG & COPY CLEANUP
-- -----------------------------------------------------------------------------

-- Fix typo: "coorprate" -> "corporate" (title and slug)
UPDATE products
SET
  name = 'Pointed Comfortable Corporate Heels',
  slug = 'pointed-comfortable-corporate-heels'
WHERE slug = 'pointed-comfortable-coorprate-heels'
   OR name ILIKE '%coorprate%';

-- Fix typo: "linned" -> "lined"
UPDATE products
SET
  name = 'Fleece Lined Stockings',
  slug = 'fleece-lined-stockings'
WHERE slug = 'fleece-linned-stockings'
   OR name ILIKE '%linned%';

-- Fix typo: "earing" -> "earring"
UPDATE products
SET
  name = 'Silicone Earring Stopper',
  slug = 'silicone-earring-stopper'
WHERE slug = 'silicone-earing-stopper'
   OR name ILIKE '%earing stopper%';

-- Fix Men's Classic Tassel Loafers: clean AliExpress-style title, remove stray slash
UPDATE products
SET
  name = 'Men''s Classic Tassel Loafers'
WHERE name ILIKE '%tassel leather loafers%slip-on%'
   OR name ILIKE '%Tassel Leather Loafers – Slip-On%';

-- Remove emoji from product titles (luxury editorial aesthetic)
UPDATE products
SET name = TRIM(REPLACE(REPLACE(name, '✨', ''), '🖤', ''))
WHERE name LIKE '%✨%' OR name LIKE '%🖤%';

-- Trim leading whitespace from Navy Floral Top & Trousers Set
UPDATE products
SET name = TRIM(name)
WHERE name LIKE ' %';

-- Normalize houndstooth blazer sizes to clean UK sizing labels
-- (The skus table holds size values — update them if the slug matches)
UPDATE skus
SET size = CASE
  WHEN size ILIKE '2xL (12/14) uk' THEN 'XL (UK 12)'
  WHEN size ILIKE '3XL (14) uk'    THEN '2XL (UK 12/14)'
  WHEN size ILIKE '4xl (16)'       THEN '3XL (UK 14)'
  WHEN size ILIKE 'XL (12) uk'     THEN '4XL (UK 16)'
  ELSE size
END
WHERE product_id IN (
  SELECT id FROM products WHERE slug = 'classic-houndstooth-blazer'
);

-- -----------------------------------------------------------------------------
-- PHASE 2.1 — SEO: Ensure products canonical slug matches stored slug
-- (Run after slug updates above to avoid stale canonical links)
-- -----------------------------------------------------------------------------
-- No SQL needed — Next.js generates canonical from slug via generateMetadata().

-- -----------------------------------------------------------------------------
-- PHASE 5.4 — ROW-LEVEL SECURITY
-- Enable RLS on all public-facing tables and add sensible policies.
-- The anon/authenticated roles can SELECT products/images/skus.
-- All write operations require service_role (server-side API routes only).
-- -----------------------------------------------------------------------------

-- products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_public"  ON products;
DROP POLICY IF EXISTS "products_write_admin"     ON products;

CREATE POLICY "products_select_public"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "products_write_admin"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- product_images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images_select_public" ON product_images;
DROP POLICY IF EXISTS "product_images_write_admin"   ON product_images;

CREATE POLICY "product_images_select_public"
  ON product_images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "product_images_write_admin"
  ON product_images FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- skus
ALTER TABLE skus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skus_select_public" ON skus;
DROP POLICY IF EXISTS "skus_write_admin"   ON skus;

CREATE POLICY "skus_select_public"
  ON skus FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "skus_write_admin"
  ON skus FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- orders — no anon reads; all guest lookups go through service_role API routes
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_service_role_all" ON orders;
DROP POLICY IF EXISTS "orders_anon_no_access"   ON orders;

CREATE POLICY "orders_service_role_all"
  ON orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Deny anon direct access (the track API uses service_role key server-side)
CREATE POLICY "orders_authenticated_own"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_service_role_all" ON order_items;

CREATE POLICY "order_items_service_role_all"
  ON order_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- promotions — readable by all (codes are validated server-side)
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promotions_select_public" ON promotions;
DROP POLICY IF EXISTS "promotions_write_admin"   ON promotions;

CREATE POLICY "promotions_select_public"
  ON promotions FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "promotions_write_admin"
  ON promotions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- pickup_points — readable by all
ALTER TABLE pickup_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pickup_points_select_public" ON pickup_points;

CREATE POLICY "pickup_points_select_public"
  ON pickup_points FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- -----------------------------------------------------------------------------
-- PHASE 5.4 — STORAGE BUCKET LOCKDOWN
-- product-images: public read, service_role write
-- try-on (if exists): private, no anon access
-- -----------------------------------------------------------------------------

-- Restrict product-images bucket inserts/updates/deletes to service_role
-- (Note: run in Supabase Dashboard > Storage > Policies if not using migration runner)

-- Allow public read of product images
DROP POLICY IF EXISTS "product_images_bucket_read"   ON storage.objects;
DROP POLICY IF EXISTS "product_images_bucket_write"  ON storage.objects;

CREATE POLICY "product_images_bucket_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_bucket_write"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_bucket_update"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_bucket_delete"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'product-images');

-- try-on bucket: private (no anon access)
-- Update the bucket's public setting via Supabase Dashboard or:
UPDATE storage.buckets
SET public = false
WHERE id = 'try-on';

-- Drop any existing anon policies on try-on bucket
DROP POLICY IF EXISTS "try_on_anon_read"  ON storage.objects;

-- Only service_role (and authenticated owners) may access try-on photos
CREATE POLICY "try_on_service_role_only"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'try-on')
  WITH CHECK (bucket_id = 'try-on');

-- -----------------------------------------------------------------------------
-- PHASE 1.5 (cont.) — FLEECE STOCKINGS SIZE DEDUPLICATION
-- The fleece-lined-stockings product has duplicate size entries in skus:
--   XL, XXL, 3XL, Xl, XL  (case variants + duplicate)
-- Keep canonical uppercase versions (XL, XXL, 3XL) and delete the extras.
-- Strategy: for each duplicate, keep the one with the most stock, delete rest.
-- -----------------------------------------------------------------------------

-- Step 1: Assign a row number within each (product_id, normalised_size) group.
-- Rows ranked > 1 are duplicates to delete.
WITH ranked_skus AS (
  SELECT
    id,
    product_id,
    UPPER(TRIM(size)) AS norm_size,
    stock_quantity,
    ROW_NUMBER() OVER (
      PARTITION BY product_id, UPPER(TRIM(size))
      ORDER BY stock_quantity DESC, id ASC
    ) AS rn
  FROM skus
  WHERE product_id IN (
    SELECT id FROM products
    WHERE slug IN ('fleece-lined-stockings', 'fleece-linned-stockings')
  )
),
-- Step 2: Identify the canonical sku ids to keep (rn = 1)
keepers AS (
  SELECT id FROM ranked_skus WHERE rn = 1
),
-- Step 3: Identify duplicate ids to remove (rn > 1)
duplicates AS (
  SELECT id FROM ranked_skus WHERE rn > 1
)
-- Step 4: Normalise size labels on the keepers first
UPDATE skus
SET size = UPPER(TRIM(size))
WHERE id IN (SELECT id FROM keepers);

-- Step 5: Delete duplicate rows (separate statement after the UPDATE above)
DELETE FROM skus
WHERE product_id IN (
  SELECT id FROM products
  WHERE slug IN ('fleece-lined-stockings', 'fleece-linned-stockings')
)
AND id NOT IN (
  SELECT DISTINCT ON (product_id, UPPER(TRIM(size))) id
  FROM skus
  WHERE product_id IN (
    SELECT id FROM products
    WHERE slug IN ('fleece-lined-stockings', 'fleece-linned-stockings')
  )
  ORDER BY product_id, UPPER(TRIM(size)), stock_quantity DESC, id ASC
);

-- =============================================================================
-- NEXT.JS REDIRECTS (add to next.config.js if not already present)
-- These ensure old typo slugs don't 404 after the slug fix above.
-- =============================================================================
-- /products/pointed-comfortable-coorprate-heels  → /products/pointed-comfortable-corporate-heels
-- /products/fleece-linned-stockings              → /products/fleece-lined-stockings
-- /products/silicone-earing-stopper              → /products/silicone-earring-stopper
-- See the async redirects() block in next.config.js.
