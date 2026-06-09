--
-- Migration 006: Multi-location inventory
--
-- Replaces the single skus.stock_quantity integer with per-location tracking.
-- skus.stock_quantity is kept as a cached aggregate (sum of all locations),
-- updated automatically by a trigger. All existing code that reads
-- stock_quantity continues to work with no changes.
--
-- New tables: locations, inventory_levels
-- New RPCs : pos_checkout, increment_location_stock
-- Updated RPC: checkout_and_reserve_stock (online) - now locks inventory_levels
-- Updated RPC: increment_sku_stock - now updates inventory_levels
--

-- 1. Locations

create table locations (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  type       text not null default 'store' check (type in ('store', 'warehouse')),
  address    text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger locations_updated_at before update on locations
  for each row execute function set_updated_at();

insert into locations (name, type, address) values
  ('Main Warehouse', 'warehouse', 'Nairobi, Kenya'),
  ('CBD Store',      'store',     'Nairobi CBD, Kenya');

alter table locations enable row level security;
create policy "service_role_all_locations" on locations
  using (auth.role() = 'service_role');
create policy "public_read_active_locations" on locations
  for select using (is_active = true);

-- 2. Inventory levels

create table inventory_levels (
  id           uuid primary key default uuid_generate_v4(),
  sku_id       uuid not null references skus(id) on delete cascade,
  location_id  uuid not null references locations(id) on delete cascade,
  quantity     integer not null default 0 check (quantity >= 0),
  updated_at   timestamptz not null default now(),
  unique (sku_id, location_id)
);

create index inventory_levels_sku_id_idx      on inventory_levels(sku_id);
create index inventory_levels_location_id_idx on inventory_levels(location_id);

create trigger inventory_levels_updated_at before update on inventory_levels
  for each row execute function set_updated_at();

alter table inventory_levels enable row level security;
create policy "service_role_all_inventory_levels" on inventory_levels
  using (auth.role() = 'service_role');

-- 3. Migrate existing stock → Main Warehouse

insert into inventory_levels (sku_id, location_id, quantity)
select s.id, l.id, s.stock_quantity
from   skus s
cross  join locations l
where  l.name = 'Main Warehouse';

-- Seed CBD Store rows at zero (stock gets transferred manually)
insert into inventory_levels (sku_id, location_id, quantity)
select s.id, l.id, 0
from   skus s
cross  join locations l
where  l.name = 'CBD Store';

-- 4. Trigger: keep skus.stock_quantity as aggregate of all locations

create or replace function sync_sku_stock_quantity()
returns trigger
language plpgsql
as $$
begin
  update skus
  set    stock_quantity = (
           select coalesce(sum(quantity), 0)
           from   inventory_levels
           where  sku_id = coalesce(new.sku_id, old.sku_id)
         )
  where  id = coalesce(new.sku_id, old.sku_id);
  return coalesce(new, old);
end;
$$;

create trigger inventory_levels_sync_sku_stock
after insert or update or delete on inventory_levels
for each row execute function sync_sku_stock_quantity();

-- 5. increment_location_stock - location-aware stock restore

create or replace function increment_location_stock(
  p_sku_id      uuid,
  p_location_id uuid,
  p_delta       integer   -- positive = add, negative = deduct
)
returns void
language plpgsql
security definer
as $$
begin
  insert into inventory_levels (sku_id, location_id, quantity)
  values (p_sku_id, p_location_id, greatest(0, p_delta))
  on conflict (sku_id, location_id)
  do update set quantity = greatest(0, inventory_levels.quantity + p_delta);
  -- skus.stock_quantity updated automatically by trigger
end;
$$;

-- 6. Update increment_sku_stock to also fix inventory_levels
-- Online payment-failure restoration always targets Main Warehouse.

create or replace function increment_sku_stock(
  p_sku_id uuid,
  p_delta   integer
)
returns void
language plpgsql
security definer
as $$
declare
  v_warehouse_id uuid;
begin
  select id into v_warehouse_id from locations where name = 'Main Warehouse';

  if v_warehouse_id is null then
    raise exception 'Main Warehouse location not found';
  end if;

  -- Update inventory_levels; trigger keeps skus.stock_quantity in sync
  insert into inventory_levels (sku_id, location_id, quantity)
  values (p_sku_id, v_warehouse_id, greatest(0, p_delta))
  on conflict (sku_id, location_id)
  do update set quantity = greatest(0, inventory_levels.quantity + p_delta);
end;
$$;

-- 7. Update checkout_and_reserve_stock to lock inventory_levels
-- Online checkout always reserves from Main Warehouse.

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
  v_order_id     uuid;
  v_warehouse_id uuid;
  v_item         jsonb;
  v_sku_id       uuid;
  v_quantity     integer;
  v_price        numeric;
  v_stock        integer;
begin
  select id into v_warehouse_id from locations where name = 'Main Warehouse';

  -- 1. Lock inventory_levels rows FOR UPDATE (prevents oversell)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_sku_id   := (v_item->>'sku_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    select quantity
      into v_stock
      from inventory_levels
     where sku_id = v_sku_id and location_id = v_warehouse_id
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

  -- 2. Create order
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

  -- 3. Insert items, deduct inventory_levels, log
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_sku_id   := (v_item->>'sku_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_price    := (v_item->>'unit_price')::numeric;

    insert into order_items (order_id, sku_id, quantity, unit_price, subtotal)
    values (v_order_id, v_sku_id, v_quantity, v_price, v_price * v_quantity);

    update inventory_levels
       set quantity = quantity - v_quantity
     where sku_id = v_sku_id and location_id = v_warehouse_id;
    -- trigger syncs skus.stock_quantity automatically

    insert into inventory_log (sku_id, delta, reason, reference)
    values (v_sku_id, -v_quantity, 'sale', v_order_id::text);
  end loop;

  return jsonb_build_object('order_id', v_order_id, 'order_ref', p_order_ref);
end;
$$;

-- 8. pos_checkout RPC - location-aware, atomic

create or replace function pos_checkout(
  p_order_ref       text,
  p_phone           text,
  p_location_id     uuid,
  p_payment_method  text,  -- 'cash' | 'mpesa_stk' | 'mpesa_c2b'
  p_cashier_name    text,
  p_subtotal        numeric,
  p_discount_amount numeric,
  p_total           numeric,
  p_notes           text,
  p_items           jsonb   -- [{ sku_id, quantity, unit_price }]
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

  -- 3. Create order
  -- Cash/STK = immediately paid; C2B = pending_payment until webhook fires
  insert into orders (
    order_ref, phone, customer_id,
    cashier_name, status, payment_method,
    subtotal, delivery_fee, discount_amount, total,
    delivery_type, notes,
    paid_at
  ) values (
    p_order_ref, p_phone, v_customer_id,
    p_cashier_name,
    case when p_payment_method in ('cash', 'mpesa_stk') then 'paid'
         else 'pending_payment' end,
    p_payment_method,
    p_subtotal, 0, p_discount_amount, p_total,
    'pickup', p_notes,
    case when p_payment_method in ('cash', 'mpesa_stk') then now() else null end
  )
  returning id into v_order_id;

  -- 4. Insert items, deduct inventory, log
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
    -- trigger keeps skus.stock_quantity in sync

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
