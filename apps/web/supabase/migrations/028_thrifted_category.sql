-- Add 'thrifted' as a valid product category so pre-owned / second-hand
-- items can be listed separately from new stock.

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE products
  ADD CONSTRAINT products_category_check
  CHECK (category IN ('women','men','children','accessories','thrifted'));
