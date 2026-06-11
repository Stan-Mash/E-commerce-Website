// Image embeddings via Jina CLIP v2 (multimodal, 1024 dims) over plain HTTP.
// No-ops when JINA_API_KEY is unset so visual search degrades gracefully,
// mirroring the email/B2C optional-provider pattern.

const JINA_URL = "https://api.jina.ai/v1/embeddings";
const MODEL = "jina-clip-v2";
export const EMBEDDING_DIMS = 1024;

export function isVisualSearchConfigured(): boolean {
  return !!process.env.JINA_API_KEY;
}

type JinaInput = { image: string } | { text: string };

async function embed(inputs: JinaInput[]): Promise<number[][]> {
  const res = await fetch(JINA_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.JINA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, dimensions: EMBEDDING_DIMS, input: inputs }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Jina ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data: Array<{ index: number; embedding: number[] }> };
  return [...json.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

// `image` accepts a public URL or raw base64 (no data: prefix).
export async function embedImages(images: string[]): Promise<number[][]> {
  if (images.length === 0) return [];
  return embed(images.map((image) => ({ image })));
}

export async function embedText(text: string): Promise<number[]> {
  const [v] = await embed([{ text }]);
  return v!;
}

// pgvector literal: "[0.1,0.2,...]"
export function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}
