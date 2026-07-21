import { describe, expect, it } from "vitest";
import {
  DOCS_INTRO_FAQS,
  chartCatalogJsonLd,
  faqJsonLd,
  jsonLdScript,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "./jsonld";
import { chartSeoTitle, chartsIndexDescription, SEO_KEYWORDS } from "./seo";
import { docsMeta } from "./metadata";
import { SITE } from "./site";

describe("seo helpers", () => {
  it("builds keyword-rich chart titles", () => {
    expect(chartSeoTitle("Sparkline")).toBe("Sparkline React Chart");
  });

  it("describes the charts index with catalog count + package", () => {
    const d = chartsIndexDescription();
    expect(d).toMatch(/\d+ React microcharts/);
    expect(d).toContain(SITE.pkg);
  });

  it("keeps high-intent keywords for non-Google crawlers", () => {
    expect(SEO_KEYWORDS).toContain("react sparkline");
    expect(SEO_KEYWORDS).toContain("inline charts react");
  });
});

describe("docsMeta", () => {
  it("emits article OG type + absolute canonical", () => {
    const m = docsMeta({
      title: "Sparkline React Chart",
      description: "Tiny trend",
      path: "/docs/charts/sparkline",
      type: "article",
    });
    expect((m.openGraph as { type?: string } | undefined)?.type).toBe("article");
    expect(m.alternates?.canonical).toBe(`${SITE.url}/docs/charts/sparkline`);
    expect(m.robots).toMatchObject({ index: true, follow: true });
  });
});

describe("json-ld", () => {
  it("escapes < in script payloads", () => {
    expect(jsonLdScript({ a: "<b>" })).toContain("\\u003c");
  });

  it("declares Organization + WebSite + SoftwareApplication", () => {
    expect(organizationJsonLd()["@type"]).toBe("Organization");
    expect(websiteJsonLd().alternateName).toBe(SITE.pkg);
    expect(softwareApplicationJsonLd().featureList?.length).toBeGreaterThan(3);
  });

  it("builds a catalog ItemList with absolute chart URLs", () => {
    const ld = chartCatalogJsonLd([{ name: "Sparkline", slug: "sparkline", tagline: "trend" }]);
    expect(ld.numberOfItems).toBe(1);
    expect(ld.itemListElement[0]?.url).toBe(`${SITE.url}/docs/charts/sparkline`);
  });

  it("ships FAQPage schema matching the intro FAQ set", () => {
    const ld = faqJsonLd(DOCS_INTRO_FAQS);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(DOCS_INTRO_FAQS.length);
    expect(ld.mainEntity[0]?.name).toBe(DOCS_INTRO_FAQS[0]!.q);
  });
});
