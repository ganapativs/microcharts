import rawCatalog from "./catalog.generated.json";
import type { Catalog, ChartEntry } from "./types";

/**
 * The committed catalog snapshot, loaded once. `catalog.generated.json` is
 * produced by `scripts/gen.ts` from the docs registry and guard-tested by
 * `catalog-sync.test.ts`, so this is always in step with the shipped library.
 */
export const catalog = rawCatalog as Catalog;

export const CHARTS: ChartEntry[] = catalog.charts;

/** The `@microcharts/react` version this snapshot was cut from (compat stamp). */
export const LIBRARY_VERSION = catalog.library;

const bySlug = new Map(CHARTS.map((c) => [c.slug, c] as const));

export function getEntry(slug: string): ChartEntry | undefined {
  return bySlug.get(slug);
}

/** Only stable charts have a shipped subpath — the wireable/renderable set. */
export const STABLE_CHARTS = CHARTS.filter((c) => c.status === "stable");
