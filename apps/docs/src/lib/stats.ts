import chartSizes from "./chart-sizes.json";
import bench from "./bench-summary.json";

/**
 * Falsifiable numbers. Every value here is produced at the repo root by
 *   `pnpm bench`  → bench/results.json → `sync-bench.mjs` → bench-summary.json
 *   `pnpm build && node scripts/sync-sizes.mjs` → chart-sizes.json (gzip, measured)
 * Reproduce them; don't trust them. CI checks both synced files against the
 * built dist / bench run, so these numbers can never drift from reality. The
 * SSR figures below are DERIVED from the measured run — never hand-keyed.
 */
const ssr500 = bench.scenarios.find((s) => s.count === 500) ?? bench.scenarios[0];
const ssr1000 = bench.scenarios.find((s) => s.count === 1000) ?? bench.scenarios[0];

export const STATS = {
  deps: 0,
  ssr: { rows: ssr500.count, ms: ssr500.ms }, // N charts → SVG on the server
  ssr1000: { rows: ssr1000.count, ms: ssr1000.ms },
  avgBytes: ssr500.avgBytes, // server-rendered chart payload
} as const;

/** Measured gzip size (kB) per subpath — static / interactive (annotations has no client entry). */
export const CHART_GZIP: Record<string, { static: number; interactive?: number }> = chartSizes;
