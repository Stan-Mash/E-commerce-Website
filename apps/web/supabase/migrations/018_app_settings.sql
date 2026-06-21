-- Generic key-value store for admin-configurable settings (store name, fees, etc.)
-- Safe to run multiple times.
create table if not exists app_settings (
  namespace   text not null default 'store',
  key         text not null,
  value       text not null default '',
  updated_at  timestamptz not null default now(),
  primary key (namespace, key)
);

alter table app_settings enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'app_settings' and policyname = 'service_role_all_settings'
  ) then
    create policy "service_role_all_settings" on app_settings
      using (auth.role() = 'service_role');
  end if;
end $$;
