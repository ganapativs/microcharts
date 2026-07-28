/** Data-only chart registry — every chart's `entry` metadata with ZERO React
 *  component graph. Backed by a generated JSON snapshot (`entries.generated.json`,
 *  emitted from `./registry` in prebuild) so that importing catalog metadata can
 *  never drag the 106-chart component/interactive bundle into a page. Component
 *  consumers (previews, playgrounds, marks) use `./registry`. */
import type { ChartEntry } from "./types";
import generated from "./entries.generated.json";

const ENTRIES = generated as unknown as ChartEntry[];

const CHART_ENTRIES: Record<string, ChartEntry> = Object.fromEntries(
  ENTRIES.map((e) => [e.slug, e]),
);

export const CHARTS: ChartEntry[] = ENTRIES;

export function getChart(slug: string): ChartEntry | undefined {
  return CHART_ENTRIES[slug];
}

export const STABLE_CHARTS: ChartEntry[] = CHARTS.filter((c) => c.status === "stable");
