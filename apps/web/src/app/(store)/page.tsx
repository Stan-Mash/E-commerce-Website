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

export const revalidate = 60;

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
