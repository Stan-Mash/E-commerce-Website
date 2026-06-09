-- Newsletter subscribers, order fulfilment tracking, customer email, and a
-- discount ledger on orders. Safe to run multiple times.

-- Newsletter signups (footer form)
create table if not exists newsletter_subscribers (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null unique,
  source      text,
  created_at  timestamptz not null default now()
);
alter table newsletter_subscribers enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'newsletter_subscribers' and policyname = 'service_role_all_newsletter') then
    create policy "service_role_all_newsletter" on newsletter_subscribers using (auth.role() = 'service_role');
  end if;
end $$;

-- Order fulfilment + email + discount ledger
alter table orders add column if not exists email            text;
alter table orders add column if not exists tracking_number  text;
alter table orders add column if not exists courier          text;
alter table orders add column if not exists tracking_url      text;
alter table orders add column if not exists shipped_at        timestamptz;
alter table orders add column if not exists discount_amount   numeric(10,2) not null default 0;
alter table orders add column if not exists promotion_id      uuid references promotions(id);

-- Email notification jobs (sent by the cron worker alongside WhatsApp/SMS)
-- notification_jobs.job_type already free-text; no schema change needed.
