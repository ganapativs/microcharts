import type { ChartModule } from "@/lib/charts/types";
import sparkline from "@/lib/charts/sparkline";
import progress from "@/lib/charts/progress";
import slope from "@/lib/charts/slope";
import waterfall from "@/lib/charts/waterfall";
import benchmarkStrip from "@/lib/charts/benchmark-strip";
import controlStrip from "@/lib/charts/control-strip";
import changePoint from "@/lib/charts/change-point";
import hourglass from "@/lib/charts/hourglass";
import constellation from "@/lib/charts/constellation";
import etaBar from "@/lib/charts/eta-bar";
import depthWedge from "@/lib/charts/depth-wedge";
import stationGlyph from "@/lib/charts/station-glyph";

/** Narrow per-chart module map for the `<CatalogStrip />` index-page teaser —
 *  exactly the deterministic `sample(12)` slugs (core → frontier), imported one
 *  by one. Sourcing the teaser's `Mark` glyphs here instead of
 *  `lib/charts/registry.getModule()` keeps the whole 106-chart interactive graph
 *  out of the guide route that renders `/docs`.
 *
 *  Keep in sync with `sample(count)` in `catalog-strip.tsx` for the default
 *  count of 12. Slugs not in this map render nothing (matches the old
 *  `if (!mod) return null` guard), so a larger `count` degrades gracefully. */
export const CATALOG_STRIP_MODULES: Record<string, ChartModule> = {
  sparkline: sparkline,
  progress: progress,
  slope: slope,
  waterfall: waterfall,
  "benchmark-strip": benchmarkStrip,
  "control-strip": controlStrip,
  "change-point": changePoint,
  hourglass: hourglass,
  constellation: constellation,
  "eta-bar": etaBar,
  "depth-wedge": depthWedge,
  "station-glyph": stationGlyph,
};
