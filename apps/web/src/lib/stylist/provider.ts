// Chooses which model provider answers the Stylist, so swapping between them
// is an env var rather than a code change. Mirrors lib/tryon/provider.ts:
// everything above this file talks only to askStylist()/isStylistConfigured().

import {
  askStylist as askAnthropic,
  isStylistConfigured as isAnthropicConfigured,
  type StylistMessage,
} from "@/lib/anthropic/client";
import { askGemini, isGeminiConfigured } from "@/lib/gemini/client";

export type { StylistMessage };

export type StylistProvider = "anthropic" | "gemini";

// STYLIST_PROVIDER picks explicitly. With it unset we fall back to whichever
// key exists, preferring Anthropic, so adding GEMINI_API_KEY for image work
// later cannot silently switch who answers customers.
export function activeProvider(): StylistProvider | null {
  const choice = process.env.STYLIST_PROVIDER?.trim().toLowerCase();
  if (choice === "gemini") return isGeminiConfigured() ? "gemini" : null;
  if (choice === "anthropic") return isAnthropicConfigured() ? "anthropic" : null;
  if (isAnthropicConfigured()) return "anthropic";
  if (isGeminiConfigured()) return "gemini";
  return null;
}

export function isStylistConfigured(): boolean {
  return activeProvider() !== null;
}

export async function askStylist(
  messages: StylistMessage[],
  systemPrompt: string
): Promise<{ success: true; reply: string } | { success: false; error: string }> {
  const provider = activeProvider();
  if (!provider) return { success: false, error: "Stylist not configured" };
  return provider === "gemini"
    ? askGemini(messages, systemPrompt)
    : askAnthropic(messages, systemPrompt);
}
