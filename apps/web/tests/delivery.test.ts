import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseDeliveryType, deliveryFeeFor, requiresAddress } from "../src/lib/delivery.ts";

test("legacy 'door' normalises to outside_cbd", () => {
  assert.equal(normaliseDeliveryType("door"), "outside_cbd");
});

test("known delivery types pass through", () => {
  assert.equal(normaliseDeliveryType("pickup"), "pickup");
  assert.equal(normaliseDeliveryType("cbd"), "cbd");
  assert.equal(normaliseDeliveryType("outside_cbd"), "outside_cbd");
});

test("unknown/empty falls back to pickup", () => {
  assert.equal(normaliseDeliveryType(null), "pickup");
  assert.equal(normaliseDeliveryType("nonsense"), "pickup");
});

test("pickup and cbd are free; outside_cbd has a fee", () => {
  assert.equal(deliveryFeeFor("pickup"), 0);
  assert.equal(deliveryFeeFor("cbd"), 0);
  assert.ok(deliveryFeeFor("outside_cbd") > 0);
});

test("only deliveries require an address", () => {
  assert.equal(requiresAddress("pickup"), false);
  assert.equal(requiresAddress("cbd"), true);
  assert.equal(requiresAddress("outside_cbd"), true);
});
