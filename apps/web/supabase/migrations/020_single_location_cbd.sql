--
-- Migration 020: Consolidate to a single CBD Store location
--
-- Removes the zero-stock "CBD Store" entry, renames "Main Warehouse"
-- (which holds all stock) to "CBD Store" with the correct address,
-- and updates all RPCs so nothing hardcodes "Main Warehouse" anymore.
--

-- 1. Remove the old zero-stock CBD Store (inventory_levels cascade-deleted)
delete from locations where name = 'CBD Store';

-- 2. Rename Main Warehouse → CBD Store with correct type and address
update locations
set
  name    = 'CBD Store',
  type    = 'store',
  address = 'Shop 35, 4th Floor, Wing B, Stanbank House, Moi Avenue, Nairobi CBD'
where name = 'Main Warehouse';

-- 3. Update checkout_and_reserve_stock (online orders)
--    Was hardcoded to 'Main Warehouse'; now uses type = 'store' dynamically.
create or replace function checkout_and_reserve_stock(
  p_order_ref        text,
  p_phone            text,
  p_subtotal         numeric,
  p_delivery_fee     numeric,
  p_total            numeric,
  p_delivery_type    text,
  p_delivery_address text,
  p_notes            text,
  p_items            jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_id    uuid;
  v_location_id uuid;
  v_item        jsonb;
  v_sku_id      uuid;
  v_quantity    integer;
  v_price       numeric;
  v_stock       integer;
begin
  select id into v_location_id from locations where type = 'store' limit 1;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_sku_id   := (v_item->>'sku_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    select quantity into v_stock
    from   inventory_levels
    where  sku_id = v_sku_id and location_id = v_location_id
    for update;

    if not found then
      raise exception 'SKU % not found', v_sku_id
        using errcode = 'P0002';
    end if;

    if v_stock < v_quantity then
      raise exception 'Insufficient stock for SKU %: have %, need %',
        v_sku_id, v_stock, v_quantity
        using errcode = 'P0001';
    end if;
  end loop;

  insert into orders (
    order_ref, phone, status,
    subtotal, delivery_fee, total,
    delivery_type, delivery_address, notes
  ) values (
    p_order_ref, p_phone, 'pending_payment',
    p_subtotal, p_delivery_fee, p_total,
    p_delivery_type, p_delivery_address, p_notes
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_sku_id   := (v_item->>'sku_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_price    := (v_item->>'unit_price')::numeric;

    insert into order_items (order_id, sku_id, quantity, unit_price, subtotal)
    values (v_order_id, v_sku_id, v_quantity, v_price, v_price * v_quantity);

    update inventory_levels
       set quantity = quantity - v_quantity
     where sku_id = v_sku_id and location_id = v_location_id;

    insert into inventory_log (sku_id, delta, reason, reference)
    values (v_sku_id, -v_quantity, 'sale', v_order_id::text);
  end loop;

  return jsonb_build_object('order_id', v_order_id, 'order_ref', p_order_ref);
end;
$$;

-- 4. Update increment_sku_stock (payment-failure stock restore)
--    Was hardcoded to 'Main Warehouse'.
create or replace function increment_sku_stock(
  p_sku_id uuid,
  p_delta   integer
)
returns void
language plpgsql
security definer
as $$
declare
  v_location_id uuid;
begin
  select id into v_location_id from locations where type = 'store' limit 1;

  if v_location_id is null then
    raise exception 'No store location found';
  end if;

  insert into inventory_levels (sku_id, location_id, quantity)
  values (p_sku_id, v_location_id, greatest(0, p_delta))
  on conflict (sku_id, location_id)
  do update set quantity = greatest(0, inventory_levels.quantity + p_delta);
end;
$$;
