import { createClient } from "@supabase/supabase-js";

const DEFAULT_TEXT =
  "New arrivals weekly  ·  Pay with M-Pesa, card or Paybill  ·  Shop the latest drops now";

async function getAnnouncementSettings(): Promise<{ text: string; enabled: boolean }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { text: DEFAULT_TEXT, enabled: true };
  }
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .eq("namespace", "store")
      .in("key", ["announcement_bar_text", "announcement_bar_enabled"]);
    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return {
      text: map["announcement_bar_text"]?.trim() || DEFAULT_TEXT,
      enabled: map["announcement_bar_enabled"] !== "false",
    };
  } catch {
    return { text: DEFAULT_TEXT, enabled: true };
  }
}

export async function AnnouncementBar() {
  const { text, enabled } = await getAnnouncementSettings();
  if (!enabled) return null;
  return (
    <div className="bg-es-ink text-white font-sans text-[11px] tracking-label text-center py-3 uppercase">
      {text}
    </div>
  );
}
