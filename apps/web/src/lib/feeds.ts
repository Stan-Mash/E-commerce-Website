// Product-catalog feed builders for Google Merchant Center, Meta (Facebook/
// Instagram Shops) and TikTok. Google + Meta both ingest the RSS 2.0 feed with
// the g: namespace; TikTok takes CSV. Pure functions — unit tested.

export interface FeedProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  category: string;
  imageUrls: string[];   // first = main image
  inStock: boolean;
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Maps our internal category strings to Google's product taxonomy
// (https://support.google.com/merchants/answer/6324436), required by name
// as "google_product_category" in TikTok's catalog spec and recommended
// (optional) in Google Merchant Center's own feed.
const GOOGLE_PRODUCT_CATEGORY: Record<string, string> = {
  women: "Apparel & Accessories > Clothing > Women's Clothing",
  woman: "Apparel & Accessories > Clothing > Women's Clothing",
  men: "Apparel & Accessories > Clothing > Men's Clothing",
  man: "Apparel & Accessories > Clothing > Men's Clothing",
  children: "Apparel & Accessories > Clothing > Children's Clothing",
  child: "Apparel & Accessories > Clothing > Children's Clothing",
  accessories: "Apparel & Accessories > Clothing Accessories",
};

export function googleProductCategory(category: string): string {
  return GOOGLE_PRODUCT_CATEGORY[category.toLowerCase()] ?? "Apparel & Accessories > Clothing";
}

export function buildGoogleFeedXML(products: FeedProduct[], baseUrl: string, storeName: string): string {
  const items = products
    .filter((p) => p.imageUrls.length > 0)
    .map((p) => {
      const link = `${baseUrl}/products/${p.slug}`;
      const extra = p.imageUrls
        .slice(1, 11)
        .map((u) => `      <g:additional_image_link>${escapeXml(u)}</g:additional_image_link>`)
        .join("\n");
      return [
        "    <item>",
        `      <g:id>${escapeXml(p.id)}</g:id>`,
        `      <g:title>${escapeXml(p.name)}</g:title>`,
        `      <g:description>${escapeXml(p.description || p.name)}</g:description>`,
        `      <g:link>${escapeXml(link)}</g:link>`,
        `      <g:image_link>${escapeXml(p.imageUrls[0]!)}</g:image_link>`,
        extra,
        `      <g:availability>${p.inStock ? "in stock" : "out of stock"}</g:availability>`,
        `      <g:price>${p.base_price.toFixed(2)} KES</g:price>`,
        "      <g:condition>new</g:condition>",
        `      <g:brand>${escapeXml(storeName)}</g:brand>`,
        `      <g:product_type>${escapeXml(p.category)}</g:product_type>`,
        `      <g:google_product_category>${escapeXml(googleProductCategory(p.category))}</g:google_product_category>`,
        "    </item>",
      ].filter(Boolean).join("\n");
    })
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">`,
    "  <channel>",
    `    <title>${escapeXml(storeName)}</title>`,
    `    <link>${escapeXml(baseUrl)}</link>`,
    `    <description>${escapeXml(`${storeName} product catalogue`)}</description>`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");
}

export function buildTikTokCSV(products: FeedProduct[], baseUrl: string, storeName: string): string {
  // Column names/order follow TikTok's catalog spec exactly:
  // https://ads.tiktok.com/help/article/catalog-product-parameters
  const header = "sku_id,title,description,availability,condition,price,link,image_link,brand,google_product_category";
  const rows = products
    .filter((p) => p.imageUrls.length > 0)
    .map((p) =>
      [
        p.id,
        csvEscape(p.name),
        csvEscape(p.description || p.name),
        p.inStock ? "in stock" : "out of stock",
        "new",
        `${p.base_price.toFixed(2)} KES`,
        `${baseUrl}/products/${p.slug}`,
        p.imageUrls[0]!,
        csvEscape(storeName),
        csvEscape(googleProductCategory(p.category)),
      ].join(",")
    );
  return [header, ...rows].join("\n");
}
