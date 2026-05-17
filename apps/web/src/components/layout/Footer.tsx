import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-ink text-white/70 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-xl font-bold text-white mb-2">
              Nairobi<span className="text-brand-400">Fashion</span>
            </p>
            <p className="text-xs leading-relaxed">
              Kenyan-made fashion. Flagship store in Westlands, Nairobi.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white text-sm mb-3">Shop</p>
            <ul className="space-y-2 text-xs">
              {["Women", "Men", "Kids", "New Arrivals", "Sale"].map((l) => (
                <li key={l}>
                  <Link href={`/products?category=${l.toLowerCase()}`} className="hover:text-white transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white text-sm mb-3">Help</p>
            <ul className="space-y-2 text-xs">
              {["Size Guide", "Returns", "Shipping", "FAQ", "Contact"].map((l) => (
                <li key={l}>
                  <Link href={`/help/${l.toLowerCase().replace(" ", "-")}`} className="hover:text-white transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white text-sm mb-3">Visit Us</p>
            <address className="not-italic text-xs leading-relaxed space-y-1">
              <p>Westgate Mall, 3rd Floor</p>
              <p>Westlands, Nairobi</p>
              <p className="mt-2">Mon–Sat: 9am–8pm</p>
              <p>Sun: 11am–6pm</p>
            </address>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} Nairobi Fashion. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
            <span className="flex items-center gap-1">
              <span>🇰🇪</span> Made in Kenya
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
