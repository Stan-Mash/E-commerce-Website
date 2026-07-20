import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { askStylist, isStylistConfigured, type StylistMessage } from "@/lib/anthropic/client";
import { rateLimitDaily, clientIp } from "@/lib/rateLimit";

const SESSION_COOKIE = "es_stylist_session";
const DAILY_MESSAGE_LIMIT = 20;

const StylistSchema = z.object({
  productId: z.string().uuid().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(1000),
      })
    )
    .min(1)
    .max(20),
});

async function buildSystemPrompt(productId?: string): Promise<string> {
  const base = [
    "You are the Elite Style Co. Stylist — a refined, warm, Nairobi-proud styling assistant for a Kenyan fashion e-commerce site.",
    "Answer styling questions (what goes with what, how to wear a piece, sizing advice) in 2-4 sentences, in a confident but friendly voice.",
    "Only recommend items from the CATALOG list below — never invent products, prices, or stock that aren't listed.",
    "All prices are in KES. When you recommend an item, name it plainly (the storefront links it automatically).",
    "If asked something unrelated to styling/the catalog (e.g. general chit-chat, other brands, medical/legal advice), politely redirect to styling.",
  ].join(" ");

  try {
    const supabase = createPublicSupabaseClient();
    let query = supabase
      .from("products")
      .select("name, base_price, category, status, skus(size, stock_quantity)")
      .eq("status", "active")
      .limit(60);
    const { data } = await query;
    const catalog = (data ?? [])
      .map((p) => {
        const sizes = [...new Set((p.skus ?? []).filter((s) => s.stock_quantity > 0).map((s) => s.size))];
        if (sizes.length === 0) return null; // out of stock — don't recommend
        return `- ${p.name} (${p.category}) — KES ${p.base_price}, sizes: ${sizes.join(", ")}`;
      })
      .filter(Boolean)
      .join("\n");
    const context = productId ? `\n\nThe shopper is currently viewing product ID ${productId}.` : "";
    return `${base}\n\nCATALOG (in stock now):\n${catalog || "(catalog temporarily unavailable)"}${context}`;
  } catch {
    return base;
  }
}

export async function POST(req: NextRequest) {
  if (!isStylistConfigured()) {
    return NextResponse.json({ ok: false, error: "The Stylist is temporarily unavailable." }, { status: 503 });
  }

  let sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  const isNewSession = !sessionId;
  if (!sessionId) sessionId = randomUUID();

  const rateKey = `stylist:${sessionId}:${clientIp(req)}`;
  if (!(await rateLimitDaily(rateKey, DAILY_MESSAGE_LIMIT))) {
    return NextResponse.json(
      { ok: false, error: "You've reached today's Stylist message limit — please try again tomorrow." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  const parsed = StylistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid message." }, { status: 422 });
  }

  const systemPrompt = await buildSystemPrompt(parsed.data.productId);
  const result = await askStylist(parsed.data.messages as StylistMessage[], systemPrompt);

  const response = result.success
    ? NextResponse.json({ ok: true, reply: result.reply })
    : NextResponse.json({ ok: false, error: "The Stylist couldn't respond just now — please try again." }, { status: 502 });

  if (isNewSession) {
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return response;
}
