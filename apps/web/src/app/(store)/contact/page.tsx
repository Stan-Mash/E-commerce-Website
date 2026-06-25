"use client";

import { useState } from "react";
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_LINK, SUPPORT_EMAIL } from "@/lib/supportConfig";

const SUBJECTS = [
  { value: "order", label: "Order inquiry" },
  { value: "returns", label: "Returns" },
  { value: "product", label: "Product question" },
  { value: "other", label: "Other" },
] as const;

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const INITIAL: FormState = { name: "", email: "", phone: "", subject: "", message: "" };

const STORE_ADDRESS = "Shop 35, 4th Floor, Wing B\nStanbank House, Moi Avenue Street\nNairobi, Kenya";
const STORE_ADDRESS_ONELINE = "Shop 35, 4th Floor, Wing B, Stanbank House, Moi Avenue Street, Nairobi";

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Request failed");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again or WhatsApp us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <title>Contact Us | Elite Style Co.</title>

      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section
          className="relative flex flex-col items-center justify-center text-center px-6"
          style={{ height: "44vh", background: "var(--es-ink)", color: "#ffffff" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 50% 30%, rgba(201,169,97,0.12) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <p className="mb-6 text-[11px] tracking-[.48em] uppercase" style={{ color: "#c9a961" }}>
            We&apos;d love to hear from you
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold leading-none" style={{ fontFamily: "var(--font-bodoni)" }}>
            Get in Touch
          </h1>
          <p className="mt-6 text-[15px] max-w-md" style={{ opacity: 0.7, fontFamily: "var(--font-inter)" }}>
            Visit us in CBD, call, WhatsApp, or send a message — we&apos;re always here.
          </p>
        </section>

        {/* ── STORE LOCATION BANNER ── */}
        <section style={{ background: "#c9a961" }}>
          <div className="mx-auto w-full max-w-[1200px] px-6 py-8 sm:px-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-12">
              {/* Pin icon */}
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] tracking-[.4em] uppercase text-white/70 mb-1">Our Physical Store</p>
                <p className="text-white font-bold text-xl" style={{ fontFamily: "var(--font-bodoni)" }}>
                  Stanbank House, Moi Avenue Street
                </p>
                <p className="text-white/90 text-[14px] mt-1">
                  Shop 35 · 4th Floor · Wing B · Nairobi CBD
                </p>
              </div>
              <div className="sm:ml-auto flex-shrink-0">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS_ONELINE)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-es-ink text-[11px] tracking-[.2em] uppercase font-semibold px-6 py-3 hover:bg-white/90 transition-colors"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Open in Maps
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Two-column layout */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-12 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 lg:gap-24">

            {/* LEFT — Contact form */}
            <div>
              {success ? (
                <div
                  className="flex flex-col items-start gap-4 py-12"
                  style={{ borderLeft: "4px solid #c9a961", paddingLeft: 24 }}
                >
                  <p className="text-[11px] tracking-[.48em] uppercase" style={{ color: "#c9a961" }}>
                    Message received
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-es-ink leading-tight" style={{ fontFamily: "var(--font-bodoni)" }}>
                    Thank you for reaching out.
                  </h2>
                  <p className="text-[15px] leading-relaxed text-es-mute max-w-md">
                    We&apos;ve received your message and will get back to you within 24 hours.
                    For faster response, WhatsApp us directly.
                  </p>
                  <button
                    className="es-btn-plum mt-4 px-8 py-3"
                    onClick={() => { setForm(INITIAL); setSuccess(false); }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-2 text-[11px] tracking-[.48em] uppercase text-es-gold">Contact form</p>
                  <h2 className="mb-10 text-3xl sm:text-4xl font-bold text-es-ink leading-tight" style={{ fontFamily: "var(--font-bodoni)" }}>
                    Send us a message
                  </h2>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                          Full Name <span style={{ color: "var(--es-ink)" }}>*</span>
                        </label>
                        <input
                          type="text" name="name" required value={form.name} onChange={handleChange}
                          placeholder="Jane Wanjiku"
                          className="border border-[rgba(0,0,0,0.15)] px-4 py-3 text-[14px] text-es-ink placeholder:text-es-faint focus:outline-none focus:border-[var(--es-ink)] transition-colors"
                          style={{ fontFamily: "var(--font-inter)" }}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                          Email <span style={{ color: "var(--es-ink)" }}>*</span>
                        </label>
                        <input
                          type="email" name="email" required value={form.email} onChange={handleChange}
                          placeholder="jane@example.com"
                          className="border border-[rgba(0,0,0,0.15)] px-4 py-3 text-[14px] text-es-ink placeholder:text-es-faint focus:outline-none focus:border-[var(--es-ink)] transition-colors"
                          style={{ fontFamily: "var(--font-inter)" }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                          Phone <span className="text-es-faint normal-case tracking-normal font-normal">(optional)</span>
                        </label>
                        <input
                          type="tel" name="phone" value={form.phone} onChange={handleChange}
                          placeholder="+254 700 000 000"
                          className="border border-[rgba(0,0,0,0.15)] px-4 py-3 text-[14px] text-es-ink placeholder:text-es-faint focus:outline-none focus:border-[var(--es-ink)] transition-colors"
                          style={{ fontFamily: "var(--font-inter)" }}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                          Subject <span style={{ color: "var(--es-ink)" }}>*</span>
                        </label>
                        <select
                          name="subject" required value={form.subject} onChange={handleChange}
                          className="border border-[rgba(0,0,0,0.15)] px-4 py-3 text-[14px] text-es-ink focus:outline-none focus:border-[var(--es-ink)] transition-colors bg-white appearance-none"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          <option value="" disabled>Select a subject</option>
                          {SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                        Message <span style={{ color: "var(--es-ink)" }}>*</span>
                      </label>
                      <textarea
                        name="message" required rows={6} value={form.message} onChange={handleChange}
                        placeholder="Tell us how we can help…"
                        className="border border-[rgba(0,0,0,0.15)] px-4 py-3 text-[14px] text-es-ink placeholder:text-es-faint focus:outline-none focus:border-[var(--es-ink)] transition-colors resize-none"
                        style={{ fontFamily: "var(--font-inter)" }}
                      />
                    </div>

                    {error && <p className="text-[13px] text-red-600">{error}</p>}

                    <button type="submit" disabled={submitting} className="es-btn-plum self-start px-10 py-4">
                      {submitting ? "Sending…" : "Send Message"}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* RIGHT — Contact info */}
            <div className="flex flex-col gap-4">
              <p className="mb-2 text-[11px] tracking-[.48em] uppercase text-es-gold">Find us</p>

              {/* Physical address */}
              <div className="p-6 flex gap-4 items-start" style={{ background: "#f7f7f7" }}>
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center" style={{ background: "var(--es-ink)", color: "#fff" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="mb-1 text-[11px] tracking-[.12em] uppercase font-semibold text-es-mute">Visit Our Store</p>
                  <p className="text-[15px] font-semibold text-es-ink leading-snug" style={{ fontFamily: "var(--font-inter)" }}>
                    Shop 35, 4th Floor, Wing B
                  </p>
                  <p className="text-[14px] text-es-ink" style={{ fontFamily: "var(--font-inter)" }}>
                    Stanbank House, Moi Avenue Street
                  </p>
                  <p className="text-[14px] text-es-mute" style={{ fontFamily: "var(--font-inter)" }}>
                    Nairobi CBD, Kenya
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS_ONELINE)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-block text-[11px] tracking-[.12em] uppercase"
                    style={{ color: "#c9a961", textDecoration: "none", fontFamily: "var(--font-inter)" }}
                  >
                    Get directions →
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="p-6 flex gap-4 items-start" style={{ background: "#f7f7f7" }}>
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center" style={{ background: "#25D366", color: "#fff" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <p className="mb-1 text-[11px] tracking-[.12em] uppercase font-semibold text-es-mute">WhatsApp</p>
                  <a href={SUPPORT_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
                    className="text-[15px] font-semibold text-es-ink hover:opacity-70 transition-opacity"
                    style={{ fontFamily: "var(--font-inter)" }}>
                    {SUPPORT_PHONE}
                  </a>
                  <p className="mt-1 text-[13px] text-es-mute">Fastest way to reach us</p>
                </div>
              </div>

              {/* Phone */}
              <div className="p-6 flex gap-4 items-start" style={{ background: "#f7f7f7" }}>
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center" style={{ background: "var(--es-ink)", color: "#fff" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" />
                  </svg>
                </div>
                <div>
                  <p className="mb-1 text-[11px] tracking-[.12em] uppercase font-semibold text-es-mute">Phone</p>
                  <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
                    className="text-[15px] font-semibold text-es-ink hover:opacity-70 transition-opacity"
                    style={{ fontFamily: "var(--font-inter)" }}>
                    {SUPPORT_PHONE}
                  </a>
                  <p className="mt-1 text-[13px] text-es-mute">Mon – Sat, 9 am – 6 pm EAT</p>
                </div>
              </div>

              {/* Email */}
              <div className="p-6 flex gap-4 items-start" style={{ background: "#f7f7f7" }}>
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center" style={{ background: "var(--es-ink)", color: "#fff" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div>
                  <p className="mb-1 text-[11px] tracking-[.12em] uppercase font-semibold text-es-mute">Email</p>
                  <a href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-[15px] font-semibold text-es-ink hover:opacity-70 transition-opacity"
                    style={{ fontFamily: "var(--font-inter)" }}>
                    {SUPPORT_EMAIL}
                  </a>
                  <p className="mt-1 text-[13px] text-es-mute">We reply within 24 hours</p>
                </div>
              </div>

              {/* Social media */}
              <div className="p-6" style={{ background: "#f7f7f7" }}>
                <p className="mb-4 text-[11px] tracking-[.12em] uppercase font-semibold text-es-mute">Follow Us</p>
                <div className="flex flex-col gap-3">
                  {/* Instagram */}
                  <a href="https://instagram.com/elit_estyleco" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)", color: "#fff" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </div>
                    <span className="text-[14px] text-es-ink" style={{ fontFamily: "var(--font-inter)" }}>@elit_estyleco</span>
                  </a>
                  {/* TikTok */}
                  <a href="https://tiktok.com/@elitestyleco0" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ background: "#010101", color: "#fff" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                      </svg>
                    </div>
                    <span className="text-[14px] text-es-ink" style={{ fontFamily: "var(--font-inter)" }}>@elitestyleco0</span>
                  </a>
                  {/* Facebook */}
                  <a href="https://facebook.com/EliteStyle" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ background: "#1877F2", color: "#fff" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                      </svg>
                    </div>
                    <span className="text-[14px] text-es-ink" style={{ fontFamily: "var(--font-inter)" }}>Elite Style</span>
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="p-6 flex gap-4 items-start" style={{ background: "#f7f7f7" }}>
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center" style={{ background: "var(--es-ink)", color: "#fff" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <p className="mb-1 text-[11px] tracking-[.12em] uppercase font-semibold text-es-mute">Business Hours</p>
                  <p className="text-[15px] font-semibold text-es-ink" style={{ fontFamily: "var(--font-inter)" }}>
                    Mon – Sat, 9 am – 6 pm
                  </p>
                  <p className="mt-1 text-[13px] text-es-mute">East Africa Time (EAT)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location CTA strip */}
        <section style={{ background: "var(--es-ink)", color: "#fff" }}>
          <div className="mx-auto w-full max-w-[1200px] px-6 py-14 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div>
              <p className="text-[11px] tracking-[.4em] uppercase mb-2" style={{ color: "#c9a961" }}>Walk In Anytime</p>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-bodoni)" }}>
                Come see us in person
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed" style={{ opacity: 0.7, fontFamily: "var(--font-inter)" }}>
                {STORE_ADDRESS.split("\n").join(" · ")}
              </p>
            </div>
            <div className="flex gap-4 flex-wrap justify-center sm:justify-end flex-shrink-0">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS_ONELINE)}`}
                target="_blank" rel="noopener noreferrer"
                className="es-btn-outline-white px-8 py-4 text-[11px] tracking-[.35em] uppercase"
              >
                Get Directions
              </a>
              <a
                href={SUPPORT_WHATSAPP_LINK}
                target="_blank" rel="noopener noreferrer"
                className="es-btn-plum px-8 py-4 text-[11px] tracking-[.35em] uppercase"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
