/**
 * The one place the guide pages get their numbers. Every figure here is DERIVED
 * — from the chart registry (catalog counts), the measured gzip sizes
 * (`chart-sizes.json`, via `sync-sizes.mjs`), and the SSR benchmark
 * (`bench-summary.json`, via `sync-bench.mjs`). Prose and tables read these
 * constants, so a claim on a page can never drift from what the build measured.
 * `docs-facts.test.ts` re-checks the derivations; `docs-claims.test.ts` greps
 * the MDX for stale literals.
 */
// Data-only catalog (generated JSON snapshot) — never the component `registry`,
// so guide shells that quote these figures (perf tables, catalog facts) don't
// drag the 106-chart interactive graph into a text page's route bundle.
import { CHARTS, STABLE_CHARTS } from "./charts/entries";
import { CHART_GZIP } from "./stats";
import bench from "./bench-summary.json";

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const round2 = (n: number) => Math.round(n * 100) / 100;

// ── Catalog ────────────────────────────────────────────────────────────────
const byCollection = { core: 0, decision: 0, expressive: 0, frontier: 0 };
for (const c of STABLE_CHARTS) byCollection[c.collection] += 1;

export const CATALOG = {
  /** Shipped, stable chart types — the number quoted everywhere. */
  total: STABLE_CHARTS.length,
  /** Registry length (equals `total` while every chart is stable). */
  registered: CHARTS.length,
  collections: byCollection,
} as const;

// ── Size (gzip, measured) ────────────────────────────────────────────────────
// Restrict to registry charts so non-chart subpaths (e.g. annotations) never
// skew the catalog-wide size story.
const staticSizes = STABLE_CHARTS.map((c) => CHART_GZIP[c.slug]?.static).filter(
  (n): n is number => typeof n === "number",
);
const interactiveSizes = STABLE_CHARTS.map((c) => CHART_GZIP[c.slug]?.interactive).filter(
  (n): n is number => typeof n === "number",
);

/** Every chart's measured static gzip (kB) — for the size-distribution chart. */
export const STATIC_SIZES = staticSizes;

/** Every chart's measured interactive gzip (kB). */
export const INTERACTIVE_SIZES = interactiveSizes;

/** Durable marketing band — interactive first. Precise measured mins/maxes live in SIZE. */
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
  /** Charts above the 3 kB reference line, largest first — named honestly. */
  over3: STABLE_CHARTS.map((c) => ({ slug: c.slug, name: c.name, kB: CHART_GZIP[c.slug]?.static }))
    .filter((c): c is { slug: string; name: string; kB: number } => (c.kB ?? 0) > 3)
    .sort((a, b) => b.kB - a.kB),
} as const;

// The size table anchors to the whole catalog, not a hand-picked few: the
// smallest, the median, and the largest measured static chart. Derived, so it
// can never drift into a cherry-picked subset.
const sized = STABLE_CHARTS.map((c) => ({
  slug: c.slug,
  name: c.name,
  kB: CHART_GZIP[c.slug]?.static,
}))
  .filter((c): c is { slug: string; name: string; kB: number } => typeof c.kB === "number")
  .sort((a, b) => a.kB - b.kB);

/** Smallest / median / largest static chart — the size span across all N charts. */
export const SIZE_SPAN = [
  { ...sized[0]!, role: "smallest" },
  { ...sized[Math.floor(sized.length / 2)]!, role: "median" },
  { ...sized[sized.length - 1]!, role: "largest" },
] as const;

export function sizeRow(slug: string) {
  const c = CHART_GZIP[slug];
  return { slug, static: c?.static, interactive: c?.interactive };
}

// ── Performance (SSR, measured) ──────────────────────────────────────────────
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
  // Empty in a healthy run, so the JSON widens to `never[]` — name the shape
  // (`sync-bench.mjs` emits {slug, rowsPerMs, floor}) so consumers still typecheck.
  belowFloor: bench.agg.belowFloor as readonly { slug: string; rowsPerMs: number; floor: number }[],
  chart: (slug: string) => bench.charts[slug as keyof typeof bench.charts],
  /** `describeSeries` (24 pts), calls/sec — the real `pnpm bench` core measurement. */
  describeSeriesOpsPerSec: bench.core[0]?.opsPerSec,
  /** Same figure, rounded to the nearest thousand for prose (never hand-typed). */
  describeSeriesOpsPerSecRounded: Math.round((bench.core[0]?.opsPerSec ?? 0) / 1000) * 1000,
} as const;
