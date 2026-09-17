// Direct fetch() call to the Gemini API, mirroring lib/anthropic/client.ts so
// the two are drop-in interchangeable behind lib/stylist/provider.ts.
// No-ops (returns success: false) when GEMINI_API_KEY is unset.

import type { StylistMessage } from "@/lib/anthropic/client";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-flash-latest";

// Gemini 3.x models reason before answering, and those thinking tokens are
// drawn from the SAME maxOutputTokens budget as the visible reply. A trivial
// "reply with OK" prompt measured 82 thinking tokens against 8 prompt tokens,
// so a budget sized only for the answer returns finishReason MAX_TOKENS and an
// empty candidate. The ceiling is therefore well above Anthropic's 500; the
// Stylist's 2-4 sentence replies are capped by the system prompt, not here.
const MAX_OUTPUT_TOKENS = 1200;

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export async function askGemini(
  messages: StylistMessage[],
  systemPrompt: string
): Promise<{ success: true; reply: string } | { success: false; error: string }> {
  if (!isGeminiConfigured()) {
    return { success: false, error: "Gemini not configured" };
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  try {
    const res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: "POST",
      headers: {
        // Header auth rather than ?key= so the credential never lands in a
        // request URL, where proxies and access logs would capture it.
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Gemini names the assistant turn "model"; Anthropic calls it
        // "assistant". The route passes Anthropic-shaped messages, so map here
        // and keep the shared StylistMessage type as the single contract.
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `Gemini ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts;
    const reply = Array.isArray(parts)
      ? parts.map((p: { text?: string }) => p.text ?? "").join("").trim()
      : "";

    if (!reply) {
      // A MAX_TOKENS finish with no parts means thinking consumed the whole
      // budget. Say so plainly instead of surfacing a bare "Empty response",
      // because the fix is to raise MAX_OUTPUT_TOKENS, not to retry.
      const why = candidate?.finishReason === "MAX_TOKENS"
        ? "token budget exhausted before any reply text was produced"
        : candidate?.finishReason ?? "no candidates returned";
      return { success: false, error: `Empty response (${why})` };
    }

    return { success: true, reply };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
