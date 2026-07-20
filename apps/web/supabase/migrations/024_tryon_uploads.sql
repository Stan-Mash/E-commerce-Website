-- Virtual try-on ("See it on you") tracking table. The actual photo/result
-- files live in a private Supabase Storage bucket (tryon-uploads, created
-- lazily on first upload — see api/tryon/route.ts, same pattern as the
-- product-images bucket in api/admin/products/upload-image/route.ts).
-- This table is what the 24h cleanup cron and "delete my photos now" button
-- operate against; service-role only, never exposed to the public API.

create table if not exists tryon_uploads (
  id                  uuid primary key default uuid_generate_v4(),
  session_id          text not null,
  product_id          uuid references products(id) on delete cascade,
  upload_path         text not null,          -- path within the tryon-uploads bucket
  result_path         text,                    -- set once generation completes
  provider_job_id     text,
  status              text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  created_at          timestamptz not null default now(),
  expires_at          timestamptz not null default (now() + interval '24 hours')
);

create index if not exists tryon_uploads_session_idx on tryon_uploads(session_id);
create index if not exists tryon_uploads_expires_idx on tryon_uploads(expires_at);

alter table tryon_uploads enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'tryon_uploads' and policyname = 'service_role_all_tryon') then
    create policy "service_role_all_tryon" on tryon_uploads using (auth.role() = 'service_role');
  end if;
end $$;
