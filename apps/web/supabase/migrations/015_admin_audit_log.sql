-- Admin audit log: who changed what, when. Safe to run multiple times.
create table if not exists admin_audit_log (
  id          uuid primary key default uuid_generate_v4(),
  actor       text not null default 'admin',
  action      text not null,            -- e.g. 'stock.adjust', 'order.status', 'return.refund'
  entity      text,                     -- e.g. 'sku', 'order', 'return', 'product'
  entity_id   text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on admin_audit_log(created_at desc);

alter table admin_audit_log enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'admin_audit_log' and policyname = 'service_role_all_audit') then
    create policy "service_role_all_audit" on admin_audit_log using (auth.role() = 'service_role');
  end if;
end $$;
