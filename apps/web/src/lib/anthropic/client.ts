// Direct fetch() call to the Anthropic Messages API — no SDK dependency,
// mirroring the existing Resend email client pattern in this codebase.
// No-ops (returns success: false) when ANTHROPIC_API_KEY is unset, so the
// Stylist feature is fully inert until configured.

const API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 500;

export function isStylistConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export interface StylistMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askStylist(
  messages: StylistMessage[],
  systemPrompt: string
): Promise<{ success: true; reply: string } | { success: false; error: string }> {
  if (!isStylistConfigured()) {
    return { success: false, error: "Stylist not configured" };
  }
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `Anthropic ${res.status}: ${text.slice(0, 200)}` };
    }
    const data = await res.json();
    const reply = Array.isArray(data.content)
      ? data.content.map((block: { type: string; text?: string }) => (block.type === "text" ? block.text : "")).join("")
      : "";
    if (!reply) return { success: false, error: "Empty response" };
    return { success: true, reply };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
