-- Lets a customer self-report their M-Pesa confirmation code after paying
-- via Buy Goods (manual Till payment), so admin staff have something to
-- act on immediately instead of hunting through the orders list. This is a
-- safety net alongside the C2B webhook, not a replacement for it — reporting
-- a code never changes order status on its own; a staff member still has to
-- confirm it (see /admin/pending-payments).

alter table c2b_payments add column if not exists customer_reported_code text;
alter table c2b_payments add column if not exists customer_reported_at timestamptz;
