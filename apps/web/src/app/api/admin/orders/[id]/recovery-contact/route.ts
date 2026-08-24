import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { recordAudit, getOperator } from "@/lib/audit";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

const RecoveryContactSchema = z.object({
  channel: z.string().optional(),
});

// Records that an admin reached out about a stalled checkout — called from
// the Abandoned Checkouts page when "Recover on WhatsApp" is clicked, so
// the list can show "already contacted" instead of staying undifferentiated
// forever. Mirrors the recordAudit() convention already used for
// order.status / order.fulfilment (api/admin/orders/[id]/route.ts).
export async function POST(request: NextRequest, props: Params) {
  const params = await props.params;
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true }); // nothing to record without Supabase configured
  }

  let channel = "whatsapp";
  try {
    const jsonBody = await request.json();
    const parsed = RecoveryContactSchema.safeParse(jsonBody);
    if (parsed.success && parsed.data.channel) channel = parsed.data.channel.slice(0, 20);
  } catch {
    // no body — default channel is fine
  }

  const supabase = createAdminSupabaseClient();
  await recordAudit(supabase, {
    actor: getOperator(request),
    action: "order.recovery_contact",
    entity: "order",
    entityId: params.id,
    detail: { channel },
  });

  return NextResponse.json({ ok: true });
}
