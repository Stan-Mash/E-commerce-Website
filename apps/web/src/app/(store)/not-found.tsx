import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-24">
      <p className="text-[11px] tracking-[.48em] uppercase text-es-gold mb-4">Elite Style Co.</p>
      <p className="font-cormorant italic text-2xl text-es-mute mb-8 max-w-md">
        This page has stepped out of the collection — it may have moved, sold out, or never existed.
      </p>
      <Link href="/" className="es-btn-plum">
        Back to Home
      </Link>
    </main>
  );
}
