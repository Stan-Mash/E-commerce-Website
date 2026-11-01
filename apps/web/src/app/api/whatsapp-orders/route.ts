import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";

const Schema = z.object({
  ref_code:       z.string().min(1).max(30),
  product_id:     z.string().uuid().optional().nullable(),
  product_title:  z.string().min(1).max(300),
  product_slug:   z.string().optional().nullable(),
  selected_size:  z.string().optional().nullable(),
  unit_price_kes: z.number().positive(),
  customer_name:  z.string().optional().nullable(),
  customer_phone: z.string().optional().nullable(),
});

export const POST = withApiErrorHandling("whatsapp-orders POST", async (request: NextRequest) => {
  const body = await request.json() as unknown;
  const data = Schema.parse(body);

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("whatsapp_orders").insert({
    ref_code:       data.ref_code,
    product_id:     data.product_id ?? null,
    product_title:  data.product_title,
    product_slug:   data.product_slug ?? null,
    selected_size:  data.selected_size ?? null,
    unit_price_kes: data.unit_price_kes,
    customer_name:  data.customer_name ?? null,
    customer_phone: data.customer_phone ?? null,
    status:         "initiated",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ref_code: data.ref_code });
});
