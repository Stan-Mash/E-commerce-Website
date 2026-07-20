"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AskStylist({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, messages: next }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-label uppercase text-es-champagne-dk border border-es-champagne px-4 py-2.5 hover:bg-es-champagne-lt transition-colors"
        aria-expanded={open}
      >
        <MessageCircle size={14} strokeWidth={1.75} />
        Ask the Stylist
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Ask the Stylist"
          className="mt-3 border border-es-hair bg-white flex flex-col"
          style={{ maxHeight: 420 }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-es-hair">
            <span className="text-[11px] tracking-label uppercase font-semibold text-es-ink">Ask the Stylist</span>
            <button onClick={() => setOpen(false)} aria-label="Close stylist chat" className="text-es-mute hover:text-es-ink">
              <X size={16} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ minHeight: 120 }}>
            {messages.length === 0 && (
              <p className="text-[13px] text-es-mute font-cormorant italic">
                Ask what to pair this with, how it fits, or styling tips — I only recommend real,
                in-stock pieces from the collection.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-[13px] leading-relaxed max-w-[85%] px-3 py-2 ${
                  m.role === "user"
                    ? "self-end bg-es-ink text-white"
                    : "self-start bg-es-paper text-es-ink"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && <div className="self-start text-[12px] text-es-mute">Thinking…</div>}
            {error && <div className="text-[12px] text-red-600">{error}</div>}
          </div>

          <form onSubmit={send} className="flex gap-2 p-3 border-t border-es-hair">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What goes with this?"
              disabled={loading}
              className="flex-1 text-[13px] px-3 py-2 border border-es-hair outline-none focus-visible:ring-2 focus-visible:ring-es-champagne-dk"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="es-btn-plum px-3"
              style={{ minWidth: 44 }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
