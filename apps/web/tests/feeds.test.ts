import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGoogleFeedXML, buildTikTokCSV, escapeXml, csvEscape, type FeedProduct } from "../src/lib/feeds.ts";

const sample: FeedProduct[] = [
  {
    id: "p1",
    name: 'Tweed Set "Premium" & Co',
    slug: "tweed-set",
    description: "A <bold> two-piece, very nice",
    base_price: 8500,
    category: "women",
    imageUrls: ["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"],
    inStock: true,
  },
  {
    id: "p2",
    name: "Sold Out Vest",
    slug: "vest",
    description: null,
    base_price: 3200,
    category: "men",
    imageUrls: ["https://cdn.example/v.jpg"],
    inStock: false,
  },
  {
    id: "p3",
    name: "No Image Item",
    slug: "no-image",
    description: null,
    base_price: 100,
    category: "men",
    imageUrls: [],
    inStock: true,
  },
];

test("escapeXml handles all five special characters", () => {
  assert.equal(escapeXml(`<a & "b" 'c'>`), "&lt;a &amp; &quot;b&quot; &apos;c&apos;&gt;");
});

test("csvEscape quotes commas and doubles quotes", () => {
  assert.equal(csvEscape("plain"), "plain");
  assert.equal(csvEscape("a,b"), '"a,b"');
  assert.equal(csvEscape('say "hi"'), '"say ""hi"""');
});

test("google feed: valid envelope, escaped fields, availability, price format", () => {
  const xml = buildGoogleFeedXML(sample, "https://shop.example", "Elite Style Co.");
  assert.ok(xml.startsWith(`<?xml version="1.0" encoding="UTF-8"?>`));
  assert.ok(xml.includes(`xmlns:g="http://base.google.com/ns/1.0"`));
  assert.ok(xml.includes("Tweed Set &quot;Premium&quot; &amp; Co"));
  assert.ok(xml.includes("A &lt;bold&gt; two-piece"));
  assert.ok(xml.includes("<g:price>8500.00 KES</g:price>"));
  assert.ok(xml.includes("<g:availability>out of stock</g:availability>"));
  assert.ok(xml.includes("<g:link>https://shop.example/products/tweed-set</g:link>"));
  assert.ok(xml.includes("<g:additional_image_link>https://cdn.example/b.jpg</g:additional_image_link>"));
  // Imageless products are excluded (feeds reject them anyway).
  assert.ok(!xml.includes("no-image"));
});

test("tiktok csv: header + one row per product with an image", () => {
  const csv = buildTikTokCSV(sample, "https://shop.example", "Elite Style Co.");
  const lines = csv.split("\n");
  assert.equal(lines[0], "sku_id,title,description,availability,condition,price,link,image_link,brand,product_type");
  assert.equal(lines.length, 3); // header + 2 products (imageless excluded)
  assert.ok(lines[1]!.includes('"Tweed Set ""Premium"" & Co"'));
  assert.ok(lines[2]!.includes("out of stock"));
});
