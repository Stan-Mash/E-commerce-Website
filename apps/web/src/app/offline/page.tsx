import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 bg-es-paper">
      <p className="text-[11px] tracking-[.48em] uppercase text-es-gold mb-4">Elite Style Co.</p>
      <p className="font-cormorant italic text-2xl text-es-mute mb-8 max-w-md">
        You&apos;re offline. Reconnect to keep browsing the collection — anything already in your
        bag is still saved.
      </p>
      <Link href="/" className="es-btn-plum">
        Try Again
      </Link>
    </main>
  );
}
