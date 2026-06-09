"use client";

import { useRef, useState, type CSSProperties, type ChangeEvent } from "react";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}

export default function MultiImageUploader({ value, onChange, onUploadingChange, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    onUploadingChange?.(true);

    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/products/upload-image", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        const json = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !json.url) {
          setError(json.error ?? `Upload failed for "${file.name}".`);
          break;
        }
        uploaded.push(json.url);
      }
      if (uploaded.length > 0) onChange([...value, ...uploaded]);
    } catch {
      setError("Network error during upload.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...value];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    onChange(next);
  }

  const busy = disabled || uploading;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {value.map((url, i) => (
          <div key={`${url}-${i}`} style={TILE}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Product image ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {i === 0 && <span style={BADGE}>Primary</span>}
            <button type="button" onClick={() => removeAt(i)} aria-label={`Remove image ${i + 1}`} style={REMOVE_BTN}>×</button>
            <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, display: "flex", justifyContent: "space-between" }}>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" style={arrow(i === 0)}>‹</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move later" style={arrow(i === value.length - 1)}>›</button>
            </div>
          </div>
        ))}

        <label htmlFor="multi-image-input" style={{ ...TILE, ...ADD_TILE, cursor: busy ? "not-allowed" : "pointer" }}>
          {uploading ? "Uploading…" : "+ Add images"}
        </label>
        <input
          ref={inputRef}
          id="multi-image-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          disabled={busy}
          onChange={(e) => void handleFiles(e)}
          style={{ display: "none" }}
        />
      </div>

      <p style={{ marginTop: 8, fontFamily: "var(--font-inter)", fontSize: 11, color: "var(--es-mute)", lineHeight: 1.6 }}>
        JPEG, PNG, WebP or GIF · Max 10 MB each · select several at once. The first image is the primary (shown on cards); reorder with ‹ ›.
      </p>
      {error && (
        <p style={{ marginTop: 6, fontFamily: "var(--font-inter)", fontSize: 12, color: "#c0392b" }}>{error}</p>
      )}
    </div>
  );
}

const TILE: CSSProperties = {
  position: "relative",
  width: 120,
  height: 120,
  borderRadius: 8,
  overflow: "hidden",
  border: "1px solid var(--es-bone)",
  flexShrink: 0,
  background: "var(--es-white)",
};

const ADD_TILE: CSSProperties = {
  border: "2px dashed var(--es-bone)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  color: "var(--es-mute)",
  fontFamily: "var(--font-inter)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

const BADGE: CSSProperties = {
  position: "absolute",
  top: 4,
  left: 4,
  background: "var(--es-plum)",
  color: "#fff",
  fontSize: 9,
  letterSpacing: "0.1em",
  padding: "2px 6px",
  borderRadius: 3,
  textTransform: "uppercase",
  fontFamily: "var(--font-inter)",
};

const REMOVE_BTN: CSSProperties = {
  position: "absolute",
  top: 4,
  right: 4,
  width: 22,
  height: 22,
  borderRadius: "50%",
  border: "none",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 15,
  lineHeight: 1,
};

function arrow(isDisabled: boolean): CSSProperties {
  return {
    width: 24,
    height: 22,
    borderRadius: 4,
    border: "none",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    cursor: isDisabled ? "default" : "pointer",
    opacity: isDisabled ? 0.3 : 1,
    fontSize: 15,
    lineHeight: 1,
  };
}
