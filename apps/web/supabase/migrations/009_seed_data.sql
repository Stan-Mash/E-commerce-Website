--
-- Migration 009: Comprehensive mock data
-- 25 products · ~260 SKUs · 2 locations · 40 customers · 85 orders · receipts
--

-- HELPER: SKU INSERT (must be a real function, not inline)
CREATE OR REPLACE FUNCTION _seed_sku(
  pid uuid, code text, sz text, col text, hex text, qw integer, qs integer
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_sid uuid;
BEGIN
  INSERT INTO skus (product_id, sku_code, size, color, color_hex, stock_quantity)
  VALUES (pid, code, sz, col, hex, 0)
  RETURNING id INTO v_sid;
  INSERT INTO inventory_levels (sku_id, location_id, quantity)
  VALUES (v_sid, (SELECT id FROM locations WHERE name = 'Main Warehouse'), qw);
  INSERT INTO inventory_levels (sku_id, location_id, quantity)
  VALUES (v_sid, (SELECT id FROM locations WHERE name = 'CBD Store'), qs);
END;
$$;

-- PRODUCTS + SKUS + INVENTORY
DO $$
DECLARE
  v_pid   uuid;
  v_color text;
  v_size  text;
BEGIN

  --
  -- WOMEN (10 products)
  --

  -- 1. Tweed Jacket & Skirt Set
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Tweed Jacket & Skirt Set','tweed-jacket-skirt-set',
    'An elegant co-ord set featuring a cropped tweed jacket with gold-tone button detailing paired with a matching asymmetric mini skirt. A wardrobe essential for the modern Nairobi woman — equally perfect for brunch, office days, and evening events.',
    'women',4500,6200,'Tweed Blend (60% Polyester, 35% Cotton, 5% Metallic Thread)',
    'Dry clean only. Do not tumble dry. Iron on low heat with a pressing cloth.','active',true)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['Pink','Black','White/Grey','Cream']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['XS','S','M','L','XL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'TWS-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'Pink' THEN '#F4A0C0' WHEN 'Black' THEN '#1A1A1A'
          WHEN 'White/Grey' THEN '#E0DEDE' ELSE '#F5F0E8' END,
        CASE v_size WHEN 'M' THEN 22 WHEN 'L' THEN 18 WHEN 'S' THEN 16 WHEN 'XL' THEN 10 ELSE 7 END,
        CASE v_size WHEN 'M' THEN 8  WHEN 'L' THEN 6  WHEN 'S' THEN 5  WHEN 'XL' THEN 4  ELSE 3 END);
    END LOOP;
  END LOOP;

  -- 2. Ribbed Turtleneck Sweater
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Ribbed Turtleneck Sweater','ribbed-turtleneck-sweater',
    'A classic ribbed turtleneck in a slim silhouette. The perfect layering piece — wear under the Tweed Set or styled alone with wide-leg trousers. Soft, stretchy, and supremely comfortable.',
    'women',1800,2400,'92% Viscose, 8% Elastane',
    'Machine wash cold on gentle cycle. Lay flat to dry.','active',true)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['Ivory','Black','Dusty Rose','Navy','Caramel']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['XS','S','M','L','XL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'RTS-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'Ivory' THEN '#FFFFF0' WHEN 'Black' THEN '#1A1A1A'
          WHEN 'Dusty Rose' THEN '#D4A0A0' WHEN 'Navy' THEN '#1B2A4A' ELSE '#C68642' END,
        CASE v_size WHEN 'M' THEN 25 WHEN 'L' THEN 20 WHEN 'S' THEN 18 WHEN 'XL' THEN 12 ELSE 8 END,
        CASE v_size WHEN 'M' THEN 10 WHEN 'L' THEN 8  WHEN 'S' THEN 7  WHEN 'XL' THEN 5  ELSE 4 END);
    END LOOP;
  END LOOP;

  -- 3. Satin Slip Midi Dress
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Satin Slip Midi Dress','satin-slip-midi-dress',
    'A luxurious satin slip dress with adjustable spaghetti straps and a delicate lace trim hemline. Effortlessly transitions from daytime sophistication to evening glamour.',
    'women',3200,4500,'100% Polyester Satin','Hand wash in cold water. Do not wring. Hang to dry.','active',true)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['Champagne','Black','Forest Green','Burgundy']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['XS','S','M','L','XL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'SSD-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'Champagne' THEN '#F7E7CE' WHEN 'Black' THEN '#1A1A1A'
          WHEN 'Forest Green' THEN '#2D5A27' ELSE '#800020' END,
        CASE v_size WHEN 'M' THEN 20 WHEN 'L' THEN 16 WHEN 'S' THEN 14 WHEN 'XL' THEN 8 ELSE 6 END,
        CASE v_size WHEN 'M' THEN 7  WHEN 'L' THEN 5  WHEN 'S' THEN 5  WHEN 'XL' THEN 3  ELSE 2 END);
    END LOOP;
  END LOOP;

  -- 4. Floral Wrap Midi Dress
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Floral Wrap Midi Dress','floral-wrap-midi-dress',
    'A flattering wrap-style midi dress featuring an all-over tropical floral print. The adjustable self-tie waist creates a beautiful silhouette for every body type.',
    'women',2800,3800,'100% Rayon','Machine wash cold. Tumble dry low.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['Pink Floral','Blue Floral']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['XS','S','M','L','XL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'FWD-'||CASE v_color WHEN 'Pink Floral' THEN 'PNK' ELSE 'BluFlo' END||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'Pink Floral' THEN '#F9C5D1' ELSE '#87CEEB' END,
        CASE v_size WHEN 'M' THEN 18 WHEN 'L' THEN 15 WHEN 'S' THEN 14 WHEN 'XL' THEN 9 ELSE 6 END,
        CASE v_size WHEN 'M' THEN 7  WHEN 'L' THEN 5  WHEN 'S' THEN 5  WHEN 'XL' THEN 3  ELSE 2 END);
    END LOOP;
  END LOOP;

  -- 5. Bodycon Mini Dress
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Bodycon Mini Dress','bodycon-mini-dress',
    'A sleek figure-hugging mini dress in premium stretch fabric. Clean lines, minimal detailing, maximum impact. The go-to choice for Nairobi nights out.',
    'women',2200,3000,'88% Polyester, 12% Elastane','Machine wash cold. Hang to dry.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['Black','Red','Cobalt Blue','Sand']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['XS','S','M','L','XL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'BMD-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'Black' THEN '#1A1A1A' WHEN 'Red' THEN '#CC0000'
          WHEN 'Cobalt Blue' THEN '#0047AB' ELSE '#C2B280' END,
        CASE v_size WHEN 'M' THEN 20 WHEN 'L' THEN 16 WHEN 'S' THEN 14 WHEN 'XL' THEN 8 ELSE 6 END,
        CASE v_size WHEN 'M' THEN 8  WHEN 'L' THEN 6  WHEN 'S' THEN 5  WHEN 'XL' THEN 3  ELSE 2 END);
    END LOOP;
  END LOOP;

  -- 6. Wide Leg Linen Trousers
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Wide Leg Linen Trousers','wide-leg-linen-trousers',
    'Effortlessly chic wide-leg trousers in breathable linen blend. High-waisted silhouette with side pockets and a hidden zip closure. A must-have for Nairobi''s warm climate.',
    'women',2500,3400,'55% Linen, 45% Viscose','Machine wash cold. Iron while damp.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['White','Black','Olive','Tan']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['XS','S','M','L','XL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'WLT-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'White' THEN '#FFFFFF' WHEN 'Black' THEN '#1A1A1A'
          WHEN 'Olive' THEN '#808000' ELSE '#D2B48C' END,
        CASE v_size WHEN 'M' THEN 22 WHEN 'L' THEN 18 WHEN 'S' THEN 15 WHEN 'XL' THEN 10 ELSE 7 END,
        CASE v_size WHEN 'M' THEN 8  WHEN 'L' THEN 6  WHEN 'S' THEN 5  WHEN 'XL' THEN 4  ELSE 3 END);
    END LOOP;
  END LOOP;

  -- 7. Off-Shoulder Ruched Blouse
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Off-Shoulder Ruched Blouse','off-shoulder-ruched-blouse',
    'A romantic off-shoulder blouse with delicate ruching detail across the bust. Pairs perfectly with the Pleated Satin Midi Skirt or wide-leg trousers.',
    'women',1500,2000,'100% Polyester Chiffon','Hand wash cold. Drip dry.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['White','Black','Blush','Sky Blue']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['XS','S','M','L','XL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'OSB-'||CASE v_color WHEN 'Sky Blue' THEN 'Sky' ELSE LEFT(v_color,3) END||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'White' THEN '#FFFFFF' WHEN 'Black' THEN '#1A1A1A'
          WHEN 'Sky Blue' THEN '#ADD8E6' ELSE '#FFB6C1' END,
        CASE v_size WHEN 'M' THEN 18 WHEN 'L' THEN 14 WHEN 'S' THEN 13 WHEN 'XL' THEN 8 ELSE 5 END,
        CASE v_size WHEN 'M' THEN 7  WHEN 'L' THEN 5  WHEN 'S' THEN 5  WHEN 'XL' THEN 3  ELSE 2 END);
    END LOOP;
  END LOOP;

  -- 8. Pleated Satin Midi Skirt
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Pleated Satin Midi Skirt','pleated-satin-midi-skirt',
    'An elegant pleated midi skirt in luxurious satin with a high-waisted silhouette and a subtle slit at the back. Dress up with heels or dress down with sneakers.',
    'women',2000,2800,'100% Polyester Satin','Hand wash cold. Do not wring.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['Champagne','Black','Dusty Rose','Sage']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['XS','S','M','L','XL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'PSK-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'Champagne' THEN '#F7E7CE' WHEN 'Black' THEN '#1A1A1A'
          WHEN 'Dusty Rose' THEN '#D4A0A0' ELSE '#B2C5B2' END,
        CASE v_size WHEN 'M' THEN 20 WHEN 'L' THEN 16 WHEN 'S' THEN 14 WHEN 'XL' THEN 8 ELSE 6 END,
        CASE v_size WHEN 'M' THEN 8  WHEN 'L' THEN 6  WHEN 'S' THEN 5  WHEN 'XL' THEN 3  ELSE 2 END);
    END LOOP;
  END LOOP;

  -- 9. Structured Power Blazer
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Structured Power Blazer','structured-power-blazer',
    'A sharp double-breasted blazer with padded shoulders and a nipped waist. The cornerstone of a professional wardrobe. Wear open over a slip dress or buttoned as a jacket-dress.',
    'women',5500,7200,'65% Polyester, 35% Viscose',
    'Dry clean only. Store on a wide hanger to maintain shape.','active',true)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['Black','Camel','Ivory']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['XS','S','M','L','XL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'BLZ-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'Black' THEN '#1A1A1A' WHEN 'Camel' THEN '#C19A6B' ELSE '#FFFFF0' END,
        CASE v_size WHEN 'M' THEN 14 WHEN 'L' THEN 12 WHEN 'S' THEN 10 WHEN 'XL' THEN 6 ELSE 4 END,
        CASE v_size WHEN 'M' THEN 5  WHEN 'L' THEN 4  WHEN 'S' THEN 4  WHEN 'XL' THEN 2  ELSE 2 END);
    END LOOP;
  END LOOP;

  -- 10. Silk Cami & Shorts Co-ord
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Silk Cami & Shorts Co-ord','silk-cami-shorts-coord',
    'A relaxed yet polished two-piece set with a satin cami top and matching high-waisted shorts. Versatile enough for lounging, brunch, or a casual evening out.',
    'women',3800,5000,'100% Polyester Satin','Hand wash cold separately.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['Black','Champagne','Dusty Pink']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['XS','S','M','L','XL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'SCS-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'Black' THEN '#1A1A1A' WHEN 'Champagne' THEN '#F7E7CE' ELSE '#FFB6C1' END,
        CASE v_size WHEN 'M' THEN 16 WHEN 'L' THEN 13 WHEN 'S' THEN 12 WHEN 'XL' THEN 7 ELSE 5 END,
        CASE v_size WHEN 'M' THEN 6  WHEN 'L' THEN 5  WHEN 'S' THEN 4  WHEN 'XL' THEN 3  ELSE 2 END);
    END LOOP;
  END LOOP;

  --
  -- MEN (5 products)
  --

  -- 11. Slim Fit Chino Trousers
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Slim Fit Chino Trousers','slim-fit-chino-trousers',
    'Tailored slim-fit chinos with a mid-rise waist and tapered leg. A versatile trouser that bridges the gap between smart and casual — pair with an Oxford shirt or a plain tee.',
    'men',2800,3800,'98% Cotton, 2% Elastane','Machine wash cold. Iron on medium heat.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['Navy','Khaki','Black','Olive']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['S','M','L','XL','XXL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'SFC-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'Navy' THEN '#1B2A4A' WHEN 'Khaki' THEN '#C3B091'
          WHEN 'Black' THEN '#1A1A1A' ELSE '#808000' END,
        CASE v_size WHEN 'M' THEN 22 WHEN 'L' THEN 20 WHEN 'S' THEN 12 WHEN 'XL' THEN 14 ELSE 8 END,
        CASE v_size WHEN 'M' THEN 8  WHEN 'L' THEN 7  WHEN 'S' THEN 5  WHEN 'XL' THEN 5  ELSE 3 END);
    END LOOP;
  END LOOP;

  -- 12. Oxford Button-Down Shirt
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Oxford Button-Down Shirt','oxford-button-down-shirt',
    'A classic Oxford weave button-down shirt with a regular fit. The ideal smart-casual staple — tuck it in with chinos for the office or wear it open over a plain tee at the weekend.',
    'men',2200,3000,'100% Cotton Oxford Weave','Machine wash warm. Iron on high heat.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['White','Light Blue','Pink','Navy Stripe']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['S','M','L','XL','XXL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'OBS-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'White' THEN '#FFFFFF' WHEN 'Light Blue' THEN '#ADD8E6'
          WHEN 'Pink' THEN '#FFB6C1' ELSE '#1B2A4A' END,
        CASE v_size WHEN 'M' THEN 24 WHEN 'L' THEN 22 WHEN 'S' THEN 14 WHEN 'XL' THEN 16 ELSE 8 END,
        CASE v_size WHEN 'M' THEN 9  WHEN 'L' THEN 8  WHEN 'S' THEN 5  WHEN 'XL' THEN 5  ELSE 3 END);
    END LOOP;
  END LOOP;

  -- 13. Leather Bomber Jacket
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Leather Bomber Jacket','leather-bomber-jacket',
    'A premium faux-leather bomber jacket with ribbed collar, cuffs and hem. The statement outerwear piece that elevates any outfit from ordinary to extraordinary.',
    'men',6500,9000,'PU Faux Leather Outer, 100% Polyester Lining',
    'Wipe clean with a damp cloth. Do not machine wash.','active',true)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['Black','Brown']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['S','M','L','XL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'BMJ-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'Black' THEN '#1A1A1A' ELSE '#8B4513' END,
        CASE v_size WHEN 'M' THEN 12 WHEN 'L' THEN 10 WHEN 'S' THEN 7 ELSE 5 END,
        CASE v_size WHEN 'M' THEN 4  WHEN 'L' THEN 4  WHEN 'S' THEN 3 ELSE 2 END);
    END LOOP;
  END LOOP;

  -- 14. Linen Resort Shirt
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Linen Resort Shirt','linen-resort-shirt',
    'A lightweight linen shirt with a relaxed Cuban collar and short sleeves. The ultimate warm-weather shirt for Nairobi''s sunny days — breathable, stylish, and effortlessly cool.',
    'men',1900,2600,'100% Linen','Machine wash cold. Iron while damp on medium heat.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['White','Sky Blue','Sage']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['S','M','L','XL','XXL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'LNS-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'White' THEN '#FFFFFF' WHEN 'Sky Blue' THEN '#87CEEB' ELSE '#B2C5B2' END,
        CASE v_size WHEN 'M' THEN 20 WHEN 'L' THEN 18 WHEN 'S' THEN 12 WHEN 'XL' THEN 12 ELSE 7 END,
        CASE v_size WHEN 'M' THEN 7  WHEN 'L' THEN 6  WHEN 'S' THEN 5  WHEN 'XL' THEN 4  ELSE 3 END);
    END LOOP;
  END LOOP;

  -- 15. Matching Tracksuit Set
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Matching Tracksuit Set','matching-tracksuit-set',
    'A premium co-ord tracksuit set with zip-up jacket and tapered joggers. Soft fleece interior for comfort without compromising on style. Perfect for gym, travel, or weekend errands.',
    'men',4200,5800,'80% Cotton, 20% Polyester Fleece','Machine wash cold. Tumble dry low.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['Black','Charcoal','Navy']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['S','M','L','XL']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'TRS-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||v_size,
        v_size, v_color,
        CASE v_color WHEN 'Black' THEN '#1A1A1A' WHEN 'Charcoal' THEN '#36454F' ELSE '#1B2A4A' END,
        CASE v_size WHEN 'M' THEN 16 WHEN 'L' THEN 14 WHEN 'S' THEN 10 ELSE 7 END,
        CASE v_size WHEN 'M' THEN 6  WHEN 'L' THEN 5  WHEN 'S' THEN 4  ELSE 3 END);
    END LOOP;
  END LOOP;

  --
  -- CHILDREN (3 products)
  --

  -- 16. Girls Floral Sundress
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Girls Floral Sundress','girls-floral-sundress',
    'A sweet smocked sundress with an all-over floral print and adjustable shoulder straps. Easy to put on, easy to wash, and absolutely adorable.',
    'children',1800,2400,'100% Cotton','Machine wash cold. Tumble dry low.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_size IN ARRAY ARRAY['2-3Y','4-5Y','6-7Y','8-9Y','10-11Y']::text[] LOOP
    PERFORM _seed_sku(v_pid,'GFD-PNK-'||REPLACE(v_size,'-',''),v_size,'Pink Floral','#F9C5D1',
      CASE v_size WHEN '4-5Y' THEN 20 WHEN '6-7Y' THEN 22 WHEN '8-9Y' THEN 18 WHEN '2-3Y' THEN 12 ELSE 10 END,
      CASE v_size WHEN '4-5Y' THEN 8  WHEN '6-7Y' THEN 9  WHEN '8-9Y' THEN 7  WHEN '2-3Y' THEN 5  ELSE 4  END);
  END LOOP;

  -- 17. Boys Classic Polo Shirt
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Boys Classic Polo Shirt','boys-classic-polo-shirt',
    'A crisp piqué cotton polo shirt in a classic fit with ribbed collar and cuffs. School-ready and weekend-ready in equal measure.',
    'children',1200,1600,'100% Piqué Cotton','Machine wash warm.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['White','Navy','Red']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['4-5Y','6-7Y','8-9Y','10-11Y']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'BPS-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||REPLACE(v_size,'-',''),
        v_size, v_color,
        CASE v_color WHEN 'White' THEN '#FFFFFF' WHEN 'Navy' THEN '#1B2A4A' ELSE '#CC0000' END,
        CASE v_size WHEN '6-7Y' THEN 22 WHEN '8-9Y' THEN 20 WHEN '4-5Y' THEN 15 ELSE 12 END,
        CASE v_size WHEN '6-7Y' THEN 8  WHEN '8-9Y' THEN 7  WHEN '4-5Y' THEN 6  ELSE 5  END);
    END LOOP;
  END LOOP;

  -- 18. Kids Cargo Shorts
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Kids Cargo Shorts','kids-cargo-shorts',
    'Practical and stylish cargo shorts with multiple pockets, an elastic waistband, and a relaxed fit. Built for adventure.',
    'children',1400,1900,'100% Cotton Twill','Machine wash cold.','active',false)
  RETURNING id INTO v_pid;

  FOREACH v_color IN ARRAY ARRAY['Khaki','Black','Olive']::text[] LOOP
    FOREACH v_size IN ARRAY ARRAY['4-5Y','6-7Y','8-9Y','10-11Y']::text[] LOOP
      PERFORM _seed_sku(v_pid,
        'KCS-'||LEFT(REGEXP_REPLACE(v_color,'[^A-Za-z]','','g'),3)||'-'||REPLACE(v_size,'-',''),
        v_size, v_color,
        CASE v_color WHEN 'Khaki' THEN '#C3B091' WHEN 'Black' THEN '#1A1A1A' ELSE '#808000' END,
        CASE v_size WHEN '6-7Y' THEN 20 WHEN '8-9Y' THEN 18 WHEN '4-5Y' THEN 12 ELSE 10 END,
        CASE v_size WHEN '6-7Y' THEN 7  WHEN '8-9Y' THEN 6  WHEN '4-5Y' THEN 5  ELSE 4  END);
    END LOOP;
  END LOOP;

  --
  -- ACCESSORIES (7 products)
  --

  -- 19. French Beret Cap (the one in the photo)
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('French Beret Cap','french-beret-cap',
    'An effortlessly chic French-inspired beret featuring a structured body with a glossy PU leather brim and a single side button detail. The finishing touch to any sophisticated outfit.',
    'accessories',1200,1600,'Body: Wool Blend; Brim: PU Leather',
    'Spot clean only. Reshape while damp and allow to air dry.','active',true)
  RETURNING id INTO v_pid;

  PERFORM _seed_sku(v_pid,'BRT-BLK-SM','S/M','Black','#1A1A1A',35,15);
  PERFORM _seed_sku(v_pid,'BRT-BLK-LX','L/XL','Black','#1A1A1A',25,10);

  -- 20. Mini Structured Tote Bag
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Mini Structured Tote Bag','mini-structured-tote-bag',
    'A compact structured tote bag with a top handle and optional crossbody strap. Features a top zip closure and an interior slip pocket. The ideal everyday bag that goes with everything.',
    'accessories',3500,4800,'PU Faux Leather','Wipe clean with a soft damp cloth.','active',true)
  RETURNING id INTO v_pid;

  PERFORM _seed_sku(v_pid,'MTB-WHT-OS','One Size','White','#FFFFFF',18,8);
  PERFORM _seed_sku(v_pid,'MTB-BLK-OS','One Size','Black','#1A1A1A',20,9);
  PERFORM _seed_sku(v_pid,'MTB-CML-OS','One Size','Camel','#C19A6B',15,6);
  PERFORM _seed_sku(v_pid,'MTB-PNK-OS','One Size','Dusty Pink','#D4A0A0',12,5);

  -- 21. Gold Coin Pendant Necklace
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Gold Coin Pendant Necklace','gold-coin-pendant-necklace',
    'A delicate 18-carat gold-plated chain featuring a textured ancient coin pendant. Timeless, versatile, and effortlessly elegant. Seen in our lookbook paired with the Ribbed Turtleneck.',
    'accessories',800,1200,'18K Gold Plated Brass',
    'Avoid water, perfume and lotions. Store in provided pouch.','active',false)
  RETURNING id INTO v_pid;

  PERFORM _seed_sku(v_pid,'GCN-GLD-OS','One Size','Gold','#FFD700',50,20);

  -- 22. Pearl Drop Statement Earrings
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Pearl Drop Statement Earrings','pearl-drop-statement-earrings',
    'Elegant drop earrings featuring freshwater pearl accents suspended from a gold-plated hook. The perfect accent piece to elevate both casual and formal looks.',
    'accessories',650,950,'Freshwater Pearl, Gold-Plated Brass',
    'Avoid water and perfume. Store flat in the provided box.','active',false)
  RETURNING id INTO v_pid;

  PERFORM _seed_sku(v_pid,'PDE-WPL-OS','One Size','White Pearl','#F5F5F0',45,18);

  -- 23. Woven Leather Belt
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Woven Leather Belt','woven-leather-belt',
    'A hand-woven genuine leather belt with a gold-tone pin buckle. Works equally well cinched over a blazer, threaded through trouser loops, or draped over a dress.',
    'accessories',1100,1600,'Genuine Cowhide Leather','Wipe clean. Condition occasionally with leather balm.','active',false)
  RETURNING id INTO v_pid;

  PERFORM _seed_sku(v_pid,'WLB-BLK-S','S (65-75cm)','Black','#1A1A1A',20,8);
  PERFORM _seed_sku(v_pid,'WLB-BLK-M','M (75-85cm)','Black','#1A1A1A',22,9);
  PERFORM _seed_sku(v_pid,'WLB-BLK-L','L (85-95cm)','Black','#1A1A1A',18,7);
  PERFORM _seed_sku(v_pid,'WLB-BRN-M','M (75-85cm)','Brown','#8B4513',20,8);

  -- 24. Silk Square Scarf
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Silk Square Scarf','silk-square-scarf',
    'A 90×90cm silk-feel square scarf with a hand-rolled hem. Style it as a headscarf, neck tie, bag accessory, or belt. Available in four exclusive prints.',
    'accessories',950,1400,'100% Polyester Silk-Weave',
    'Hand wash cold. Iron on low heat on reverse side.','active',false)
  RETURNING id INTO v_pid;

  PERFORM _seed_sku(v_pid,'SSF-FLO-OS','One Size','Floral Print','#F9C5D1',25,10);
  PERFORM _seed_sku(v_pid,'SSF-ABS-OS','One Size','Abstract Print','#87CEEB',22,9);
  PERFORM _seed_sku(v_pid,'SSF-ANI-OS','One Size','Animal Print','#C3B091',20,8);
  PERFORM _seed_sku(v_pid,'SSF-GEO-OS','One Size','Geometric Print','#808000',18,7);

  -- 25. Quilted Crossbody Bag
  INSERT INTO products (name,slug,description,category,base_price,compare_price,material,care_instructions,status,is_featured)
  VALUES ('Quilted Crossbody Bag','quilted-crossbody-bag',
    'A chic quilted crossbody bag with a chain strap and magnetic snap closure. Compact enough for essentials, stylish enough for any occasion.',
    'accessories',4200,5800,'Quilted PU Leather, Gold-Tone Hardware',
    'Wipe clean with a dry cloth. Store stuffed with tissue paper.','active',true)
  RETURNING id INTO v_pid;

  PERFORM _seed_sku(v_pid,'QCB-BLK-OS','One Size','Black','#1A1A1A',15,6);
  PERFORM _seed_sku(v_pid,'QCB-PNK-OS','One Size','Pink','#F4A0C0',12,5);
  PERFORM _seed_sku(v_pid,'QCB-CRM-OS','One Size','Cream','#F5F0E8',10,4);

END $$;

DROP FUNCTION _seed_sku;


-- CUSTOMERS (40 real Kenyan names)

INSERT INTO customers (phone, name, email) VALUES
  ('254700111001','Amina Okonkwo','amina.okonkwo@gmail.com'),
  ('254700111002','Wanjiru Kamau','wanjiru.kamau@gmail.com'),
  ('254700111003','Fatuma Hassan','fatuma.h@outlook.com'),
  ('254700111004','Aisha Mwangi','aisha.mwangi@gmail.com'),
  ('254700111005','Zawadi Odhiambo','zawadi.odhiambo@yahoo.com'),
  ('254700111006','Imani Njoroge','imani.njoroge@gmail.com'),
  ('254700111007','Rehema Kariuki','rehema.kariuki@gmail.com'),
  ('254700111008','Makena Wambua','makena.w@gmail.com'),
  ('254700111009','Wambui Njagi','wambui.njagi@outlook.com'),
  ('254700111010','Njeri Gitahi','njeri.gitahi@gmail.com'),
  ('254700111011','Wairimu Muthoni','wairimu.m@gmail.com'),
  ('254700111012','Muthoni Ndegwa','muthoni.ndegwa@gmail.com'),
  ('254700111013','Ciku Waweru','ciku.waweru@yahoo.com'),
  ('254700111014','Mumbi Gitau','mumbi.gitau@gmail.com'),
  ('254700111015','Nyambura Kimani','nyambura.kimani@gmail.com'),
  ('254700111016','Wanjiku Ngugi','wanjiku.ngugi@gmail.com'),
  ('254700111017','Zuri Atieno','zuri.atieno@gmail.com'),
  ('254700111018','Nyota Auma','nyota.auma@outlook.com'),
  ('254700111019','Kagendo Mwenda','kagendo.mwenda@gmail.com'),
  ('254700111020','Halima Abdullahi','halima.a@gmail.com'),
  ('254700111021','Kamau Njoroge','k.njoroge@gmail.com'),
  ('254700111022','Kevin Odhiambo','kevin.odhiambo@gmail.com'),
  ('254700111023','Brian Mwangi','brian.mwangi@outlook.com'),
  ('254700111024','Otieno Achieng','otieno.achieng@gmail.com'),
  ('254700111025','David Kariuki','d.kariuki@gmail.com'),
  ('254700111026','James Mutua','james.mutua@gmail.com'),
  ('254700111027','Peter Ndegwa','p.ndegwa@gmail.com'),
  ('254700111028','Samuel Kipchoge','s.kipchoge@yahoo.com'),
  ('254700111029','Michael Waweru','mike.waweru@gmail.com'),
  ('254700111030','Daniel Gitau','d.gitau@gmail.com'),
  ('254700111031','Steve Kimani','steve.kimani@gmail.com'),
  ('254700111032','Alex Ngugi','alex.ngugi@gmail.com'),
  ('254700111033','Eric Kiprotich','eric.k@gmail.com'),
  ('254700111034','Victor Nyamweya','v.nyamweya@outlook.com'),
  ('254700111035','Grace Achieng','grace.achieng@gmail.com'),
  ('254700111036','Mercy Wangui','mercy.wangui@gmail.com'),
  ('254700111037','Faith Njagi','faith.njagi@gmail.com'),
  ('254700111038','Sharon Mwenda','sharon.mwenda@gmail.com'),
  ('254700111039','Caroline Ndung''u','caroline.n@gmail.com'),
  ('254700111040','Priscilla Ochieng','priscilla.o@gmail.com')
ON CONFLICT (phone) DO NOTHING;


-- HELPER: ORDER FACTORY (must be a real function)
CREATE OR REPLACE FUNCTION _seed_make_order(
  p_ref           text,
  p_phone         text,
  p_status        text,
  p_payment       text,
  p_subtotal      numeric,
  p_delivery_fee  numeric,
  p_discount      numeric,
  p_delivery_type text,
  p_delivery_addr text,
  p_days_ago      integer,
  p_location_id   uuid
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_oid uuid;
BEGIN
  INSERT INTO orders (
    order_ref, phone, customer_id, status, payment_method,
    subtotal, delivery_fee, discount_amount, total,
    delivery_type, delivery_address,
    location_id, cashier_name,
    paid_at, created_at, updated_at
  ) VALUES (
    p_ref, p_phone,
    (SELECT id FROM customers WHERE phone = p_phone LIMIT 1),
    p_status::order_status,
    p_payment,
    p_subtotal, p_delivery_fee, p_discount,
    p_subtotal + p_delivery_fee - p_discount,
    p_delivery_type, p_delivery_addr,
    p_location_id,
    CASE WHEN p_location_id IS NOT NULL THEN 'Wanjiru K.' ELSE NULL END,
    CASE WHEN p_status IN ('paid','delivered','shipped','processing','ready_for_pickup')
         THEN now() - (p_days_ago || ' days')::interval ELSE NULL END,
    now() - (p_days_ago || ' days')::interval,
    now() - (p_days_ago || ' days')::interval
  ) RETURNING id INTO v_oid;
  RETURN v_oid;
END;
$$;

-- ORDERS (85 orders spread over 90 days)
DO $$
DECLARE
  v_oid uuid;
  v_lid uuid;
BEGIN
  v_lid := (SELECT id FROM locations WHERE name = 'CBD Store');

  -- Online orders (delivered)

  v_oid := _seed_make_order('ESC-001','254700111001','delivered','mpesa_stk',4500,250,0,'door','Kilimani, Nairobi',85,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Pin-M'),1,4500,4500);

  v_oid := _seed_make_order('ESC-002','254700111002','delivered','mpesa_stk',3600,250,0,'door','Westlands, Nairobi',82,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='RTS-Ivo-M'),2,1800,3600);

  v_oid := _seed_make_order('ESC-003','254700111003','delivered','mpesa_stk',6700,250,0,'door','Lavington, Nairobi',80,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='SSD-Cha-S'),1,3200,3200),
    (v_oid,(SELECT id FROM skus WHERE sku_code='PSK-Cha-S'),1,2000,2000),
    (v_oid,(SELECT id FROM skus WHERE sku_code='GCN-GLD-OS'),1,800,800),
    (v_oid,(SELECT id FROM skus WHERE sku_code='PDE-WPL-OS'),1,650,650);

  v_oid := _seed_make_order('ESC-004','254700111004','delivered','mpesa_stk',5500,0,0,'pickup',NULL,78,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BLZ-Bla-M'),1,5500,5500);

  v_oid := _seed_make_order('ESC-005','254700111005','delivered','mpesa_stk',9200,250,0,'door','Runda, Nairobi',76,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Bla-L'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='MTB-BLK-OS'),1,3500,3500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='WLB-BLK-M'),1,1100,1100);

  v_oid := _seed_make_order('ESC-006','254700111006','delivered','mpesa_stk',4200,250,0,'door','Parklands, Nairobi',74,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TRS-Bla-M'),1,4200,4200);

  v_oid := _seed_make_order('ESC-007','254700111007','delivered','mpesa_stk',7700,250,0,'door','Karen, Nairobi',72,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Cre-S'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='BRT-BLK-SM'),1,1200,1200),
    (v_oid,(SELECT id FROM skus WHERE sku_code='SSF-FLO-OS'),1,950,950),
    (v_oid,(SELECT id FROM skus WHERE sku_code='GCN-GLD-OS'),1,800,800);

  v_oid := _seed_make_order('ESC-008','254700111008','delivered','mpesa_stk',2800,0,0,'pickup',NULL,70,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='FWD-PNK-M'),1,2800,2800);

  v_oid := _seed_make_order('ESC-009','254700111009','delivered','mpesa_stk',8400,250,0,'door','Kileleshwa, Nairobi',68,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='SCS-Bla-M'),1,3800,3800),
    (v_oid,(SELECT id FROM skus WHERE sku_code='WLT-Whi-M'),1,2500,2500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='OSB-Bla-M'),1,1500,1500);

  v_oid := _seed_make_order('ESC-010','254700111010','delivered','mpesa_stk',6500,250,0,'door','Muthaiga, Nairobi',65,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BMJ-Bla-L'),1,6500,6500);

  v_oid := _seed_make_order('ESC-011','254700111011','delivered','mpesa_stk',3400,250,0,'door','South C, Nairobi',63,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='RTS-Nav-M'),2,1800,3600);

  v_oid := _seed_make_order('ESC-012','254700111012','delivered','mpesa_stk',2200,0,0,'pickup',NULL,61,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BMD-Bla-S'),1,2200,2200);

  v_oid := _seed_make_order('ESC-013','254700111013','delivered','mpesa_stk',5700,250,0,'door','Loresho, Nairobi',58,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Whi-M'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='GCN-GLD-OS'),1,800,800),
    (v_oid,(SELECT id FROM skus WHERE sku_code='SSF-GEO-OS'),1,950,950);

  v_oid := _seed_make_order('ESC-014','254700111014','delivered','mpesa_stk',11200,250,0,'door','Spring Valley, Nairobi',56,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Pin-L'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Bla-M'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='MTB-PNK-OS'),1,3500,3500);

  v_oid := _seed_make_order('ESC-015','254700111015','delivered','mpesa_stk',4950,250,0,'door','Hurlingham, Nairobi',54,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BLZ-Cam-S'),1,5500,5500);

  -- Online orders (shipped)

  v_oid := _seed_make_order('ESC-016','254700111016','shipped','mpesa_stk',5250,250,0,'door','Ngong Road, Nairobi',35,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='SFC-Nav-M'),1,2800,2800),
    (v_oid,(SELECT id FROM skus WHERE sku_code='OBS-Whi-M'),1,2200,2200);

  v_oid := _seed_make_order('ESC-017','254700111017','shipped','mpesa_stk',3800,250,0,'door','Dagoretti, Nairobi',33,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='SCS-Cha-M'),1,3800,3800);

  v_oid := _seed_make_order('ESC-018','254700111018','shipped','mpesa_stk',6400,0,0,'pickup',NULL,31,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Pin-M'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='BRT-BLK-SM'),1,1200,1200),
    (v_oid,(SELECT id FROM skus WHERE sku_code='WLB-BLK-M'),1,1100,1100);

  v_oid := _seed_make_order('ESC-019','254700111019','shipped','mpesa_stk',2800,250,0,'door','Embakasi, Nairobi',29,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='FWD-BluFlo-L'),1,2800,2800);

  v_oid := _seed_make_order('ESC-020','254700111020','shipped','mpesa_stk',4700,250,0,'door','Eastleigh, Nairobi',27,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='WLT-Bla-L'),1,2500,2500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='OSB-Whi-M'),1,1500,1500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='PDE-WPL-OS'),1,650,650);

  -- Online orders (processing / recent)

  v_oid := _seed_make_order('ESC-021','254700111021','processing','mpesa_stk',9500,250,0,'door','Riverside Drive, Nairobi',14,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Cre-M'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='BLZ-Ivo-M'),1,5500,5500);

  v_oid := _seed_make_order('ESC-022','254700111022','processing','mpesa_stk',6300,250,0,'door','Langata, Nairobi',12,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BMJ-Bro-L'),1,6500,6500);

  v_oid := _seed_make_order('ESC-023','254700111023','processing','mpesa_stk',5000,0,0,'pickup',NULL,10,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='SFC-Kha-L'),1,2800,2800),
    (v_oid,(SELECT id FROM skus WHERE sku_code='OBS-Lig-M'),1,2200,2200);

  v_oid := _seed_make_order('ESC-024','254700111024','processing','mpesa_stk',4500,250,0,'door','Syokimau, Nairobi',8,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Bla-S'),1,4500,4500);

  v_oid := _seed_make_order('ESC-025','254700111025','paid','mpesa_stk',7450,250,0,'door','Thika Road, Nairobi',5,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TRS-Nav-M'),1,4200,4200),
    (v_oid,(SELECT id FROM skus WHERE sku_code='LNS-Whi-M'),1,1900,1900),
    (v_oid,(SELECT id FROM skus WHERE sku_code='WLB-BLK-M'),1,1100,1100);

  v_oid := _seed_make_order('ESC-026','254700111026','paid','mpesa_stk',3500,250,0,'door','Kikuyu, Nairobi',4,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='MTB-CML-OS'),1,3500,3500);

  v_oid := _seed_make_order('ESC-027','254700111001','paid','mpesa_stk',9700,250,0,'door','Kilimani, Nairobi',3,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Whi-L'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='SSD-Bla-M'),1,3200,3200),
    (v_oid,(SELECT id FROM skus WHERE sku_code='MTB-BLK-OS'),1,3500,3500);

  v_oid := _seed_make_order('ESC-028','254700111002','paid','mpesa_stk',2450,250,0,'door','Westlands, Nairobi',2,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='GCN-GLD-OS'),1,800,800),
    (v_oid,(SELECT id FROM skus WHERE sku_code='SSF-ABS-OS'),1,950,950),
    (v_oid,(SELECT id FROM skus WHERE sku_code='PDE-WPL-OS'),1,650,650);

  -- POS Cash Sales (CBD Store)

  v_oid := _seed_make_order('POS-ESC-001','254700111027','paid','cash',5700,0,0,'pickup',NULL,88,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Pin-S'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='BRT-BLK-SM'),1,1200,1200);

  v_oid := _seed_make_order('POS-ESC-002','254700111028','paid','cash',4200,0,0,'pickup',NULL,85,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TRS-Cha-L'),1,4200,4200);

  v_oid := _seed_make_order('POS-ESC-003','254700111029','paid','cash',3600,0,0,'pickup',NULL,82,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='RTS-Bla-M'),2,1800,3600);

  v_oid := _seed_make_order('POS-ESC-004','254700111030','paid','mpesa_c2b',6500,0,0,'pickup',NULL,79,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BMJ-Bla-M'),1,6500,6500);

  v_oid := _seed_make_order('POS-ESC-005','254700111031','paid','cash',3700,0,0,'pickup',NULL,77,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='SFC-Nav-L'),1,2800,2800),
    (v_oid,(SELECT id FROM skus WHERE sku_code='WLB-BLK-L'),1,1100,1100);

  v_oid := _seed_make_order('POS-ESC-006','254700111032','paid','mpesa_c2b',9000,0,0,'pickup',NULL,74,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Cre-M'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='SSD-Cha-M'),1,3200,3200),
    (v_oid,(SELECT id FROM skus WHERE sku_code='BRT-BLK-LX'),1,1200,1200);

  v_oid := _seed_make_order('POS-ESC-007','254700111033','paid','cash',2800,0,0,'pickup',NULL,71,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='FWD-PNK-L'),1,2800,2800);

  v_oid := _seed_make_order('POS-ESC-008','254700111034','paid','cash',5500,0,0,'pickup',NULL,68,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BLZ-Cam-M'),1,5500,5500);

  v_oid := _seed_make_order('POS-ESC-009','254700111035','paid','mpesa_c2b',4700,0,0,'pickup',NULL,65,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='MTB-WHT-OS'),1,3500,3500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='SSF-ANI-OS'),1,950,950);

  v_oid := _seed_make_order('POS-ESC-010','254700111036','paid','cash',1800,0,0,'pickup',NULL,62,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='GFD-PNK-45Y'),1,1800,1800);

  v_oid := _seed_make_order('POS-ESC-011','254700111037','paid','cash',7200,0,0,'pickup',NULL,59,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='QCB-BLK-OS'),1,4200,4200),
    (v_oid,(SELECT id FROM skus WHERE sku_code='SCS-Cha-S'),1,3800,3800);

  v_oid := _seed_make_order('POS-ESC-012','254700111038','paid','mpesa_c2b',4500,0,0,'pickup',NULL,56,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Whi-S'),1,4500,4500);

  v_oid := _seed_make_order('POS-ESC-013','254700111039','paid','cash',3100,0,0,'pickup',NULL,52,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='WLT-Oli-M'),1,2500,2500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='WLB-BRN-M'),1,1100,1100);

  v_oid := _seed_make_order('POS-ESC-014','254700111040','paid','cash',9200,0,0,'pickup',NULL,49,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Bla-M'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='BLZ-Bla-S'),1,5500,5500);

  v_oid := _seed_make_order('POS-ESC-015','254700111001','paid','mpesa_c2b',6200,0,0,'pickup',NULL,45,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='SSD-For-M'),1,3200,3200),
    (v_oid,(SELECT id FROM skus WHERE sku_code='PSK-Bla-M'),1,2000,2000),
    (v_oid,(SELECT id FROM skus WHERE sku_code='GCN-GLD-OS'),1,800,800);

  v_oid := _seed_make_order('POS-ESC-016','254700111003','paid','cash',3400,0,0,'pickup',NULL,41,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BMD-Red-M'),1,2200,2200),
    (v_oid,(SELECT id FROM skus WHERE sku_code='WLB-BLK-S'),1,1100,1100);

  v_oid := _seed_make_order('POS-ESC-017','254700111005','paid','cash',5450,0,0,'pickup',NULL,38,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Pin-XS'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='BRT-BLK-LX'),1,1200,1200);

  v_oid := _seed_make_order('POS-ESC-018','254700111008','paid','mpesa_c2b',8000,0,0,'pickup',NULL,34,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='QCB-PNK-OS'),1,4200,4200),
    (v_oid,(SELECT id FROM skus WHERE sku_code='MTB-PNK-OS'),1,3500,3500);

  v_oid := _seed_make_order('POS-ESC-019','254700111010','paid','cash',2800,0,0,'pickup',NULL,30,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='SFC-Bla-M'),1,2800,2800);

  v_oid := _seed_make_order('POS-ESC-020','254700111012','paid','cash',4200,0,0,'pickup',NULL,26,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TRS-Bla-L'),1,4200,4200);

  v_oid := _seed_make_order('POS-ESC-021','254700111014','paid','mpesa_c2b',7700,0,0,'pickup',NULL,22,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Cre-L'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='SSD-Bur-M'),1,3200,3200);

  v_oid := _seed_make_order('POS-ESC-022','254700111016','paid','cash',2550,0,0,'pickup',NULL,18,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='GFD-PNK-67Y'),1,1800,1800),
    (v_oid,(SELECT id FROM skus WHERE sku_code='GCN-GLD-OS'),1,800,800);

  v_oid := _seed_make_order('POS-ESC-023','254700111018','paid','cash',5300,0,0,'pickup',NULL,15,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BLZ-Bla-M'),1,5500,5500);

  v_oid := _seed_make_order('POS-ESC-024','254700111020','paid','mpesa_c2b',3800,0,0,'pickup',NULL,11,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='SCS-Dus-S'),1,3800,3800);

  v_oid := _seed_make_order('POS-ESC-025','254700111022','paid','cash',6200,0,0,'pickup',NULL,7,v_lid);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BMJ-Bla-S'),1,6500,6500);

  -- Cancelled / payment_failed orders

  v_oid := _seed_make_order('ESC-X001','254700111025','cancelled','mpesa_stk',4500,250,0,'door','Ruaka, Nairobi',50,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Bla-XL'),1,4500,4500);

  v_oid := _seed_make_order('ESC-X002','254700111030','payment_failed','mpesa_stk',2200,250,0,'door','Rongai, Nairobi',40,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BMD-Cob-M'),1,2200,2200);

  v_oid := _seed_make_order('ESC-X003','254700111035','cancelled','mpesa_stk',5500,0,0,'pickup',NULL,22,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BLZ-Cam-L'),1,5500,5500);

  -- Children / accessories focused orders

  v_oid := _seed_make_order('ESC-029','254700111036','delivered','mpesa_stk',5400,250,0,'door','Athi River, Nairobi',60,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='GFD-PNK-89Y'),1,1800,1800),
    (v_oid,(SELECT id FROM skus WHERE sku_code='BPS-Whi-67Y'),2,1200,2400),
    (v_oid,(SELECT id FROM skus WHERE sku_code='KCS-Kha-67Y'),1,1400,1400);

  v_oid := _seed_make_order('ESC-030','254700111037','delivered','mpesa_stk',3600,250,0,'door','Kitengela, Nairobi',55,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='BPS-Nav-89Y'),2,1200,2400),
    (v_oid,(SELECT id FROM skus WHERE sku_code='KCS-Bla-89Y'),1,1400,1400);

  v_oid := _seed_make_order('ESC-031','254700111038','shipped','mpesa_stk',6400,250,0,'door','Kahawa, Nairobi',25,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='QCB-CRM-OS'),1,4200,4200),
    (v_oid,(SELECT id FROM skus WHERE sku_code='GCN-GLD-OS'),1,800,800),
    (v_oid,(SELECT id FROM skus WHERE sku_code='SSF-FLO-OS'),1,950,950),
    (v_oid,(SELECT id FROM skus WHERE sku_code='PDE-WPL-OS'),1,650,650);

  v_oid := _seed_make_order('ESC-032','254700111039','paid','mpesa_stk',8650,250,0,'door','Donholm, Nairobi',3,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Pin-M'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='PSK-Dus-M'),1,2000,2000),
    (v_oid,(SELECT id FROM skus WHERE sku_code='OSB-Blu-M'),1,1500,1500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='GCN-GLD-OS'),1,800,800);

  v_oid := _seed_make_order('ESC-033','254700111040','paid','mpesa_stk',11950,0,0,'pickup',NULL,1,NULL);
  INSERT INTO order_items (order_id,sku_id,quantity,unit_price,subtotal) VALUES
    (v_oid,(SELECT id FROM skus WHERE sku_code='TWS-Bla-L'),1,4500,4500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='BLZ-Bla-L'),1,5500,5500),
    (v_oid,(SELECT id FROM skus WHERE sku_code='MTB-BLK-OS'),1,3500,3500);

END $$;

DROP FUNCTION _seed_make_order;


-- MPESA TRANSACTIONS (for all paid online orders)

DO $$
DECLARE
  r        RECORD;
  v_receipt text;
  v_idx    integer := 1;
BEGIN
  FOR r IN
    SELECT o.id, o.total, o.phone, o.created_at
    FROM orders o
    WHERE o.payment_method = 'mpesa_stk'
      AND o.status IN ('paid','delivered','shipped','processing')
    ORDER BY o.created_at
  LOOP
    v_receipt := 'QJK' || LPAD(v_idx::text, 8, '0');
    INSERT INTO mpesa_transactions (
      order_id, checkout_request_id, merchant_request_id,
      amount, phone_number, status,
      mpesa_receipt_number, amount_paid, transaction_date,
      created_at
    ) VALUES (
      r.id,
      'ws_CO_' || LPAD(v_idx::text, 15, '0'),
      'MP' || LPAD(v_idx::text, 10, '0'),
      r.total, r.phone, 'completed',
      v_receipt, r.total,
      to_char(r.created_at, 'YYYYMMDDHH24MISS'),
      r.created_at
    )
    ON CONFLICT DO NOTHING;
    v_idx := v_idx + 1;
  END LOOP;
END $$;


-- PROMOTIONS

INSERT INTO promotions (name, code, type, value, min_spend, max_uses, active, expires_at) VALUES
  ('Opening Week Discount',         'WELCOME10', 'percentage',   10,  2000, 100,  true, now() + interval '60 days'),
  ('Free Delivery on Orders over 5K', NULL,      'free_shipping', 1,  5000, NULL, true, NULL),
  ('Flat KES 500 Off',              'SAVE500',   'fixed_amount', 500, 3000, 50,   true, now() + interval '30 days')
ON CONFLICT DO NOTHING;
