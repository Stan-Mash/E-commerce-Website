--
-- Migration 019: pos_checkout v2
--
-- The API was already passing p_shift_id and p_initial_status to pos_checkout,
-- but the function signature (from migration 006) didn't include those params.
-- Postgres rejects calls with unknown named arguments, which is why every POS
-- sale showed "Failed to create order".
--
-- Also fixes:
--   - location_id was never written to the order row
--   - STK Push was marked 'paid' immediately; p_initial_status gives the
--     caller control (cash → paid, mpesa_stk/c2b → pending_payment)
--

-- 1. Add shift_id to orders for shift reconciliation / cash drawer reports

alter table orders
  add column if not exists shift_id uuid references shifts(id) on delete set null;

create index if not exists orders_shift_id_idx on orders(shift_id);

-- 2. Replace pos_checkout with the updated signature

create or replace function pos_checkout(
  p_order_ref       text,
  p_phone           text,
  p_location_id     uuid,
  p_shift_id        uuid,        -- link to open shift
  p_payment_method  text,        -- 'cash' | 'mpesa_stk' | 'mpesa_c2b'
  p_initial_status  text,        -- 'paid' for cash, 'pending_payment' for mpesa
  p_cashier_name    text,
  p_subtotal        numeric,
  p_discount_amount numeric,
  p_total           numeric,
  p_notes           text,
  p_items           jsonb        -- [{ sku_id, quantity, unit_price }]
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_id    uuid;
  v_customer_id uuid;
  v_item        jsonb;
  v_sku_id      uuid;
  v_quantity    integer;
  v_price       numeric;
  v_stock       integer;
begin
  -- 1. Upsert customer by normalised phone (omnichannel profile)
  if p_phone is not null and length(trim(p_phone)) > 0 then
    insert into customers (phone)
    values (p_phone)
    on conflict (phone) do update set updated_at = now()
    returning id into v_customer_id;
  end if;

  -- 2. Lock inventory_levels rows and verify stock
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_sku_id   := (v_item->>'sku_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    select quantity into v_stock
    from   inventory_levels
    where  sku_id = v_sku_id and location_id = p_location_id
    for update;

    if not found then
      raise exception 'SKU % has no inventory record at this location', v_sku_id
        using errcode = 'P0002';
    end if;

    if v_stock < v_quantity then
      raise exception 'Insufficient stock for SKU % at this location: have %, need %',
        v_sku_id, v_stock, v_quantity
        using errcode = 'P0001';
    end if;
  end loop;

  -- 3. Create the order
  insert into orders (
    order_ref, phone, customer_id,
    cashier_name, shift_id, location_id,
    status, payment_method,
    subtotal, delivery_fee, discount_amount, total,
    delivery_type, notes, paid_at
  ) values (
    p_order_ref, p_phone, v_customer_id,
    p_cashier_name, p_shift_id, p_location_id,
    p_initial_status, p_payment_method,
    p_subtotal, 0, p_discount_amount, p_total,
    'pickup', p_notes,
    case when p_initial_status = 'paid' then now() else null end
  )
  returning id into v_order_id;

  -- 4. Insert order items, deduct location inventory, log
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_sku_id   := (v_item->>'sku_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_price    := (v_item->>'unit_price')::numeric;

    insert into order_items (order_id, sku_id, quantity, unit_price, subtotal)
    values (v_order_id, v_sku_id, v_quantity, v_price, v_price * v_quantity);

    update inventory_levels
       set quantity = quantity - v_quantity
     where sku_id = v_sku_id and location_id = p_location_id;
    -- sync_sku_stock_quantity trigger keeps skus.stock_quantity in sync

    insert into inventory_log (sku_id, delta, reason, reference)
    values (v_sku_id, -v_quantity, 'pos_sale', v_order_id::text);
  end loop;

  return jsonb_build_object(
    'order_id',    v_order_id,
    'order_ref',   p_order_ref,
    'customer_id', v_customer_id
  );
end;
$$;
