import { NextResponse } from "next/server";
import { buildGoogleFeedXML } from "@/lib/feeds";
import { fetchFeedProducts, FEED_BASE, STORE_NAME } from "@/lib/feedData";

export const revalidate = 3600;

// Google Merchant Center / Meta (Facebook & Instagram Shops) catalogue feed.
// Submit this URL as a scheduled fetch in both platforms.
export async function GET() {
  const products = await fetchFeedProducts();
  const xml = buildGoogleFeedXML(products, FEED_BASE, STORE_NAME);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
