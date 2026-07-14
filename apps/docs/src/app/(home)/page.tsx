import { HomeAiSection } from "@/components/home/home-ai-section";
import { HomeA11ySection } from "@/components/home/home-a11y-section";
import { HomeContextsSection } from "@/components/home/home-contexts-section";
import { HomeCtaSection } from "@/components/home/home-cta-section";
import { HomeEngineeringSection } from "@/components/home/home-engineering-section";
import { HomeHero } from "@/components/home/home-hero";
import { HomePerformanceSection } from "@/components/home/home-performance-section";
import { HomePrimitivesSection } from "@/components/home/home-primitives-section";
import { CATALOG } from "@/lib/docs-facts";

export default function HomePage() {
  const total = CATALOG.total;

  return (
    <>
      <HomeHero catalogTotal={total} />
      <HomeAiSection catalogTotal={total} />
      <HomeA11ySection />
      <HomePerformanceSection />
      <HomePrimitivesSection catalogTotal={total} />
      <HomeContextsSection />
      <HomeEngineeringSection />
      <HomeCtaSection />
    </>
  );
}
