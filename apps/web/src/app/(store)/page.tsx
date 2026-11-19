import type { Metadata } from "next";
import { Hero }             from "@/components/es/homepage/Hero";
import { HousePrinciple }  from "@/components/es/homepage/HousePrinciple";
import { FeaturedGrid }    from "@/components/es/homepage/FeaturedGrid";
import { MpesaMoment }     from "@/components/es/homepage/MpesaMoment";
import { FamilyEditorial } from "@/components/es/homepage/FamilyEditorial";
import { DualShopSection } from "@/components/es/homepage/DualShopSection";
import { AtelierBanner }      from "@/components/es/homepage/AtelierBanner";
import { StyleFinderBanner } from "@/components/es/homepage/StyleFinderBanner";
import { SaleBand }        from "@/components/es/homepage/SaleBand";
import { Journal }         from "@/components/es/homepage/Journal";
import { Newsletter }      from "@/components/es/homepage/Newsletter";
import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { absoluteUrl, jsonLdString } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Elite Style Co. | Online Fashion & Thrift Store in Nairobi, Kenya",
  description:
    "Shop women's, men's & children's fashion online in Nairobi. New collection + thrift store with 400+ styles. KES pricing, M-Pesa checkout, 24-hour delivery across Kenya.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Elite Style Co. | Online Fashion & Thrift Store in Nairobi, Kenya",
    description: "Shop women's, men's & children's fashion in Nairobi. KES pricing, M-Pesa checkout, 24-hour delivery across Kenya.",
    url: "/",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["ClothingStore", "OnlineStore"],
  "@id": absoluteUrl("/#store"),
  name: "Elite Style Co.",
  url: absoluteUrl("/"),
  logo: absoluteUrl("/icons/icon-512x512.png"),
  image: absoluteUrl("/icons/og-image.png"),
  telephone: "+254142424802",
  email: "support@elitestyle.co.ke",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Shop 35, 4th Floor, Wing B, Stanbank House, Moi Avenue",
    addressLocality: "Nairobi",
    addressRegion: "Nairobi County",
    postalCode: "00100",
    addressCountry: "KE",
  },
  geo: { "@type": "GeoCoordinates", latitude: -1.2833, longitude: 36.8211 },
  openingHoursSpecification: [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    opens: "09:00",
    closes: "18:00",
  }],
  priceRange: "KES 400 – KES 15,000",
  currenciesAccepted: "KES",
  paymentAccepted: "M-Pesa, Cash, Visa, Mastercard",
  hasMap: "https://www.google.com/maps/search/?api=1&query=Stanbank+House+Moi+Avenue+Nairobi",
  sameAs: [
    "https://instagram.com/elit_estyleco",
    "https://tiktok.com/@elitestyleco0",
    "https://facebook.com/EliteStyle",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Elite Style Co.",
  url: absoluteUrl("/"),
  potentialAction: {
    "@type": "SearchAction",
    target: `${absoluteUrl("/search")}?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

async function getActiveProductCount(): Promise<number> {
  try {
    const supabase = createPublicSupabaseClient();
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function HomePage() {
  const productCount = await getActiveProductCount();
  return (
    <div style={{ background: "#ffffff" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(websiteSchema) }}
      />
      <Hero productCount={productCount} />
      <HousePrinciple />
      <FeaturedGrid />
      <MpesaMoment />
      <FamilyEditorial />
      <DualShopSection />
      <StyleFinderBanner />
      <AtelierBanner />
      <SaleBand />
      <Journal />
      <Newsletter />
    </div>
  );
}
