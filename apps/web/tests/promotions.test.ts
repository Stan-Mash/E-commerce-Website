import { test } from "node:test";
import assert from "node:assert/strict";
import { applyDiscounts, type Promotion } from "../src/lib/promotions/engine.ts";

const base = (over: Partial<Promotion>): Promotion => ({
  id: "p1", name: "Promo", code: null, type: "percentage", value: 10,
  min_spend: null, max_uses: null, uses_count: 0, active: true,
  starts_at: null, expires_at: null, ...over,
});

const items = [{ sku_id: "s1", quantity: 2, unit_price: 1000 }]; // subtotal 2000

test("no promotions -> no discount", () => {
  const r = applyDiscounts(items, 300, [], undefined);
  assert.equal(r.subtotal, 2000);
  assert.equal(r.discountAmount, 0);
  assert.equal(r.total, 2300);
});

test("auto percentage promotion applies", () => {
  const r = applyDiscounts(items, 0, [base({ type: "percentage", value: 10 })]);
  assert.equal(r.discountAmount, 200);
  assert.equal(r.total, 1800);
});

test("code promotion only applies with the matching code", () => {
  const promo = [base({ code: "SAVE20", type: "percentage", value: 20 })];
  assert.equal(applyDiscounts(items, 0, promo, undefined).discountAmount, 0);
  assert.equal(applyDiscounts(items, 0, promo, "save20").discountAmount, 400); // case-insensitive
});

test("free_shipping zeroes the delivery fee", () => {
  const r = applyDiscounts(items, 500, [base({ type: "free_shipping", value: 0 })]);
  assert.equal(r.deliveryFee, 0);
  assert.equal(r.total, 2000);
});

test("min_spend gate blocks below threshold", () => {
  const r = applyDiscounts(items, 0, [base({ min_spend: 5000, value: 50 })]);
  assert.equal(r.discountAmount, 0);
});

test("expired and over-used promotions are ignored", () => {
  const expired = base({ expires_at: "2000-01-01T00:00:00Z", value: 50 });
  const used = base({ max_uses: 3, uses_count: 3, value: 50 });
  assert.equal(applyDiscounts(items, 0, [expired]).discountAmount, 0);
  assert.equal(applyDiscounts(items, 0, [used]).discountAmount, 0);
});

test("fixed_amount cannot exceed subtotal", () => {
  const r = applyDiscounts(items, 0, [base({ type: "fixed_amount", value: 99999 })]);
  assert.equal(r.discountAmount, 2000);
  assert.equal(r.total, 0);
});

test("largest discount wins (no stacking)", () => {
  const r = applyDiscounts(items, 0, [
    base({ id: "a", type: "percentage", value: 10 }),  // 200
    base({ id: "b", type: "fixed_amount", value: 500 }), // 500
  ]);
  assert.equal(r.discountAmount, 500);
  assert.equal(r.appliedPromotion?.id, "b");
});
