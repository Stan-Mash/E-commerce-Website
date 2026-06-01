"use client";

import React, { useEffect } from "react";

// ---------------------------------------------------------------------------
// Keyframe injection — runs once per document lifetime
// ---------------------------------------------------------------------------

const STYLE_ID = "__skeleton_shimmer_keyframes__";

function injectKeyframes(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes skeletonShimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Shared shimmer style factory
// ---------------------------------------------------------------------------

function shimmerStyle(
  width: string | number,
  height: string | number,
  borderRadius: string | number
): React.CSSProperties {
  return {
    display: "block",
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius,
    background: "linear-gradient(90deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%)",
    backgroundSize: "800px 100%",
    animation: "skeletonShimmer 1.4s ease-in-out infinite",
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 4,
  className,
  style,
}: SkeletonProps): React.ReactElement {
  useEffect(() => {
    injectKeyframes();
  }, []);

  return (
    <span
      className={className}
      style={{ ...shimmerStyle(width, height, borderRadius), ...style }}
      aria-hidden="true"
      role="presentation"
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonTable
// ---------------------------------------------------------------------------

export interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
}: SkeletonTableProps): React.ReactElement {
  useEffect(() => {
    injectKeyframes();
  }, []);

  const headerCellStyle: React.CSSProperties = {
    padding: "12px 16px",
    backgroundColor: "#2d2d2d",
  };

  const bodyCellStyle: React.CSSProperties = {
    padding: "12px 16px",
    borderBottom: "1px solid #ebebeb",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  };

  return (
    <table style={tableStyle} aria-hidden="true" role="presentation">
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <th key={colIndex} style={headerCellStyle}>
              <Skeleton height={14} borderRadius={3} style={{ opacity: 0.45 }} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <td key={colIndex} style={bodyCellStyle}>
                <Skeleton height={14} borderRadius={3} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard
// ---------------------------------------------------------------------------

export function SkeletonCard(): React.ReactElement {
  useEffect(() => {
    injectKeyframes();
  }, []);

  const cardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "24px 20px",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    minWidth: 160,
  };

  return (
    <div style={cardStyle} aria-hidden="true" role="presentation">
      {/* Large number placeholder */}
      <Skeleton width="60%" height={36} borderRadius={4} />
      {/* Short label placeholder */}
      <Skeleton width="40%" height={14} borderRadius={3} />
    </div>
  );
}
