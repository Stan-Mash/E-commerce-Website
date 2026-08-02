-- Pesapal card/mobile-money checkout (replaces the Flutterwave integration —
-- see docs/LAUNCH_CHECKLIST.md for why). Tracks Pesapal's order_tracking_id
-- per order so the IPN webhook (which only receives that ID, not our own
-- order id) can look the order back up.

alter table orders add column if not exists pesapal_order_tracking_id text;
create index if not exists orders_pesapal_tracking_idx on orders(pesapal_order_tracking_id) where pesapal_order_tracking_id is not null;
