import { test } from "node:test";
import assert from "node:assert/strict";
import { safeEqual } from "../src/lib/adminAuth.ts";

test("safeEqual matches identical strings", () => {
  assert.equal(safeEqual("secret-token", "secret-token"), true);
});

test("safeEqual rejects different strings", () => {
  assert.equal(safeEqual("secret-token", "secret-toked"), false);
  assert.equal(safeEqual("short", "longer-value"), false);
});

test("safeEqual rejects empty/missing values (fail closed)", () => {
  assert.equal(safeEqual("", ""), false);
  assert.equal(safeEqual("x", ""), false);
  assert.equal(safeEqual("", "x"), false);
});
