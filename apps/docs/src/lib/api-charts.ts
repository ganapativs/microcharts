/**
 * The per-chart JSON endpoints behind `/api/charts.json` and
 * `/api/charts/<slug>.json`.
 *
 * `/catalog.json` is the whole catalog in one document — 290 kB, because it
 * carries all 106 charts. An agent wiring up one chart needs one entry. These
 * two endpoints slice the same `buildCatalog()` output, so a chart's shape here
 * is byte-identical to its shape there: one generator, no second data model to
 * keep in sync.
 *
 * A per-chart document is self-contained on purpose. It carries `sharedProps`
 * and `howToRead` alongside the entry, because a chart's full prop surface is
 * shared + chart-specific — an agent that fetched only the entry would write
 * props that do not exist.
 */
import { buildCatalog } from "./catalog-json";
import { abs } from "./site";

type Catalog = ReturnType<typeof buildCatalog>;
type CatalogChart = Catalog["charts"][number];

/** `buildCatalog` reads every chart's client source; memoise across the export. */
let cached: Catalog | null = null;
function catalog(): Catalog {
  cached ??= buildCatalog();
  return cached;
}

/** Where a chart is documented, in all three representations. */
function locations(slug: string) {
  return {
    api: abs(`/api/charts/${slug}.json`),
    docs: abs(`/docs/charts/${slug}`),
    markdown: abs(`/docs/charts/${slug}.md`),
  };
}

export type ChartIndex = ReturnType<typeof buildChartIndex>;

/** Every chart type, one line each, with the URL that expands it. */
export function buildChartIndex() {
  const c = catalog();
  return {
    package: c.package,
    homepage: c.homepage,
    catalog: abs("/catalog.json"),
    count: c.charts.length,
    charts: c.charts.map((chart) => ({
      name: chart.name,
      slug: chart.slug,
      status: chart.status,
      collection: chart.collection,
      tagline: chart.tagline,
      ...locations(chart.slug),
    })),
  };
}

export type ChartDocument = {
  package: string;
  homepage: string;
  howToRead: string;
  api: string;
  docs: string;
  markdown: string;
  sharedProps: Catalog["sharedProps"];
  chart: CatalogChart;
};

/** One chart's full API surface, or `null` when no such chart exists. */
export function buildChartDocument(slug: string): ChartDocument | null {
  const c = catalog();
  const chart = c.charts.find((entry) => entry.slug === slug);
  if (!chart) return null;

  return {
    package: c.package,
    homepage: c.homepage,
    howToRead: c.howToRead,
    ...locations(slug),
    sharedProps: c.sharedProps,
    chart,
  };
}

/** Every slug the per-chart endpoint answers to. */
export function chartSlugs(): string[] {
  return catalog().charts.map((c) => c.slug);
}
