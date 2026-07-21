import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { recordAudit, getOperator } from "@/lib/audit";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface Params {
  params: { id: string };
}

// Records that an admin reached out about a stalled checkout — called from
// the Abandoned Checkouts page when "Recover on WhatsApp" is clicked, so
// the list can show "already contacted" instead of staying undifferentiated
// forever. Mirrors the recordAudit() convention already used for
// order.status / order.fulfilment (api/admin/orders/[id]/route.ts).
export async function POST(request: NextRequest, { params }: Params) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true }); // nothing to record without Supabase configured
  }

  let channel = "whatsapp";
  try {
    const body = await request.json();
    if (typeof body?.channel === "string") channel = body.channel.slice(0, 20);
  } catch {
    // no body — default channel is fine
  }

  const supabase = getAdminClient();
  await recordAudit(supabase, {
    actor: getOperator(request),
    action: "order.recovery_contact",
    entity: "order",
    entityId: params.id,
    detail: { channel },
  });

  return NextResponse.json({ ok: true });
}
