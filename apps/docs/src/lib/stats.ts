/**
 * Falsifiable numbers. Every value here is produced at the repo root by
 *   `pnpm bench`  → bench/results.json   (SSR throughput)
 *   `pnpm size`   → .size-limit.json     (gzip budgets, measured actuals)
 * Reproduce them; don't trust them. Update in the same PR as a bench refresh.
 */
export const STATS = {
  deps: 0,
  ssr: { rows: 500, ms: 5.4 }, // 500 charts → SVG on the server
  ssr1000: { rows: 1000, ms: 12.3 },
  avgBytes: 551, // average server-rendered chart payload
} as const;

/** Measured gzip size (kB) per chart subpath — static / interactive. */
export const CHART_GZIP: Record<string, { static: number; interactive: number }> = {
  sparkline: { static: 2.67, interactive: 3.03 },
  sparkbar: { static: 2.21, interactive: 2.56 },
  delta: { static: 0.81, interactive: 1.07 },
  bullet: { static: 1.44, interactive: 1.9 },
  "activity-grid": { static: 1.56, interactive: 2.01 },
};
