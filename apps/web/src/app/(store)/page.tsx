import { Hero }             from "@/components/es/homepage/Hero";
import { HousePrinciple }  from "@/components/es/homepage/HousePrinciple";
import { FeaturedGrid }    from "@/components/es/homepage/FeaturedGrid";
import { MpesaMoment }     from "@/components/es/homepage/MpesaMoment";
import { FamilyEditorial } from "@/components/es/homepage/FamilyEditorial";
import { AtelierBanner }   from "@/components/es/homepage/AtelierBanner";
import { SaleBand }        from "@/components/es/homepage/SaleBand";
import { Journal }         from "@/components/es/homepage/Journal";
import { Newsletter }      from "@/components/es/homepage/Newsletter";
import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 60;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Elite Style Co.",
  url: absoluteUrl("/"),
  logo: absoluteUrl("/icons/icon-512x512.png"),
  telephone: "+254142424802",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Shop 35, 4th Floor, Wing B, Stanbank House, Moi Avenue",
    addressLocality: "Nairobi",
    addressCountry: "KE",
  },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Hero productCount={productCount} />
      <HousePrinciple />
      <FeaturedGrid />
      <MpesaMoment />
      <FamilyEditorial />
      <AtelierBanner />
      <SaleBand />
      <Journal />
      <Newsletter />
    </div>
  );
}
