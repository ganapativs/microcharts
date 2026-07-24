import { HomeHero } from "@/components/home/home-hero";
import { HomeGrammarSection } from "@/components/home/home-grammar-section";
import { HomeCatalogSection } from "@/components/home/home-catalog-section";
import { HomeSurfacesSection } from "@/components/home/home-surfaces-section";
import { HomeModelsSection } from "@/components/home/home-models-section";
import { HomeA11ySection } from "@/components/home/home-a11y-section";
import { HomeCostSection } from "@/components/home/home-cost-section";
import { HomeWildSection } from "@/components/home/home-wild-section";
import { HomeThemingSection } from "@/components/home/home-theming-section";
import { HomeCtaSection } from "@/components/home/home-cta-section";
import { CATALOG } from "@/lib/docs-facts";

/** Homepage section order. Facts: models 04, accessibility 05, sizes 06,
 *  theming 07. The examples (08) are the last act before the CTA — the page
 *  climaxes on seven real apps, then converts. Refusals close 02. See
 *  apps/docs/DESIGN.md. */
export default function HomePage() {
  const total = CATALOG.total;

  return (
    <>
      <HomeHero catalogTotal={total} />
      <HomeGrammarSection catalogTotal={total} />
      <HomeCatalogSection />
      <HomeSurfacesSection />
      <HomeModelsSection />
      <HomeA11ySection />
      <HomeCostSection />
      <HomeThemingSection />
      <HomeWildSection />
      <HomeCtaSection />
    </>
  );
}
