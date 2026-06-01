"use client";

import type { Metadata } from "next";
import { useState } from "react";

// Note: metadata export cannot be used in a "use client" component.
// The title is set via the head tag approach below.

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
          style={{ height: "44vh", background: "#3d1a4a", color: "#ffffff" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 50% 30%, rgba(201,169,97,0.12) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <p
            className="mb-6 text-[11px] tracking-[.48em] uppercase"
            style={{ color: "#c9a961" }}
          >
            Support
          </p>
          <h1
            className="text-5xl sm:text-7xl font-bold leading-none"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            Get in Touch
          </h1>
        </section>

        {/* Two-column layout */}
        <section className="mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-12 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 lg:gap-24">
            {/* LEFT — Contact form */}
            <div>
              {success ? (
                <div
                  className="flex flex-col items-start gap-4 py-12"
                  style={{ borderLeft: "4px solid #c9a961", paddingLeft: 24 }}
                >
                  <p
                    className="text-[11px] tracking-[.48em] uppercase"
                    style={{ color: "#c9a961" }}
                  >
                    Message received
                  </p>
                  <h2
                    className="text-3xl sm:text-4xl font-bold text-es-ink leading-tight"
                    style={{ fontFamily: "var(--font-bodoni)" }}
                  >
                    Thank you for reaching out.
                  </h2>
                  <p className="text-[15px] leading-relaxed text-es-mute max-w-md">
                    We&apos;ve received your message and will get back to you within 24
                    hours. For faster response, you can also WhatsApp us directly.
                  </p>
                  <button
                    className="es-btn-plum mt-4 px-8 py-3"
                    onClick={() => {
                      setForm(INITIAL);
                      setSuccess(false);
                    }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-2 text-[11px] tracking-[.48em] uppercase text-es-gold">
                    Contact form
                  </p>
                  <h2
                    className="mb-10 text-3xl sm:text-4xl font-bold text-es-ink leading-tight"
                    style={{ fontFamily: "var(--font-bodoni)" }}
                  >
                    Send us a message
                  </h2>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                          Full Name <span style={{ color: "#3d1a4a" }}>*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Jane Wanjiku"
                          className="border border-[rgba(0,0,0,0.15)] px-4 py-3 text-[14px] text-es-ink placeholder:text-es-faint focus:outline-none focus:border-[#3d1a4a] transition-colors"
                          style={{ fontFamily: "var(--font-inter)" }}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                          Email <span style={{ color: "#3d1a4a" }}>*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="jane@example.com"
                          className="border border-[rgba(0,0,0,0.15)] px-4 py-3 text-[14px] text-es-ink placeholder:text-es-faint focus:outline-none focus:border-[#3d1a4a] transition-colors"
                          style={{ fontFamily: "var(--font-inter)" }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                          Phone{" "}
                          <span className="text-es-faint normal-case tracking-normal font-normal">
                            (optional)
                          </span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+254 700 000 000"
                          className="border border-[rgba(0,0,0,0.15)] px-4 py-3 text-[14px] text-es-ink placeholder:text-es-faint focus:outline-none focus:border-[#3d1a4a] transition-colors"
                          style={{ fontFamily: "var(--font-inter)" }}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                          Subject <span style={{ color: "#3d1a4a" }}>*</span>
                        </label>
                        <select
                          name="subject"
                          required
                          value={form.subject}
                          onChange={handleChange}
                          className="border border-[rgba(0,0,0,0.15)] px-4 py-3 text-[14px] text-es-ink focus:outline-none focus:border-[#3d1a4a] transition-colors bg-white appearance-none"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          <option value="" disabled>
                            Select a subject
                          </option>
                          {SUBJECTS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                        Message <span style={{ color: "#3d1a4a" }}>*</span>
                      </label>
                      <textarea
                        name="message"
                        required
                        rows={6}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help…"
                        className="border border-[rgba(0,0,0,0.15)] px-4 py-3 text-[14px] text-es-ink placeholder:text-es-faint focus:outline-none focus:border-[#3d1a4a] transition-colors resize-none"
                        style={{ fontFamily: "var(--font-inter)" }}
                      />
                    </div>

                    {error && (
                      <p className="text-[13px] text-red-600">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="es-btn-plum self-start px-10 py-4"
                    >
                      {submitting ? "Sending…" : "Send Message"}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* RIGHT — Contact info cards */}
            <div className="flex flex-col gap-5">
              <p className="mb-2 text-[11px] tracking-[.48em] uppercase text-es-gold">
                Find us
              </p>

              {/* WhatsApp */}
              <div
                className="p-6 flex gap-4 items-start"
                style={{ background: "#f7f7f7" }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center"
                  style={{ background: "#25D366", color: "#fff", fontSize: 18 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <p
                    className="mb-1 text-[11px] tracking-[.12em] uppercase font-semibold text-es-mute"
                  >
                    WhatsApp
                  </p>
                  <a
                    href="https://wa.me/254700000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] font-medium text-es-ink hover:text-[#3d1a4a] transition-colors"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    +254 700 000 000
                  </a>
                  <p className="mt-1 text-[13px] text-es-mute">
                    Fastest way to reach us
                  </p>
                </div>
              </div>

              {/* Email */}
              <div
                className="p-6 flex gap-4 items-start"
                style={{ background: "#f7f7f7" }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center"
                  style={{ background: "#3d1a4a", color: "#fff" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div>
                  <p className="mb-1 text-[11px] tracking-[.12em] uppercase font-semibold text-es-mute">
                    Email
                  </p>
                  <a
                    href="mailto:hello@elitestyle.co.ke"
                    className="text-[15px] font-medium text-es-ink hover:text-[#3d1a4a] transition-colors"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    hello@elitestyle.co.ke
                  </a>
                  <p className="mt-1 text-[13px] text-es-mute">
                    We reply within 24 hours
                  </p>
                </div>
              </div>

              {/* Address */}
              <div
                className="p-6 flex gap-4 items-start"
                style={{ background: "#f7f7f7" }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center"
                  style={{ background: "#3d1a4a", color: "#fff" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="mb-1 text-[11px] tracking-[.12em] uppercase font-semibold text-es-mute">
                    Physical address
                  </p>
                  <p
                    className="text-[15px] font-medium text-es-ink"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    Westlands, Nairobi
                  </p>
                  <p className="mt-1 text-[13px] text-es-mute">Kenya</p>
                </div>
              </div>

              {/* Hours */}
              <div
                className="p-6 flex gap-4 items-start"
                style={{ background: "#f7f7f7" }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center"
                  style={{ background: "#3d1a4a", color: "#fff" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <p className="mb-1 text-[11px] tracking-[.12em] uppercase font-semibold text-es-mute">
                    Business hours
                  </p>
                  <p
                    className="text-[15px] font-medium text-es-ink"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    Mon – Sat, 9 am – 6 pm
                  </p>
                  <p className="mt-1 text-[13px] text-es-mute">East Africa Time (EAT)</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
