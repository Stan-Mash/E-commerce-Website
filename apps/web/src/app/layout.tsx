import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Cormorant_Garamond } from "next/font/google";
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
  metadataBase: new URL("https://elitestyle.co.ke"),
  title: {
    default: "Elite Style Co. | Dressed, generation to generation",
    template: "%s | Elite Style Co.",
  },
  description:
    "A maison built in Nairobi — for the woman, the man, and the children who follow. Atelier-led cuts, honest fabrics, KES pricing. Free delivery within Nairobi CBD.",
  keywords: ["Elite Style", "Nairobi fashion", "premium clothing Kenya", "curated fashion Nairobi", "M-Pesa fashion"],
  authors: [{ name: "Elite Style Co." }],
  creator: "Elite Style Co.",
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "Elite Style Co.",
    images: [{ url: "/icons/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/icons/og-image.png"] },
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
      </body>
    </html>
  );
}
