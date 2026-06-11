import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBNPLLink } from "../src/lib/bnpl.ts";
import { toVectorLiteral } from "../src/lib/embeddings.ts";

test("bnpl link fills amount, ref and phone placeholders", () => {
  const link = buildBNPLLink(
    "https://pay.example/checkout?amt={amount}&ref={ref}&msisdn={phone}",
    { amount: 8500.4, ref: "NF-ABC-123", phone: "254712345678" }
  );
  assert.equal(link, "https://pay.example/checkout?amt=8500&ref=NF-ABC-123&msisdn=254712345678");
});

test("bnpl link handles repeated placeholders and URL-encodes values", () => {
  const link = buildBNPLLink("https://p.example/{ref}/{ref}?p={phone}", {
    amount: 1,
    ref: "A B",
    phone: "+254712345678",
  });
  assert.equal(link, "https://p.example/A%20B/A%20B?p=%2B254712345678");
});

test("toVectorLiteral produces pgvector syntax", () => {
  assert.equal(toVectorLiteral([0.1, -2, 3]), "[0.1,-2,3]");
  assert.equal(toVectorLiteral([]), "[]");
});
