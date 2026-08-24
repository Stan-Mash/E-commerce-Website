import { test } from "node:test";
import assert from "node:assert/strict";
import { isAlreadyProcessed, isAmountMismatch } from "../src/lib/mpesa/stkDecision.ts";

test("no existing transaction is not already processed", () => {
  assert.equal(isAlreadyProcessed(null), false);
});

test("a pending existing transaction is not already processed", () => {
  assert.equal(isAlreadyProcessed({ status: "pending", amount: 1000 }), false);
});

test("a completed existing transaction is already processed", () => {
  assert.equal(isAlreadyProcessed({ status: "completed", amount: 1000 }), true);
});

test("a failed existing transaction is already processed", () => {
  assert.equal(isAlreadyProcessed({ status: "failed", amount: 1000 }), true);
});

test("a failed callback is never flagged as an amount mismatch", () => {
  const result = isAmountMismatch({ success: false, amount: 100 }, { status: "pending", amount: 1000 });
  assert.equal(result, false);
});

test("missing existing amount is not a mismatch", () => {
  const result = isAmountMismatch({ success: true, amount: 1000 }, { status: "pending", amount: null });
  assert.equal(result, false);
});

test("callback amount below the expected amount is a mismatch", () => {
  const result = isAmountMismatch({ success: true, amount: 500 }, { status: "pending", amount: 1000 });
  assert.equal(result, true);
});

test("callback amount equal to or above the expected amount is not a mismatch", () => {
  assert.equal(isAmountMismatch({ success: true, amount: 1000 }, { status: "pending", amount: 1000 }), false);
  assert.equal(isAmountMismatch({ success: true, amount: 1200 }, { status: "pending", amount: 1000 }), false);
});

test("string-typed existing amount is compared numerically", () => {
  const result = isAmountMismatch({ success: true, amount: 500 }, { status: "pending", amount: "1000" });
  assert.equal(result, true);
});
