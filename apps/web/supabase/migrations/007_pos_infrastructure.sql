--
-- Migration 007: POS infrastructure
--
-- Adds columns to orders for payment method, cashier attribution, discount
-- tracking, and location. Creates shifts (cash float) and c2b_payments
-- (Safaricom C2B callback matching) tables.
--

-- orders: new columns

alter table orders
  add column if not exists payment_method text
    check (payment_method in ('mpesa_stk', 'mpesa_c2b', 'cash', 'card'))
    default 'mpesa_stk';

alter table orders
  add column if not exists cashier_name text;          -- display name of staff member

alter table orders
  add column if not exists discount_amount numeric(10,2) not null default 0;

alter table orders
  add column if not exists promotion_id uuid;          -- FK wired in migration 008

alter table orders
  add column if not exists location_id uuid
    references locations(id) on delete set null;       -- null = online order

create index if not exists orders_payment_method_idx on orders(payment_method);
create index if not exists orders_location_id_idx    on orders(location_id);

-- shifts

create table shifts (
  id             uuid primary key default uuid_generate_v4(),
  cashier_name   text not null,
  location_id    uuid not null references locations(id) on delete cascade,
  opening_float  numeric(10,2) not null default 0,
  closing_float  numeric(10,2),
  expected_float numeric(10,2),  -- computed on close: opening_float + cash_sales
  variance       numeric(10,2),  -- closing_float - expected_float
  status         text not null default 'open'
    check (status in ('open', 'closed')),
  opened_at      timestamptz not null default now(),
  closed_at      timestamptz
);

create index shifts_status_idx      on shifts(status);
create index shifts_location_id_idx on shifts(location_id);

alter table shifts enable row level security;
create policy "service_role_all_shifts" on shifts
  using (auth.role() = 'service_role');

-- c2b_payments
-- Holds pending POS orders waiting for Safaricom C2B confirmation.
-- BillRefNumber in the Safaricom payload maps to order_ref.

create table c2b_payments (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references orders(id) on delete cascade,
  order_ref       text not null unique,
  expected_amount numeric(10,2) not null,
  actual_amount   numeric(10,2),
  phone           text,
  mpesa_receipt   text,
  status          text not null default 'pending'
    check (status in ('pending', 'matched', 'overpaid', 'underpaid', 'expired')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index c2b_payments_order_ref_idx on c2b_payments(order_ref);
create index c2b_payments_status_idx    on c2b_payments(status);

alter table c2b_payments enable row level security;
create policy "service_role_all_c2b_payments" on c2b_payments
  using (auth.role() = 'service_role');

create trigger c2b_payments_updated_at before update on c2b_payments
  for each row execute function set_updated_at();

-- Enable Supabase Realtime on orders (for C2B live screen)
-- The POS page subscribes to order status changes so the cashier sees
-- "Payment Received" the instant Safaricom's webhook fires.
alter publication supabase_realtime add table orders;
