import chartSizes from "./chart-sizes.json";

/**
 * Falsifiable numbers. Every value here is produced at the repo root by
 *   `pnpm bench`  → bench/results.json   (SSR throughput)
 *   `pnpm build && node scripts/sync-sizes.mjs` → chart-sizes.json (gzip, measured)
 * Reproduce them; don't trust them. CI checks chart-sizes.json against the
 * built dist, so the per-chart numbers can never drift from reality.
 */
export const STATS = {
  deps: 0,
  ssr: { rows: 500, ms: 5.8 }, // 500 charts → SVG on the server
  ssr1000: { rows: 1000, ms: 11.6 },
  avgBytes: 550, // average server-rendered chart payload
} as const;

/** Measured gzip size (kB) per chart subpath — static / interactive. */
export const CHART_GZIP: Record<string, { static: number; interactive: number }> = chartSizes;
