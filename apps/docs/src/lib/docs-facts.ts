/**
 * Derived guide figures (registry, chart-sizes.json, bench-summary.json).
 * Entries JSON only — not component registry (avoids interactive graph in text routes).
 * Guarded by docs-facts.test.ts / docs-claims.test.ts.
 */
import { CHARTS, STABLE_CHARTS } from "./charts/entries";
import { CHART_GZIP } from "./stats";
import bench from "./bench-summary.json";

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const round2 = (n: number) => Math.round(n * 100) / 100;

const byCollection = { core: 0, decision: 0, expressive: 0, frontier: 0 };
for (const c of STABLE_CHARTS) byCollection[c.collection] += 1;

export const CATALOG = {
  total: STABLE_CHARTS.length,
  registered: CHARTS.length,
  collections: byCollection,
} as const;

// Registry charts only — exclude non-chart subpaths from catalog size stats.
const staticSizes = STABLE_CHARTS.map((c) => CHART_GZIP[c.slug]?.static).filter(
  (n): n is number => typeof n === "number",
);
const interactiveSizes = STABLE_CHARTS.map((c) => CHART_GZIP[c.slug]?.interactive).filter(
  (n): n is number => typeof n === "number",
);

export const STATIC_SIZES = staticSizes;
export const INTERACTIVE_SIZES = interactiveSizes;
export const SIZE_MARKETING = "~2–7 kB interactive · ~1–4 kB static";

export const SIZE = {
  count: staticSizes.length,
  min: Math.min(...staticSizes),
  median: round2(median(staticSizes)),
  max: Math.max(...staticSizes),
  interactiveCount: interactiveSizes.length,
  interactiveMin: Math.min(...interactiveSizes),
  interactiveMedian: round2(median(interactiveSizes)),
  interactiveMax: Math.max(...interactiveSizes),
  under1_5: staticSizes.filter((n) => n <= 1.5).length,
  under2: staticSizes.filter((n) => n <= 2).length,
  under3: staticSizes.filter((n) => n <= 3).length,
  over3: STABLE_CHARTS.map((c) => ({ slug: c.slug, name: c.name, kB: CHART_GZIP[c.slug]?.static }))
    .filter((c): c is { slug: string; name: string; kB: number } => (c.kB ?? 0) > 3)
    .sort((a, b) => b.kB - a.kB),
} as const;

const sized = STABLE_CHARTS.map((c) => ({
  slug: c.slug,
  name: c.name,
  kB: CHART_GZIP[c.slug]?.static,
}))
  .filter((c): c is { slug: string; name: string; kB: number } => typeof c.kB === "number")
  .sort((a, b) => a.kB - b.kB);

/** Smallest / median / largest static chart across the catalog. */
export const SIZE_SPAN = [
  { ...sized[0]!, role: "smallest" },
  { ...sized[Math.floor(sized.length / 2)]!, role: "median" },
  { ...sized[sized.length - 1]!, role: "largest" },
] as const;

export function sizeRow(slug: string) {
  const c = CHART_GZIP[slug];
  return { slug, static: c?.static, interactive: c?.interactive };
}

export const BENCH = {
  at: bench.at,
  node: bench.node,
  /** [{count, ms, msPer, rowsPerMs, avgBytes}] — N sparklines → SVG string. */
  scenarios: bench.scenarios,
  core: bench.core,
  count: bench.agg.count,
  medianRowsPerMs: bench.agg.medianRowsPerMs,
  medianMsPer: bench.agg.medianMsPer,
  medianBytes: bench.agg.medianBytes,
  fastest: bench.agg.fastest,
  slowest: bench.agg.slowest,
  // Empty in a healthy run → JSON widens to `never[]`; keep the emit shape for consumers.
  belowFloor: bench.agg.belowFloor as readonly { slug: string; rowsPerMs: number; floor: number }[],
  chart: (slug: string) => bench.charts[slug as keyof typeof bench.charts],
  describeSeriesOpsPerSec: bench.core[0]?.opsPerSec,
  describeSeriesOpsPerSecRounded: Math.round((bench.core[0]?.opsPerSec ?? 0) / 1000) * 1000,
} as const;
