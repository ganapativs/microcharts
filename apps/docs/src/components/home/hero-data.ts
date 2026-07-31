import { CATALOG, BENCH, INTERACTIVE_SIZES } from "@/lib/docs-facts";
import { STABLE_CHARTS } from "@/lib/charts/entries";
import { CHART_GZIP } from "@/lib/stats";
import { SHOWCASE } from "@/lib/showcase";
import type { HeroData } from "./hero-frames";

/**
 * The fold's four series, measured, read on the SERVER.
 *
 * Server-only by design: `entries.generated.json` is ~236 kB and this module
 * touches it, so `ActOne` calls it and hands the result to `HeroSentence` as a
 * prop. Importing this file from a client component would ship the whole
 * registry to the browser to plot 105 numbers. Sources are
 * `chart-sizes.json` (gzip), `bench-summary.json` (rendered SVG), the entries
 * registry (the stable catalog) and `showcase.ts` (the example apps).
 */

const asc = (xs: readonly number[]) => [...xs].sort((a, b) => a - b);

/** Interactive gzip for one slug — every frame's mark is a real catalog entry. */
const kbOf = (slug: string) => CHART_GZIP[slug]?.interactive ?? 0;

export function heroData(): HeroData {
  return {
    // 105 of 106 — `wind-barb` ships static only.
    sizes: asc(INTERACTIVE_SIZES),
    svgBytes: asc(
      STABLE_CHARTS.map((c) => BENCH.chart(c.slug)?.avgBytes).filter(
        (n): n is number => typeof n === "number",
      ),
    ),
    collections: Object.entries(CATALOG.collections).map(([label, value]) => ({ label, value })),
    apps: SHOWCASE.map((a) => a.charts.length),
    total: CATALOG.total,
    kb: {
      rugStrip: kbOf("rug-strip"),
      segmentedBar: kbOf("segmented-bar"),
      sparkBar: kbOf("sparkbar"),
      sparkline: kbOf("sparkline"),
    },
  };
}
