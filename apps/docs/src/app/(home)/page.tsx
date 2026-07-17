import { HomeHero } from "@/components/home/home-hero";
import { HomeProblemSection } from "@/components/home/home-problem-section";
import { HomeGrammarSection } from "@/components/home/home-grammar-section";
import { HomeCatalogSection } from "@/components/home/home-catalog-section";
import { HomePrinciplesSection } from "@/components/home/home-principles-section";
import { HomeModelsSection } from "@/components/home/home-models-section";
import { HomeRobustnessSection } from "@/components/home/home-robustness-section";
import { HomeSurfacesSection } from "@/components/home/home-surfaces-section";
import { HomeWildSection } from "@/components/home/home-wild-section";
import { HomeReceiptsSection } from "@/components/home/home-receipts-section";
import { HomeThemingSection } from "@/components/home/home-theming-section";
import { HomeCtaSection } from "@/components/home/home-cta-section";
import { CATALOG } from "@/lib/docs-facts";

/**
 * The homepage tells one story: interfaces now answer in sentences; charts
 * never came along; microcharts is the missing typography of data. Every
 * visual on the page is a real library component doing its actual job —
 * see apps/docs/DESIGN.md for the direction rationale.
 */
export default function HomePage() {
  const total = CATALOG.total;

  return (
    <>
      <HomeHero catalogTotal={total} />
      <HomeProblemSection />
      <HomeGrammarSection catalogTotal={total} />
      <HomeCatalogSection />
      <HomePrinciplesSection />
      <HomeModelsSection catalogTotal={total} />
      <HomeRobustnessSection />
      <HomeSurfacesSection />
      <HomeWildSection />
      <HomeReceiptsSection />
      <HomeThemingSection />
      <HomeCtaSection />
    </>
  );
}
