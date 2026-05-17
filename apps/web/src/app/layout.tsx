import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nairobi Fashion | Kenyan-Made Style",
    template: "%s | Nairobi Fashion",
  },
  description:
    "Shop men's, women's, and children's fashion made in Kenya. Fast mobile checkout with M-Pesa. Flagship store in Nairobi.",
  keywords: ["Nairobi fashion", "Kenya clothes", "African fashion", "M-Pesa shopping"],
  authors: [{ name: "Nairobi Fashion" }],
  creator: "Nairobi Fashion",
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "Nairobi Fashion",
    images: [{ url: "/icons/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/icons/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NairobiFash",
  },
};

export const viewport: Viewport = {
  themeColor: "#c8832a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
