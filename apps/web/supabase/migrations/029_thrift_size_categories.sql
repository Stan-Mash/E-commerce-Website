-- Replace the single 'thrifted' category with two size-specific thrift
-- categories: 'thrift-plus' (plus-size / size 16+) and 'thrift-standard'
-- (standard / small sizes XS–XL). Any existing rows tagged 'thrifted' are
-- migrated to 'thrift-standard' as the safer default.

UPDATE products SET category = 'thrift-standard' WHERE category = 'thrifted';

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE products
  ADD CONSTRAINT products_category_check
  CHECK (category IN ('women','men','children','accessories','thrift-plus','thrift-standard'));
