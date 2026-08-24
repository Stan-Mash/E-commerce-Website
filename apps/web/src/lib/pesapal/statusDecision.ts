// Pure decision logic for the Pesapal IPN's re-queried transaction status,
// split out of the route handler so it can be unit tested without a live
// Supabase/Pesapal connection.

export interface PesapalStatus {
  statusCode: number; // 0 INVALID/pending, 1 COMPLETED, 2 FAILED, 3 REVERSED
  currency: string;
  amount: number;
}

export type PesapalOutcome = "paid" | "failed" | "pending";

export function decidePesapalOutcome(status: PesapalStatus, orderTotal: number): PesapalOutcome {
  const amountOk = Math.round(status.amount) >= Math.round(orderTotal);
  const success = status.statusCode === 1 && status.currency === "KES" && amountOk;

  if (success) return "paid";
  if (status.statusCode === 2 || status.statusCode === 3) return "failed";
  return "pending";
}
