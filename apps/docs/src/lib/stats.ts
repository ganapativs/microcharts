import chartSizes from "./chart-sizes.json";

/**
 * Falsifiable numbers. Every value here is produced at the repo root by
 *   `pnpm build && node scripts/sync-sizes.mjs` → chart-sizes.json (gzip, measured)
 * Reproduce them; don't trust them. CI checks the synced file against the built
 * dist, so these numbers can never drift from reality.
 */

/** Measured gzip size (kB) per subpath — static / interactive (annotations has no client entry). */
export const CHART_GZIP: Record<string, { static: number; interactive?: number }> = chartSizes;
