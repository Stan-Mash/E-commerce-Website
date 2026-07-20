// Provider abstraction for AI garment try-on, so the underlying service
// (FASHN today; fal.ai/Kling Kolors, or a self-hosted IDM-VTON/OOTDiffusion
// instance later) can be swapped without touching any UI or route code —
// everything above this file talks only to `getTryOnProvider()`.
//
// NOTE: this FASHN implementation is written against FASHN's documented
// tryon-v1 API contract (POST /v1/run to start an async job, poll GET
// /v1/status/{id}) but has not been exercised against a live FASHN account
// — there was no API key available to test with while building this. Smoke
// test end-to-end before flipping TRYON_ENABLED=true in production, and
// check FASHN's current docs (docs.fashn.ai) for any field/endpoint drift.

export type TryOnJobStatus = "pending" | "completed" | "failed";

export interface TryOnProvider {
  /** Kick off an async generation job. Returns the provider's job id. */
  generate(params: { personImageUrl: string; garmentImageUrl: string }): Promise<
    { ok: true; jobId: string } | { ok: false; error: string }
  >;
  /** Poll job status. resultUrl is set only when status === "completed". */
  checkStatus(jobId: string): Promise<
    { ok: true; status: TryOnJobStatus; resultUrl?: string } | { ok: false; error: string }
  >;
}

const FASHN_BASE_URL = "https://api.fashn.ai/v1";

class FashnProvider implements TryOnProvider {
  private get apiKey(): string {
    return process.env.FASHN_API_KEY ?? "";
  }

  async generate(params: { personImageUrl: string; garmentImageUrl: string }) {
    try {
      const res = await fetch(`${FASHN_BASE_URL}/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_name: "tryon-v1.6",
          inputs: {
            model_image: params.personImageUrl,
            garment_image: params.garmentImageUrl,
          },
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { ok: false as const, error: `FASHN ${res.status}: ${text.slice(0, 200)}` };
      }
      const data = await res.json();
      const jobId = data.id ?? data.job_id;
      if (!jobId) return { ok: false as const, error: "FASHN response missing job id" };
      return { ok: true as const, jobId };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  }

  async checkStatus(jobId: string) {
    try {
      const res = await fetch(`${FASHN_BASE_URL}/status/${encodeURIComponent(jobId)}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { ok: false as const, error: `FASHN ${res.status}: ${text.slice(0, 200)}` };
      }
      const data = await res.json();
      const status: string = data.status ?? "";
      if (status === "completed") {
        const resultUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        return { ok: true as const, status: "completed" as const, resultUrl };
      }
      if (status === "failed" || status === "error") {
        return { ok: true as const, status: "failed" as const };
      }
      return { ok: true as const, status: "pending" as const };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  }
}

let cached: TryOnProvider | null = null;

export function getTryOnProvider(): TryOnProvider {
  if (!cached) cached = new FashnProvider();
  return cached;
}

export function isTryOnConfigured(): boolean {
  return process.env.TRYON_ENABLED === "true" && !!process.env.FASHN_API_KEY;
}

// Categories eligible for try-on — garments only, per spec (skip jewelry/bags for v1).
const TRYON_CATEGORIES = new Set(["women", "woman", "men", "man", "children", "child"]);

export function isCategoryEligibleForTryOn(category: string): boolean {
  return TRYON_CATEGORIES.has(category.toLowerCase());
}
