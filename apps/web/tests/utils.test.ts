import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseKenyanPhone, generateOrderRef, maskPhone } from "../src/lib/utils.ts";

test("normalises common Kenyan phone formats to 2547XXXXXXXX", () => {
  assert.equal(normaliseKenyanPhone("0712345678"), "254712345678");
  assert.equal(normaliseKenyanPhone("+254712345678"), "254712345678");
  assert.equal(normaliseKenyanPhone("254712345678"), "254712345678");
  assert.equal(normaliseKenyanPhone("712345678"), "254712345678");
  assert.equal(normaliseKenyanPhone("0712 345 678"), "254712345678");
});

test("rejects invalid phone numbers", () => {
  assert.throws(() => normaliseKenyanPhone("12345"));
  assert.throws(() => normaliseKenyanPhone("080012345"));
});

test("order refs use the NF- prefix", () => {
  assert.match(generateOrderRef(), /^NF-[A-Z0-9]+-[A-Z0-9]+$/);
});

test("maskPhone hides the middle", () => {
  assert.equal(maskPhone("254712345678"), "2547****678");
  assert.equal(maskPhone("123"), "123");
});
