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

/**
 * The homepage tells one story, in the order a human decides:
 *
 *   hero      — the claim, demonstrated live: an answer with charts inside it
 *   01 grammar — you just watched text become charts; here is the trick
 *   02 catalog — what's in the box (and the shapes refused, on purpose)
 *   03 surfaces — where a human uses it: product UI, reports, cells, prose
 *   04 models  — the AI chapter (dark band): your tools first, then the
 *                machine docs, then a small safe-to-emit proof
 *   05 cost    — the size argument, AFTER the reader wants the thing
 *   06 examples · 07 theming · CTA
 *
 * One home per fact: sizes/deps/client-JS live in 05, the machine-facing
 * story lives in 04, refusals close 02. Every visual is a real library
 * component doing its actual job — see apps/docs/DESIGN.md.
 */
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
