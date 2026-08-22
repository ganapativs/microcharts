import type { Metadata } from "next";
import { docsMeta } from "@/lib/metadata";
import { jsonLdScript } from "@/lib/jsonld";
import { SITE, abs } from "@/lib/site";
import { SHOWCASE } from "@/lib/showcase";
import { ExamplesGallery } from "./examples-gallery";

export const metadata: Metadata = docsMeta({
  title: "Examples — microcharts in real apps",
  description:
    "Seven production-grade apps built with @microcharts/react from npm — a trading terminal, a print magazine, an eval console — exercising every chart type in the catalog.",
  path: "/examples",
  markdown: "/examples.md",
  keywords: [
    "microcharts examples",
    "react chart examples",
    "sparkline examples",
    "inline chart examples",
    "react server components charts",
  ],
});

/** ItemList of the example apps, so a SERP can surface the collection. */
function itemListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "microcharts examples",
    url: abs("/examples"),
    numberOfItems: SHOWCASE.length,
    itemListElement: SHOWCASE.map((app, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: `${app.name} — microcharts example`,
        applicationCategory: "DeveloperApplication",
        description: app.blurb,
        url: abs(`/examples/${app.slug}`),
        isBasedOn: SITE.pkg,
      },
    })),
  };
}

export default function ExamplesPage() {
  return (
    <>
      <script type="application/ld+json">{jsonLdScript(itemListJsonLd())}</script>
      <ExamplesGallery />
    </>
  );
}
