import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

// The acting operator's display name. Captured at login into a (non-HttpOnly)
// `admin_operator` cookie for attribution. This is a label, not an auth boundary
// — the HttpOnly admin_session cookie is still the security gate.
export function getOperator(request: NextRequest): string {
  const raw = request.cookies.get("admin_operator")?.value;
  if (!raw) return "admin";
  return decodeURIComponent(raw).slice(0, 60) || "admin";
}

// Best-effort audit write. Never throws and never blocks the main action;
// tolerates a missing table (migration 015 not yet applied).
export async function recordAudit(
  supabase: SupabaseClient,
  entry: { actor: string; action: string; entity?: string; entityId?: string; detail?: unknown }
): Promise<void> {
  try {
    const { error } = await supabase.from("admin_audit_log").insert({
      actor: entry.actor,
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      detail: entry.detail ?? null,
    });
    if (error && !/relation .* does not exist|could not find the table/i.test(error.message)) {
      console.warn("[audit] write warning:", error.message);
    }
  } catch (e) {
    console.warn("[audit] write failed:", (e as Error).message);
  }
}
