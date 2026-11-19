import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Elite Style Co. | Online Fashion & Thrift Store in Nairobi, Kenya",
    template: "%s | Elite Style Co. Nairobi",
  },
  description:
    "Shop women's, men's & children's fashion online in Nairobi. New collection + thrift store. KES pricing, M-Pesa checkout, 24-hour delivery across Kenya. Shop 35, Stanbank House, Moi Avenue.",
  keywords: [
    "online fashion store Nairobi", "clothing shop Kenya", "women fashion Nairobi",
    "men fashion Kenya", "thrift store Nairobi", "buy clothes online Kenya",
    "M-Pesa fashion", "Elite Style Co", "Stanbank House boutique", "Nairobi CBD fashion",
  ],
  authors: [{ name: "Elite Style Co." }],
  creator: "Elite Style Co.",
  verification: { google: "OOxaMqiQ_GiXwfRiTJoMdu6EM9QsTHU_qiwHTKCmP5E" },
  // No root canonical — each page sets its own via metadata.alternates.canonical
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "Elite Style Co.",
    title: "Elite Style Co. | Dressed, generation to generation",
    description: "A maison built in Nairobi, for the woman, the man, and the children who follow. Atelier-led cuts, honest fabrics, KES pricing. M-Pesa checkout.",
    url: "/",
    images: [{ url: "/icons/og-image.png", width: 1200, height: 630, alt: "Elite Style Co. — Nairobi fashion" }],
  },
  twitter: { card: "summary_large_image", title: "Elite Style Co. | Dressed, generation to generation", images: ["/icons/og-image.png"] },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Elite Style Co." },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        {children}
        <Analytics />
        <AnalyticsScripts />
      </body>
    </html>
  );
}
