-- 013_product_reviews.sql
-- Customer product reviews & ratings.
--
-- Run in: Supabase Dashboard → SQL Editor

create table if not exists product_reviews (
  id           uuid primary key default uuid_generate_v4(),
  product_id   uuid not null references products(id) on delete cascade,
  author_name  text not null,
  rating       integer not null check (rating between 1 and 5),
  title        text,
  body         text,
  -- Reviews are held until an admin approves them, to prevent spam/abuse.
  is_approved  boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists product_reviews_product_idx
  on product_reviews(product_id);
create index if not exists product_reviews_approved_idx
  on product_reviews(product_id, is_approved);

-- RLS: anyone can read APPROVED reviews; only service role can write/moderate.
alter table product_reviews enable row level security;

drop policy if exists "public_read_approved_reviews" on product_reviews;
create policy "public_read_approved_reviews"
  on product_reviews for select
  using (is_approved = true);

drop policy if exists "service_role_all_reviews" on product_reviews;
create policy "service_role_all_reviews"
  on product_reviews using (auth.role() = 'service_role');
