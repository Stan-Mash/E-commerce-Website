-- Pickup points (Pickup Mtaani-style agent locations). Safe to run multiple times.
create table if not exists pickup_points (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  area        text not null,             -- e.g. 'CBD', 'Westlands', 'Kasarani'
  address     text,
  phone       text,
  fee         integer not null default 0 check (fee >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists pickup_points_area_idx on pickup_points(area);

alter table pickup_points enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'pickup_points' and policyname = 'service_role_all_pickup_points') then
    create policy "service_role_all_pickup_points" on pickup_points using (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'pickup_points' and policyname = 'anon_read_active_pickup_points') then
    create policy "anon_read_active_pickup_points" on pickup_points for select using (active = true);
  end if;
end $$;

-- Where the order is collected from.
alter table orders add column if not exists pickup_point_id uuid references pickup_points(id);
