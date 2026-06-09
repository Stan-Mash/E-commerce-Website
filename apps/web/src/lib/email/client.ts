// Transactional email via Resend's HTTP API (no SDK dependency).
// No-ops when RESEND_API_KEY / EMAIL_FROM are unset, so the app runs fine
// without email configured — mirroring the WhatsApp/SMS optional pattern.

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { success: false, error: "Email not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `Resend ${res.status}: ${text.slice(0, 200)}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

function fmtKES(n: number): string {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);
}

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f3ee;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px">
      <p style="letter-spacing:.4em;font-size:11px;text-transform:uppercase;color:#c9a961;margin:0 0 8px">Elite Style Co.</p>
      <h1 style="font-size:24px;margin:0 0 20px">${title}</h1>
      <div style="background:#fff;border:1px solid #e7e2d8;border-radius:8px;padding:24px;font-size:15px;line-height:1.6">${body}</div>
      <p style="font-size:12px;color:#888;margin-top:24px">Elite Style Co. · Nairobi, Kenya · elitestyleco.co.ke</p>
    </div>
  </body></html>`;
}

export function orderConfirmationEmail(orderRef: string, total: number): { subject: string; html: string } {
  return {
    subject: `Order ${orderRef} confirmed — Elite Style Co.`,
    html: shell(
      "Thank you for your order",
      `<p>We've received your payment and your order is confirmed.</p>
       <p style="margin:16px 0"><strong>Order reference:</strong> ${orderRef}<br/>
       <strong>Total paid:</strong> ${fmtKES(total)}</p>
       <p>We'll send tracking details once it ships. You can also check progress any time on our <em>Track Order</em> page using your phone number and this reference.</p>`
    ),
  };
}

export function cartReminderEmail(orderRef: string, total: number): { subject: string; html: string } {
  return {
    subject: `Still thinking it over? Your order ${orderRef} is waiting`,
    html: shell(
      "You're one step away",
      `<p>Your order <strong>${orderRef}</strong> (${fmtKES(total)}) is reserved but payment isn't complete yet.</p>
       <p>Complete the M-Pesa payment to secure your pieces before they sell out. Need a hand? Just reply to this email.</p>`
    ),
  };
}

export function orderShippedEmail(orderRef: string, courier: string | null, trackingNumber: string | null, trackingUrl: string | null): { subject: string; html: string } {
  const track = trackingNumber
    ? `<p style="margin:16px 0"><strong>${courier ?? "Courier"}:</strong> ${trackingNumber}${trackingUrl ? `<br/><a href="${trackingUrl}">Track your parcel →</a>` : ""}</p>`
    : "";
  return {
    subject: `Your order ${orderRef} is on its way`,
    html: shell("Your order has shipped", `<p>Good news — order <strong>${orderRef}</strong> is on its way.</p>${track}`),
  };
}
