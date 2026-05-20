-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 008: Promotions engine
--
-- promotions table: rules (percentage, fixed, free_shipping) with optional
-- promo codes, minimum spend, and usage caps.
-- Both the online checkout route and the POS API run carts through
-- applyDiscounts() before finalising totals.
-- ─────────────────────────────────────────────────────────────────────────────

create table promotions (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  code        text unique,             -- null = auto-applied; set = requires code entry
  type        text not null
    check (type in ('percentage', 'fixed_amount', 'free_shipping')),
  value       numeric(10,2) not null check (value > 0),
  min_spend   numeric(10,2),           -- null = no minimum
  max_uses    integer,                 -- null = unlimited
  uses_count  integer not null default 0,
  active      boolean not null default true,
  starts_at   timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index promotions_code_idx   on promotions(code)   where code is not null;
create index promotions_active_idx on promotions(active) where active = true;

alter table promotions enable row level security;
create policy "service_role_all_promotions" on promotions
  using (auth.role() = 'service_role');
-- Storefront can read active promotions for display (e.g. banner "10% off today!")
create policy "public_read_active_promotions" on promotions
  for select using (
    active = true
    and (starts_at  is null or starts_at  <= now())
    and (expires_at is null or expires_at  > now())
  );

-- Wire FK from orders.promotion_id now that the table exists
alter table orders
  add constraint orders_promotion_id_fkey
  foreign key (promotion_id) references promotions(id) on delete set null;

-- Helper: atomically increment uses_count and return the promotion if valid
create or replace function redeem_promotion(p_promotion_id uuid)
returns boolean    -- true = success, false = already capped
language plpgsql
security definer
as $$
declare
  v_max_uses  integer;
  v_uses      integer;
begin
  select max_uses, uses_count
    into v_max_uses, v_uses
    from promotions
   where id = p_promotion_id
     for update;

  if not found then return false; end if;
  if v_max_uses is not null and v_uses >= v_max_uses then return false; end if;

  update promotions set uses_count = uses_count + 1 where id = p_promotion_id;
  return true;
end;
$$;
