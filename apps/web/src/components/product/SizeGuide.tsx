"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ADULT_SIZES, KIDS_SIZES } from "@/lib/sizeGuide";

type Tab = "adults" | "kids";

interface Props {
  /** Optional: highlight the currently selected size in the table */
  activeSize?: string | null;
}

export function SizeGuide({ activeSize }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("adults");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handle);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Trigger link */}
      <button
        onClick={() => setOpen(true)}
        className="text-[12px] tracking-[.18em] uppercase underline underline-offset-4 text-es-mute hover:text-es-ink transition-colors"
        style={{ fontFamily: "var(--font-inter, sans-serif)" }}
      >
        Size Guide
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="sg-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel: bottom sheet on mobile, centred modal on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Size Guide"
        className={cn("sg-panel", open && "sg-panel--open")}
      >
        {/* Header */}
        <div className="sg-header">
          <h2 className="sg-title">Size Guide</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close size guide"
            className="sg-close"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="sg-tabs">
          {(["adults", "kids"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("sg-tab", tab === t && "sg-tab--active")}
            >
              {t === "adults" ? "Adults" : "Children"}
            </button>
          ))}
        </div>

        <p className="sg-note">All measurements in centimetres (cm).</p>

        {/* Table */}
        <div className="sg-table-wrap">
          <table className="sg-table">
            <thead>
              <tr>
                <th>Size</th>
                <th>Chest</th>
                <th>Waist</th>
                <th>Hips</th>
                <th>Height fits</th>
              </tr>
            </thead>
            <tbody>
              {(tab === "adults" ? ADULT_SIZES : KIDS_SIZES).map((row) => (
                <tr
                  key={row.size}
                  className={cn(activeSize === row.size && "sg-row--active")}
                >
                  <td className="sg-size-cell">{row.size}</td>
                  <td>{row.chest}</td>
                  <td>{row.waist}</td>
                  <td>{row.hips}</td>
                  <td>{row.height}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <p className="sg-footer-note">
          Measurements are body measurements, not garment measurements.
          For the best fit, size up if you are between sizes.
        </p>
      </div>

      <style>{`
        /* Backdrop */
        .sg-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.45);
          animation: sgFadeIn 0.2s ease;
        }

        @keyframes sgFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Panel shared */
        .sg-panel {
          position: fixed;
          z-index: 1001;
          background: #fff;
          font-family: var(--font-inter, sans-serif);
          transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1),
                      opacity 0.3s ease;
        }

        /* Mobile: bottom sheet */
        @media (max-width: 767px) {
          .sg-panel {
            left: 0; right: 0; bottom: 0;
            border-radius: 20px 20px 0 0;
            padding: 20px 20px 32px;
            max-height: 88vh;
            overflow-y: auto;
            transform: translateY(100%);
            opacity: 0;
          }
          .sg-panel--open {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Desktop: centred modal */
        @media (min-width: 768px) {
          .sg-panel {
            top: 50%; left: 50%;
            transform: translate(-50%, -44%);
            opacity: 0;
            width: 560px;
            max-height: 80vh;
            overflow-y: auto;
            border-radius: 12px;
            padding: 28px 32px 32px;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
          }
          .sg-panel--open {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
        }

        .sg-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .sg-title {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #171717;
          margin: 0;
        }

        .sg-close {
          background: none;
          border: none;
          font-size: 16px;
          color: #888;
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
          transition: color 0.15s;
        }
        .sg-close:hover { color: #171717; }

        /* Tabs */
        .sg-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #e5e4df;
          margin-bottom: 16px;
        }

        .sg-tab {
          padding: 8px 20px;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #888;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }

        .sg-tab--active {
          color: #171717;
          border-bottom-color: #6b2d6b;
        }

        .sg-note {
          font-size: 12px;
          color: #999;
          margin: 0 0 14px;
          letter-spacing: 0.04em;
        }

        /* Table */
        .sg-table-wrap {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e5e4df;
        }

        .sg-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          color: #333;
        }

        .sg-table th {
          background: #f8f7f5;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #555;
          text-align: left;
          border-bottom: 1px solid #e5e4df;
        }

        .sg-table td {
          padding: 10px 14px;
          border-bottom: 1px solid #f0efe9;
          color: #444;
        }

        .sg-table tbody tr:last-child td {
          border-bottom: none;
        }

        .sg-table tbody tr:hover td {
          background: #faf9f7;
        }

        .sg-size-cell {
          font-weight: 600;
          color: #171717;
          letter-spacing: 0.06em;
        }

        .sg-row--active td {
          background: #f1e9f5 !important;
        }

        .sg-row--active .sg-size-cell {
          color: #6b2d6b;
        }

        .sg-footer-note {
          margin-top: 16px;
          font-size: 12px;
          color: #999;
          line-height: 1.6;
          letter-spacing: 0.02em;
        }
      `}</style>
    </>
  );
}
