"use client";

import React from "react";

export interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
}

function getPageButtons(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  const left = current - 1;
  const right = current + 1;

  // Always include first and last
  const included = new Set<number>([1, totalPages]);
  if (left >= 1) included.add(left);
  included.add(current);
  if (right <= totalPages) included.add(right);

  const sorted = Array.from(included).sort((a, b) => a - b);

  for (let i = 0; i < sorted.length; i++) {
    const val = sorted[i]!;
    if (i > 0) {
      const prev = sorted[i - 1]!;
      if (val - prev === 2) {
        // Insert the single gap number instead of ellipsis
        pages.push(prev + 1);
      } else if (val - prev > 2) {
        pages.push("...");
      }
    }
    pages.push(val);
  }

  return pages;
}

const baseButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 32,
  height: 32,
  padding: "0 8px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  background: "#ffffff",
  color: "var(--es-ink, #1a1a2e)",
  fontFamily: "Inter, sans-serif",
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1,
  cursor: "pointer",
  userSelect: "none",
  transition: "background 0.15s, color 0.15s, border-color 0.15s",
  outline: "none",
};

const activeButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  background: "var(--es-ink, #1a1a2e)",
  color: "#ffffff",
  borderColor: "var(--es-ink, #1a1a2e)",
  cursor: "default",
};

const disabledButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  color: "#b0b8c1",
  borderColor: "#e2e8f0",
  background: "#f8f9fa",
  cursor: "not-allowed",
  pointerEvents: "none",
};

const ellipsisStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 32,
  height: 32,
  padding: "0 4px",
  fontFamily: "Inter, sans-serif",
  fontSize: 12,
  color: "#6b7280",
  userSelect: "none",
};

export function Pagination({ total, page, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const isPrevDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;

  const pageButtons = getPageButtons(page, totalPages);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        color: "var(--es-ink, #1a1a2e)",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      {/* Results summary */}
      <span
        style={{
          color: "#6b7280",
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        {total === 0
          ? "No results"
          : `Showing ${start}–${end} of ${total} result${total !== 1 ? "s" : ""}`}
      </span>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* Previous */}
        <button
          type="button"
          aria-label="Previous page"
          disabled={isPrevDisabled}
          onClick={() => !isPrevDisabled && onChange(page - 1)}
          style={isPrevDisabled ? disabledButtonStyle : baseButtonStyle}
        >
          ← Prev
        </button>

        {/* Page number buttons */}
        {pageButtons.map((item, index) =>
          item === "..." ? (
            <span key={`ellipsis-${index}`} style={ellipsisStyle} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => item !== page && onChange(item)}
              style={item === page ? activeButtonStyle : baseButtonStyle}
            >
              {item}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          aria-label="Next page"
          disabled={isNextDisabled}
          onClick={() => !isNextDisabled && onChange(page + 1)}
          style={isNextDisabled ? disabledButtonStyle : baseButtonStyle}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
