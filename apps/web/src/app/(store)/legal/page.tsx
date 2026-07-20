import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_PHONE, SUPPORT_EMAIL } from "@/lib/supportConfig";

export const metadata: Metadata = { title: "Privacy, Terms & Cookies | Elite Style Co." };

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 48,
};

const H2_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-bodoni)",
  fontSize: "clamp(22px, 3vw, 30px)",
  fontWeight: 700,
  color: "var(--es-ink)",
  marginBottom: 16,
  paddingTop: 32,
  borderTop: "1px solid var(--es-bone)",
};

const P_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-inter), sans-serif",
  fontSize: 15,
  lineHeight: 1.75,
  color: "var(--es-mute)",
  marginBottom: 14,
};

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-es-white">
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 100px" }}>
        <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: ".45em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 16 }}>
          LEGAL
        </p>
        <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, lineHeight: 1.1, color: "var(--es-ink)", marginBottom: 8 }}>
          Privacy, Terms &amp; Cookies
        </h1>
        <p style={{ ...P_STYLE, marginBottom: 48 }}>
          Last updated: June 2026. For questions, contact us at{" "}
          <a href="mailto:hello@elitestyle.co.ke" style={{ color: "var(--es-ink)" }}>hello@elitestyle.co.ke</a>.
        </p>

        {/* Privacy Policy */}
        <section style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>Privacy Policy</h2>
          <p style={P_STYLE}>
            Elite Style Co. (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects only the information needed to process your order and deliver it to you. We do not sell your personal data to third parties.
          </p>
          <p style={P_STYLE}>
            <strong>What we collect:</strong> Your name, phone number, delivery address, and M-Pesa transaction reference when you place an order. We may also collect your email address if you choose to provide it.
          </p>
          <p style={P_STYLE}>
            <strong>How we use it:</strong> To fulfil and track your order, send you order confirmation via SMS, and provide customer support. We may occasionally send you updates about new arrivals if you opt in.
          </p>
          <p style={P_STYLE}>
            <strong>Data security:</strong> All payments are processed by Safaricom M-Pesa and Flutterwave. We do not store card or M-Pesa PIN data. Order data is stored on secured servers in compliance with applicable Kenyan data protection law.
          </p>
          <p style={P_STYLE}>
            <strong>Your rights:</strong> You may request access to, correction of, or deletion of your personal data by contacting us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "var(--es-ink)" }}>{SUPPORT_EMAIL}</a> or via WhatsApp at {SUPPORT_PHONE}.
          </p>
        </section>

        {/* Try-On & Your Photos */}
        <section style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>Try-On &amp; Your Photos</h2>
          <p style={P_STYLE}>
            Our optional &ldquo;See it on you&rdquo; feature lets you upload a photo of yourself to
            preview how a garment might look on you. This is entirely optional and requires your
            explicit consent before your first upload.
          </p>
          <p style={P_STYLE}>
            <strong>What&apos;s processed:</strong> Your photo is sent to a third-party AI image
            provider to generate the preview. It is stored temporarily in a private, access-controlled
            location — never in the same place as our public product photos.
          </p>
          <p style={P_STYLE}>
            <strong>Retention:</strong> Uploaded photos and generated results are automatically
            deleted within 24 hours. You can also delete them immediately at any time from your
            account settings.
          </p>
          <p style={P_STYLE}>
            <strong>What we don&apos;t do:</strong> We never use your try-on photos for marketing,
            model training, or any purpose beyond generating your requested preview. Results are
            labelled &ldquo;AI preview — style visualisation, not an exact fit guarantee.&rdquo;
          </p>
          <p style={P_STYLE}>
            This processing is carried out under the Kenya Data Protection Act, 2019. You may
            withdraw consent, or request deletion of any retained data, at any time by contacting us
            at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "var(--es-ink)" }}>{SUPPORT_EMAIL}</a>.
          </p>
        </section>

        {/* Terms of Service */}
        <section style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>Terms of Service</h2>
          <p style={P_STYLE}>
            By placing an order on Elite Style Co. you agree to the following terms.
          </p>
          <p style={P_STYLE}>
            <strong>Orders:</strong> All orders are subject to availability and confirmation of payment. We reserve the right to cancel any order if payment is not received or if a product is found to be out of stock after the order is placed, in which case a full refund will be issued.
          </p>
          <p style={P_STYLE}>
            <strong>Pricing:</strong> All prices are in Kenyan Shillings (KES) and include any applicable taxes. Prices are subject to change without notice, but the price displayed at the time of your order is the price you pay.
          </p>
          <p style={P_STYLE}>
            <strong>Delivery:</strong> We offer free delivery within Nairobi CBD and a flat fee for outside Nairobi. Delivery timelines are estimates and may vary. We are not liable for delays caused by third-party couriers or circumstances beyond our control.
          </p>
          <p style={P_STYLE}>
            <strong>Returns:</strong> We accept returns within 14 days of delivery for eligible items. See our{" "}
            <Link href="/returns" style={{ color: "var(--es-ink)" }}>Returns &amp; Exchanges</Link> page for full details.
          </p>
          <p style={P_STYLE}>
            <strong>Intellectual property:</strong> All content on this website — including images, copy, branding, and design — is owned by or licensed to Elite Style Co. and may not be reproduced without written permission.
          </p>
          <p style={P_STYLE}>
            <strong>Governing law:</strong> These terms are governed by the laws of the Republic of Kenya. Any disputes shall be resolved in the courts of Nairobi, Kenya.
          </p>
        </section>

        {/* Cookie Policy */}
        <section style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>Cookie Policy</h2>
          <p style={P_STYLE}>
            This website uses cookies and local storage to provide a working shopping experience. Specifically:
          </p>
          <p style={P_STYLE}>
            <strong>Essential cookies:</strong> We store your shopping bag in your browser&apos;s local storage so it persists between visits. This is strictly necessary for the site to function and cannot be disabled.
          </p>
          <p style={P_STYLE}>
            <strong>Analytics:</strong> We may use anonymised analytics to understand how visitors use the site. No personally identifiable information is collected for analytics purposes.
          </p>
          <p style={P_STYLE}>
            <strong>Third-party cookies:</strong> Our payment providers (Safaricom M-Pesa, Flutterwave) may set cookies during the payment process. These are governed by their own privacy policies.
          </p>
          <p style={P_STYLE}>
            You can disable cookies in your browser settings, but this may affect your ability to use the shopping bag and checkout.
          </p>
        </section>

        <div style={{ paddingTop: 32, borderTop: "1px solid var(--es-bone)" }}>
          <Link href="/contact" style={{ fontFamily: "var(--font-inter)", fontSize: 13, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--es-ink)", borderBottom: "1px solid var(--es-ink)", paddingBottom: 2, textDecoration: "none" }}>
            Questions? Contact Us →
          </Link>
        </div>
      </div>
    </main>
  );
}
