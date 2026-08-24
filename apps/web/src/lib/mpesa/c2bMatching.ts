// Pure decision logic for the C2B webhook's payment-to-order matching, split
// out of the route handler so it can be unit tested without a live Supabase
// connection. The candidate rows are expected to already be filtered/sorted
// by the caller's DB query (phone match, status="pending",
// expected_amount <= paidAmount, oldest created_at first) — this function
// only decides which one wins and how the payment compares to what's owed.
// This exact matching logic had a real production bug (see git history:
// "fix: C2B webhook can never match a real Buy Goods payment").

export interface C2BPendingCandidate {
  id: string;
  order_id: string;
  order_ref?: string | null;
  expected_amount: number;
  status: string;
}

export type C2BMatchStatus = "matched" | "overpaid" | "underpaid";

export interface C2BMatchInput {
  // Result of the exact BillRefNumber -> order_ref lookup, or null if none.
  refMatch: C2BPendingCandidate | null;
  // Candidates from the phone+amount fallback query, oldest first.
  phoneCandidates: C2BPendingCandidate[];
  paidAmount: number;
}

export interface C2BMatchResult {
  pending: C2BPendingCandidate | null;
  matchStatus: C2BMatchStatus | null;
  usedPhoneFallback: boolean;
  // True when the phone fallback had more than one eligible pending order —
  // the oldest still wins, but this is worth logging since it means the
  // match is a best guess, not a certainty.
  ambiguous: boolean;
}

export function decideC2BMatch({ refMatch, phoneCandidates, paidAmount }: C2BMatchInput): C2BMatchResult {
  let pending = refMatch;
  let usedPhoneFallback = false;
  let ambiguous = false;

  if (!pending) {
    const match = phoneCandidates[0] ?? null;
    if (match) {
      pending = match;
      usedPhoneFallback = true;
      ambiguous = phoneCandidates.length > 1;
    }
  }

  if (!pending || pending.status !== "pending") {
    return { pending: null, matchStatus: null, usedPhoneFallback, ambiguous };
  }

  const expectedAmount = Number(pending.expected_amount);
  let matchStatus: C2BMatchStatus = paidAmount >= expectedAmount ? "matched" : "underpaid";
  if (paidAmount > expectedAmount) matchStatus = "overpaid";

  return { pending, matchStatus, usedPhoneFallback, ambiguous };
}
