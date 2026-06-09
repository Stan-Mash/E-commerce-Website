import { AnnouncementBar } from "@/components/es/homepage/AnnouncementBar";
import { SiteHeader }      from "@/components/es/homepage/SiteHeader";
import { SiteFooter }      from "@/components/es/homepage/SiteFooter";
import { CartProvider }    from "@/components/checkout/CartProvider";
import { CartDrawer }      from "@/components/es/CartDrawer";
import CookieConsent       from "@/components/store/CookieConsent";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <AnnouncementBar />
        <SiteHeader />
        <CartDrawer />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CookieConsent />
      </div>
    </CartProvider>
  );
}
