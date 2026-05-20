import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://elitestyle.co.ke"),
  title: {
    default: "Elite Style Co. | Dressed, generation to generation",
    template: "%s | Elite Style Co.",
  },
  description:
    "A maison built in Nairobi — for the woman, the man, and the children who follow. Atelier-led cuts, honest fabrics, KES pricing. Complimentary delivery across Kenya.",
  keywords: ["Elite Style", "Nairobi fashion", "luxury clothing Kenya", "bespoke tailoring Nairobi", "M-Pesa fashion"],
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
  themeColor: "#3d1a4a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Urbanist (Century Gothic web equivalent) + editorial display fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,700;0,6..96,800;0,6..96,900;1,6..96,400;1,6..96,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
