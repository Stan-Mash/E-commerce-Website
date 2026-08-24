import { test } from "node:test";
import assert from "node:assert/strict";
import { decideC2BMatch, type C2BPendingCandidate } from "../src/lib/mpesa/c2bMatching.ts";

function candidate(overrides: Partial<C2BPendingCandidate> = {}): C2BPendingCandidate {
  return {
    id: "c1",
    order_id: "o1",
    order_ref: "NF-0001",
    expected_amount: 1000,
    status: "pending",
    ...overrides,
  };
}

test("exact BillRefNumber match wins over phone fallback", () => {
  const ref = candidate({ id: "ref-match" });
  const result = decideC2BMatch({ refMatch: ref, phoneCandidates: [candidate({ id: "phone-match" })], paidAmount: 1000 });
  assert.equal(result.pending?.id, "ref-match");
  assert.equal(result.usedPhoneFallback, false);
  assert.equal(result.matchStatus, "matched");
});

test("falls back to phone+amount match when no ref match", () => {
  const phoneMatch = candidate({ id: "phone-match" });
  const result = decideC2BMatch({ refMatch: null, phoneCandidates: [phoneMatch], paidAmount: 1000 });
  assert.equal(result.pending?.id, "phone-match");
  assert.equal(result.usedPhoneFallback, true);
  assert.equal(result.ambiguous, false);
});

test("multiple eligible phone candidates is flagged ambiguous, oldest still wins", () => {
  const oldest = candidate({ id: "oldest" });
  const newer = candidate({ id: "newer" });
  const result = decideC2BMatch({ refMatch: null, phoneCandidates: [oldest, newer], paidAmount: 1000 });
  assert.equal(result.pending?.id, "oldest");
  assert.equal(result.ambiguous, true);
});

test("no ref match and no phone candidates yields no match", () => {
  const result = decideC2BMatch({ refMatch: null, phoneCandidates: [], paidAmount: 1000 });
  assert.equal(result.pending, null);
  assert.equal(result.matchStatus, null);
});

test("a matched candidate that is no longer pending yields no match", () => {
  const alreadyPaid = candidate({ status: "matched" });
  const result = decideC2BMatch({ refMatch: alreadyPaid, phoneCandidates: [], paidAmount: 1000 });
  assert.equal(result.pending, null);
  assert.equal(result.matchStatus, null);
});

test("paying exactly the expected amount classifies as matched", () => {
  const result = decideC2BMatch({ refMatch: candidate({ expected_amount: 500 }), phoneCandidates: [], paidAmount: 500 });
  assert.equal(result.matchStatus, "matched");
});

test("paying more than expected classifies as overpaid", () => {
  const result = decideC2BMatch({ refMatch: candidate({ expected_amount: 500 }), phoneCandidates: [], paidAmount: 600 });
  assert.equal(result.matchStatus, "overpaid");
});

test("paying less than expected classifies as underpaid", () => {
  const result = decideC2BMatch({ refMatch: candidate({ expected_amount: 500 }), phoneCandidates: [], paidAmount: 400 });
  assert.equal(result.matchStatus, "underpaid");
});
