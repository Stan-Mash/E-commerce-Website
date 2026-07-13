import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { sendEmail, isEmailConfigured } from "@/lib/email/client";
import { SUPPORT_EMAIL } from "@/lib/supportConfig";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(5).max(2000),
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Stores the submission in contact_messages (migration 021) and, when Resend
// is configured, forwards it to the support inbox. The DB row is the source
// of truth — a failed email must not lose the message.
export async function POST(req: NextRequest) {
  if (!(await rateLimit(`contact:${clientIp(req)}`, 5))) {
    return NextResponse.json(
      { ok: false, error: "Too many messages. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please fill in all required fields correctly." },
      { status: 422 }
    );
  }
  const { name, email, phone, subject, message } = parsed.data;

  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      phone: phone || null,
      subject,
      message,
    });
    if (error) {
      console.error("[contact-form] DB insert failed:", error.message);
      return NextResponse.json(
        { ok: false, error: "Could not send your message. Please try again." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[contact-form] Error storing submission:", err);
    return NextResponse.json(
      { ok: false, error: "Could not send your message. Please try again." },
      { status: 500 }
    );
  }

  // Best-effort email notification to the support inbox.
  if (isEmailConfigured()) {
    const html = [
      `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>`,
      phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : "",
      `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>`,
      `<p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
    ].join("");
    const result = await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `[Contact form] ${subject}`,
      html,
    });
    if (!result.success) {
      console.warn("[contact-form] Email forward failed:", result.error);
    }
  }

  return NextResponse.json({ ok: true });
}
