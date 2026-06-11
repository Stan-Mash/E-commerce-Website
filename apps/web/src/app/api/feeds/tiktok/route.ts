import { NextResponse } from "next/server";
import { buildTikTokCSV } from "@/lib/feeds";
import { fetchFeedProducts, FEED_BASE, STORE_NAME } from "@/lib/feedData";

export const revalidate = 3600;

// TikTok Shop / catalogue CSV feed — submit as a scheduled URL in TikTok Ads Manager.
export async function GET() {
  const products = await fetchFeedProducts();
  const csv = buildTikTokCSV(products, FEED_BASE, STORE_NAME);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
