-- Add gender-split thrift categories to the products_category_check constraint.
-- New categories: thrift-women, thrift-men, thrift-children (standard sizes)
--                 thrift-plus-women, thrift-plus-men, thrift-plus-children (plus size)
-- Old categories (thrift-plus, thrift-standard) are kept for backward compatibility.

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE products
  ADD CONSTRAINT products_category_check
  CHECK (category IN (
    'women', 'men', 'children', 'accessories',
    'thrift-standard', 'thrift-plus',
    'thrift-women', 'thrift-men', 'thrift-children',
    'thrift-plus-women', 'thrift-plus-men'
  ));
