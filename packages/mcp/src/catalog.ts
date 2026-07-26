import rawCatalog from "./catalog.generated.json";
import type { Catalog, ChartEntry } from "./types";

export const catalog = rawCatalog as Catalog;

export const CHARTS: ChartEntry[] = catalog.charts;

export const LIBRARY_VERSION = catalog.library;

const bySlug = new Map(CHARTS.map((c) => [c.slug, c] as const));

export function getEntry(slug: string): ChartEntry | undefined {
  return bySlug.get(slug);
}

export const STABLE_CHARTS = CHARTS.filter((c) => c.status === "stable");
