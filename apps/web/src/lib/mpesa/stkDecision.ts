// Pure decision logic for the M-Pesa STK push callback, split out of the
// route handler so it can be unit tested without a live Supabase connection.

export interface STKExistingTransaction {
  status: string;
  amount: number | string | null;
}

export interface STKParsedCallback {
  success: boolean;
  amount: number | null | undefined;
}

// True when this callback has already been processed and should be
// acknowledged without reprocessing (Safaricom retries the same callback).
export function isAlreadyProcessed(existing: STKExistingTransaction | null): boolean {
  return !!existing && existing.status !== "pending";
}

// Defence in depth: the callback's amount must cover what the STK push
// requested. The amount is server-set so a mismatch should never happen — if
// it does, don't mark the order paid; leave it pending for manual review.
export function isAmountMismatch(
  parsed: STKParsedCallback,
  existing: STKExistingTransaction | null
): boolean {
  if (!parsed.success) return false;
  if (existing?.amount == null || parsed.amount == null) return false;
  return Math.round(parsed.amount) < Math.round(Number(existing.amount));
}
