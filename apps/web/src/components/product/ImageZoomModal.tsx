"use client";

import { useEffect } from "react";
import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageZoomModal({ src, alt, isOpen, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="zoom-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Zoomed product image"
    >
      {/* Close button */}
      <button
        className="zoom-modal-close"
        onClick={onClose}
        aria-label="Close zoom"
      >
        ✕ Close
      </button>

      {/* Image container — stop click propagation so clicking image itself doesn't close */}
      <div
        className="zoom-modal-image-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="zoom-modal-image"
        />
      </div>

      <style>{`
        .zoom-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.88);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: zoomFadeIn 0.22s ease;
        }

        @keyframes zoomFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .zoom-modal-close {
          position: fixed;
          top: 20px;
          right: 24px;
          color: #fff;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 6px;
          padding: 6px 14px;
          font-size: 13px;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: background 0.18s;
          z-index: 10000;
          font-family: var(--font-inter, sans-serif);
        }

        .zoom-modal-close:hover {
          background: rgba(255, 255, 255, 0.22);
        }

        .zoom-modal-image-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .zoom-modal-image {
          max-width: 90vw;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 4px;
          box-shadow: 0 8px 48px rgba(0, 0, 0, 0.6);
        }
      `}</style>
    </div>
  );
}
