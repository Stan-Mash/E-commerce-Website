-- 021: Contact-form storage + product_images RLS regression fix.

-- 1. Contact form submissions (read from Supabase dashboard / future admin UI).
create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text not null,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'contact_messages' and policyname = 'service_role_all_contact_messages'
  ) then
    create policy "service_role_all_contact_messages" on contact_messages
      using (auth.role() = 'service_role');
  end if;
end $$;

-- 2. RLS regression fix: migration 011 added "public_read_product_images"
-- with `using (true)`, which re-exposed images of draft/archived products.
-- Policies OR together, so this permissive policy overrode the scoped
-- "public_read_images" policy from migrations 004/012. Drop it — the scoped
-- policy (active + coming_soon products only) remains in force.
drop policy if exists "public_read_product_images" on product_images;
