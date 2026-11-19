-- Fix known typos & standardize product title capitalisation
UPDATE products SET name = 'Pointed Comfortable Corporate Heels'
  WHERE name ILIKE '%coorprate%' OR name ILIKE '%corporate%heels%' AND name ILIKE '%pointed%';

-- Generic title-case cleanup: capitalize first letter of each word
-- (PostgreSQL doesn't have a built-in initcap that handles all cases; this
--  catches the most common lowercase-first-word pattern.)
UPDATE products
  SET name = INITCAP(name)
  WHERE name != INITCAP(name)
    AND status IN ('active', 'coming_soon');
