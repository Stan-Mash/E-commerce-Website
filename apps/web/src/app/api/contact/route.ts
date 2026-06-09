import { NextRequest, NextResponse } from "next/server";

// TODO: integrate email service (e.g. Resend, SendGrid, or Nodemailer via SMTP)
// to forward contact form submissions to hello@elitestyle.co.ke

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, email, phone, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log submission to console (temporary - replace with email integration)
    console.log("[contact-form] New submission:", {
      name,
      email,
      phone: phone || "(not provided)",
      subject,
      message,
      receivedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact-form] Error processing submission:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
