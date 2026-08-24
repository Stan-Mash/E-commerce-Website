"use client";

import { useState, useRef, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { trackTryOnGenerated } from "@/lib/analytics";

const TIPS = [
  "Full body, good light, plain background works best.",
  "Standing straight, arms slightly away from your body helps.",
  "This is a style preview, not an exact fit guarantee.",
];

async function downscaleToBase64(file: File, maxDim = 1024): Promise<{ base64: File }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85)
  );
  return { base64: new File([blob], "photo.jpg", { type: "image/jpeg" }) };
}

type Stage = "intro" | "uploading" | "generating" | "result" | "error";

export function TryOnModal({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }) {
  const [consent, setConsent] = useState(false);
  const [stage, setStage] = useState<Stage>("intro");
  const [error, setError] = useState("");
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleFile(file: File) {
    if (!consent) {
      setError("Please confirm consent above before uploading a photo.");
      return;
    }
    setError("");
    setStage("uploading");
    // Timing telemetry only — handleFile runs solely from the file <input>'s
    // onChange handler, never during render, so Date.now() here is safe.
    // eslint-disable-next-line react-hooks/purity
    startedAtRef.current = Date.now();
    try {
      const { base64: downscaled } = await downscaleToBase64(file);
      setPersonPreview(URL.createObjectURL(downscaled));

      const formData = new FormData();
      formData.append("photo", downscaled);
      formData.append("productId", productId);
      formData.append("consent", "true");

      const res = await fetch("/api/tryon", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Something went wrong.");
        setStage("error");
        // eslint-disable-next-line react-hooks/purity -- see note above; event-handler-only.
        trackTryOnGenerated(productId, Date.now() - startedAtRef.current, false);
        return;
      }
      if (data.status === "completed") {
        setResultUrl(data.resultUrl);
        setStage("result");
        // eslint-disable-next-line react-hooks/purity -- see note above; event-handler-only.
        trackTryOnGenerated(productId, Date.now() - startedAtRef.current, true);
        return;
      }
      setStage("generating");
      pollStatus(data.id);
    } catch {
      setError("Could not read that photo. Please try another.");
      setStage("error");
    }
  }

  function pollStatus(id: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tryon/status?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!data.ok) return;
        if (data.status === "completed") {
          clearInterval(interval);
          setResultUrl(data.resultUrl);
          setStage("result");
          trackTryOnGenerated(productId, Date.now() - startedAtRef.current, true);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setError("We couldn't generate your preview. Please try a different photo.");
          setStage("error");
          trackTryOnGenerated(productId, Date.now() - startedAtRef.current, false);
        }
      } catch {
        // transient — keep polling
      }
    }, 3000);
    // Stop polling after 60s regardless, so a stuck request doesn't spin forever.
    setTimeout(() => clearInterval(interval), 60000);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="See it on you">
      <div className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-es-hair">
          <span className="text-[13px] font-semibold flex items-center gap-2">
            <Sparkles size={16} className="text-es-champagne-dk" /> See it on you
          </span>
          <button onClick={onClose} aria-label="Close" className="text-es-mute hover:text-es-ink">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {stage === "intro" && (
            <>
              <p className="text-[13px] text-es-mute mb-4">
                Upload a full-body photo to preview the <strong>{productName}</strong> on you.
              </p>
              <ul className="text-[12px] text-es-mute mb-4 list-disc pl-4 space-y-1">
                {TIPS.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <label className="flex items-start gap-2 text-[12px] text-es-mute mb-4">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                <span>
                  I consent to my photo being processed by a third-party AI provider to generate this
                  preview. It&apos;s auto-deleted within 24 hours. See{" "}
                  <a href="/legal" target="_blank" rel="noopener noreferrer" className="underline">
                    Try-On &amp; Your Photos
                  </a>
                  .
                </span>
              </label>
              {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              <button
                type="button"
                disabled={!consent}
                onClick={() => fileInputRef.current?.click()}
                className="es-btn-plum w-full"
                style={{ opacity: consent ? 1 : 0.5, cursor: consent ? "pointer" : "not-allowed" }}
              >
                Upload or Take Photo
              </button>
            </>
          )}

          {(stage === "uploading" || stage === "generating") && (
            <div className="flex flex-col items-center py-10 gap-4">
              {personPreview && (
                <div className="relative w-32 h-40 overflow-hidden bg-es-bone">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview URL, not eligible for next/image */}
                  <img src={personPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                </div>
              )}
              <p className="text-[13px] text-es-mute font-cormorant italic text-center">
                {stage === "uploading" ? "Uploading your photo…" : "Creating your preview — usually takes 5–17 seconds…"}
              </p>
            </div>
          )}

          {stage === "error" && (
            <div className="text-center py-6">
              <p className="text-[13px] text-red-600 mb-4">{error}</p>
              <button onClick={() => setStage("intro")} className="es-btn-outline-ink">
                Try Again
              </button>
            </div>
          )}

          {stage === "result" && resultUrl && (
            <div>
              <div className="relative w-full overflow-hidden bg-es-bone mb-4" style={{ aspectRatio: "3/4" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- external/provider-controlled result URL, domain unknown ahead of time */}
                <img
                  src={showBefore && personPreview ? personPreview : resultUrl}
                  alt="Try-on preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <p className="text-[11px] text-es-mute text-center mb-4">
                AI preview — style visualisation, not an exact fit guarantee.
              </p>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setShowBefore((v) => !v)} className="es-btn-outline-ink flex-1">
                  {showBefore ? "Show Result" : "Show Original"}
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      void navigator.share({ title: `${productName} — Elite Style Co.`, url: resultUrl });
                    }
                  }}
                  className="es-btn-outline-ink flex-1"
                >
                  Share
                </button>
              </div>
              <button onClick={() => setStage("intro")} className="es-btn-plum w-full">
                Try Another Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
