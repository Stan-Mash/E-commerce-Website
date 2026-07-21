-- Symmetric counterpart to redeem_promotion() (008_promotions.sql). Needed
-- because checkout redeems a promotion at STK-push/payment-initiation time
-- (src/app/api/checkout/route.ts), before payment is confirmed — so an
-- abandoned checkout that never completes payment has already permanently
-- consumed one of the promotion's capped uses. releaseStaleReservations()
-- in the notifications cron already restores stock for these; this lets it
-- restore the promotion redemption slot too.

create or replace function release_promotion(p_promotion_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update promotions
     set uses_count = greatest(0, uses_count - 1)
   where id = p_promotion_id;
end;
$$;
