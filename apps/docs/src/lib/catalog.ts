/**
 * Catalog facade — data-only view over the per-chart registry
 * (`lib/charts/`). Machine surfaces (catalog.json, llms.txt, footer, OG) and
 * doc shells import from here; component consumers use `lib/charts/registry`.
 */
export type { ChartEntry, ChartProp, ChartStatus, ChartCollection } from "./charts/types";
// Data-only source (no React component graph) — keeps the full 106-chart bundle
// out of every client component that only needs catalog metadata.
export { CHARTS, STABLE_CHARTS, getChart } from "./charts/entries";
