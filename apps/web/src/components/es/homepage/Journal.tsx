import Link from "next/link";

const POSTS = [
  {
    tag: "Style Notes",
    title: "Dressing for the boardroom you haven't seen yet.",
    desc: "A four-piece capsule that works from 8am meetings to evening dinners — and why less is always more.",
    readTime: "4 min read",
  },
  {
    tag: "How It Works",
    title: "Why M-Pesa checkout is the only way to shop in Kenya.",
    desc: "No card. No foreign fees. Just your Safaricom number and a PIN. Here's why 15 million Kenyans agree.",
    readTime: "3 min read",
  },
  {
    tag: "New Arrivals",
    title: "The pieces our buyers picked first this season.",
    desc: "From the tweed co-ord to the everyday tote — our lead buyer breaks down what sold out in 48 hours.",
    readTime: "5 min read",
  },
] as const;

export function Journal() {
  return (
    <section className="bg-white py-20 px-8 md:px-10 border-t border-es-hair">
      <div className="max-w-[1400px] mx-auto">

        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="es-eyebrow mb-2">Journal</p>
            <h2 className="font-cormorant font-semibold text-es-ink m-0 tracking-[-0.02em]"
                style={{ fontSize: "clamp(26px, 3vw, 38px)" }}>
              From the Elite Style edit
            </h2>
          </div>
          <Link href="/journal" className="font-sans text-[13px] font-semibold text-es-ink no-underline border-b-2 border-es-ink pb-0.5 hover:text-es-champagne-dk hover:border-es-champagne-dk transition-colors whitespace-nowrap">
            All Articles →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-es-hair">
          {POSTS.map((p) => (
            <article key={p.title} className="bg-white p-10 group">
              <div className="mb-6">
                <span className="font-sans text-[10px] font-semibold tracking-label uppercase text-es-champagne-dk border border-es-champagne px-2.5 py-1">
                  {p.tag}
                </span>
              </div>

              <h3 className="font-cormorant font-semibold text-es-ink mb-3.5 leading-[1.2] tracking-[-0.02em] group-hover:text-es-champagne-dk transition-colors"
                  style={{ fontSize: "clamp(18px, 2vw, 22px)" }}>
                {p.title}
              </h3>

              <p className="font-sans text-[13px] text-es-mute leading-relaxed mb-7">
                {p.desc}
              </p>

              <div className="flex items-center justify-between">
                <span className="font-sans text-[11px] text-es-faint tracking-wide">
                  {p.readTime}
                </span>
                <Link href="/journal" className="font-sans text-[11px] font-semibold text-es-char no-underline tracking-label uppercase border-b border-es-char pb-0.5 hover:text-es-champagne-dk hover:border-es-champagne-dk transition-colors">
                  Read →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
