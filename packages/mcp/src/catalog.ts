import rawCatalog from "./catalog.generated.json";
import type { Catalog, CatalogData, ChartEntry } from "./types";
import { LIBRARY_VERSION } from "./version";

export { LIBRARY_VERSION };

// The committed snapshot carries chart data only; the library stamp is injected
// at build time so a version bump never leaves this file stale (see version.ts).
export const catalog: Catalog = { library: LIBRARY_VERSION, ...(rawCatalog as CatalogData) };

export const CHARTS: ChartEntry[] = catalog.charts;

const bySlug = new Map(CHARTS.map((c) => [c.slug, c] as const));

export function getEntry(slug: string): ChartEntry | undefined {
  return bySlug.get(slug);
}

export const STABLE_CHARTS = CHARTS.filter((c) => c.status === "stable");
