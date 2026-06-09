-- checkout_and_reserve_stock RPC
-- Called by the checkout API instead of doing SELECT + INSERT
-- separately. Runs entirely inside one transaction with row-level
-- locks so two concurrent checkouts can never oversell the same SKU.

create or replace function checkout_and_reserve_stock(
  p_order_ref        text,
  p_phone            text,
  p_subtotal         numeric,
  p_delivery_fee     numeric,
  p_total            numeric,
  p_delivery_type    text,
  p_delivery_address text,
  p_notes            text,
  p_items            jsonb   -- [{ "sku_id": uuid, "quantity": int, "unit_price": numeric }]
)
returns jsonb
language plpgsql
security definer   -- runs as DB owner so service_role policy is satisfied
as $$
declare
  v_order_id  uuid;
  v_item      jsonb;
  v_sku_id    uuid;
  v_quantity  integer;
  v_price     numeric;
  v_stock     integer;
begin
  -- 1. Lock all SKU rows FOR UPDATE (blocks concurrent checkouts)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_sku_id   := (v_item->>'sku_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    select stock_quantity
      into v_stock
      from skus
     where id = v_sku_id
       for update;                   -- row-level lock acquired here

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

  -- 2. Create the order
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

  -- 3. Insert order items & decrement stock atomically
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_sku_id   := (v_item->>'sku_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_price    := (v_item->>'unit_price')::numeric;

    insert into order_items (order_id, sku_id, quantity, unit_price, subtotal)
    values (v_order_id, v_sku_id, v_quantity, v_price, v_price * v_quantity);

    update skus
       set stock_quantity = stock_quantity - v_quantity
     where id = v_sku_id;

    insert into inventory_log (sku_id, delta, reason, reference)
    values (v_sku_id, -v_quantity, 'sale', v_order_id::text);
  end loop;

  return jsonb_build_object('order_id', v_order_id, 'order_ref', p_order_ref);
end;
$$;
