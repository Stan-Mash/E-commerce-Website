-- "Equinox Edit" private-preview reserve-access capture (homepage SaleBand).
-- Separate from newsletter_subscribers since this is a one-time event
-- waitlist, not a recurring marketing list.

create table if not exists equinox_reservations (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null,
  phone       text,
  created_at  timestamptz not null default now()
);
alter table equinox_reservations enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'equinox_reservations' and policyname = 'service_role_all_equinox') then
    create policy "service_role_all_equinox" on equinox_reservations using (auth.role() = 'service_role');
  end if;
end $$;
