import { Hero }             from "@/components/es/homepage/Hero";
import { HousePrinciple }  from "@/components/es/homepage/HousePrinciple";
import { FeaturedGrid }    from "@/components/es/homepage/FeaturedGrid";
import { MpesaMoment }     from "@/components/es/homepage/MpesaMoment";
import { FamilyEditorial } from "@/components/es/homepage/FamilyEditorial";
import { AtelierBanner }   from "@/components/es/homepage/AtelierBanner";
import { SaleBand }        from "@/components/es/homepage/SaleBand";
import { Journal }         from "@/components/es/homepage/Journal";
import { Newsletter }      from "@/components/es/homepage/Newsletter";

export default function HomePage() {
  return (
    <div style={{ background: "#ffffff" }}>
      <Hero />
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
