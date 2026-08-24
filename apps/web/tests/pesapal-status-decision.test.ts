import { test } from "node:test";
import assert from "node:assert/strict";
import { decidePesapalOutcome } from "../src/lib/pesapal/statusDecision.ts";

test("completed status in KES with a sufficient amount is paid", () => {
  const outcome = decidePesapalOutcome({ statusCode: 1, currency: "KES", amount: 1000 }, 1000);
  assert.equal(outcome, "paid");
});

test("completed status with an insufficient amount is not paid", () => {
  const outcome = decidePesapalOutcome({ statusCode: 1, currency: "KES", amount: 500 }, 1000);
  assert.notEqual(outcome, "paid");
});

test("completed status in a non-KES currency is not paid", () => {
  const outcome = decidePesapalOutcome({ statusCode: 1, currency: "USD", amount: 1000 }, 1000);
  assert.notEqual(outcome, "paid");
});

test("overpaying still counts as paid", () => {
  const outcome = decidePesapalOutcome({ statusCode: 1, currency: "KES", amount: 1200 }, 1000);
  assert.equal(outcome, "paid");
});

test("statusCode 2 (FAILED) is failed", () => {
  const outcome = decidePesapalOutcome({ statusCode: 2, currency: "KES", amount: 0 }, 1000);
  assert.equal(outcome, "failed");
});

test("statusCode 3 (REVERSED) is failed", () => {
  const outcome = decidePesapalOutcome({ statusCode: 3, currency: "KES", amount: 1000 }, 1000);
  assert.equal(outcome, "failed");
});

test("statusCode 0 (INVALID/pending) is pending", () => {
  const outcome = decidePesapalOutcome({ statusCode: 0, currency: "KES", amount: 0 }, 1000);
  assert.equal(outcome, "pending");
});

test("insufficient amount with statusCode 1 falls through to pending, not failed", () => {
  const outcome = decidePesapalOutcome({ statusCode: 1, currency: "KES", amount: 500 }, 1000);
  assert.equal(outcome, "pending");
});
