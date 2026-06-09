-- claim_notification_jobs RPC
-- Atomically claims a batch of queued notification jobs.
-- Uses SKIP LOCKED so concurrent cron runs never double-process.

create or replace function claim_notification_jobs(batch_size integer default 10)
returns setof notification_jobs
language sql
security definer
as $$
  update notification_jobs
  set
    status   = 'processing',
    attempts = attempts + 1
  where id in (
    select id
    from   notification_jobs
    where  status = 'queued'
       or  (status = 'failed' and attempts < 3)   -- retry failed jobs up to 3 times
    order  by created_at asc
    limit  batch_size
    for    update skip locked                       -- skip rows locked by another cron run
  )
  returning *;
$$;
