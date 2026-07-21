import { HomeHero } from "@/components/home/home-hero";
import { HomeGrammarSection } from "@/components/home/home-grammar-section";
import { HomeCatalogSection } from "@/components/home/home-catalog-section";
import { HomeSurfacesSection } from "@/components/home/home-surfaces-section";
import { HomeModelsSection } from "@/components/home/home-models-section";
import { HomeCostSection } from "@/components/home/home-cost-section";
import { HomeWildSection } from "@/components/home/home-wild-section";
import { HomeThemingSection } from "@/components/home/home-theming-section";
import { HomeCtaSection } from "@/components/home/home-cta-section";
import { CATALOG } from "@/lib/docs-facts";

/** Homepage section order. Facts: sizes in 05, models in 04, refusals close 02.
 *  See apps/docs/DESIGN.md. */
export default function HomePage() {
  const total = CATALOG.total;

  return (
    <>
      <HomeHero catalogTotal={total} />
      <HomeGrammarSection catalogTotal={total} />
      <HomeCatalogSection />
      <HomeSurfacesSection />
      <HomeModelsSection />
      <HomeCostSection />
      <HomeWildSection />
      <HomeThemingSection />
      <HomeCtaSection />
    </>
  );
}
