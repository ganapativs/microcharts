"use client";
import { useChartModule } from "@/lib/charts/use-chart-module";
import { FourContextsView } from "./contexts-view";

/** Chart in four placements: sentence, cell, KPI, tab. Chart-route version —
 *  resolves any slug, but LAZILY (`use-chart-module`), one chunk per chart.
 *  Calling `registry.getModule()` here instead would put all 106 chart modules —
 *  each with its interactive twin — in this route's client bundle (~311 kB gzip,
 *  measured). The registry-free presentational core lives in `contexts-view.tsx`;
 *  the guide route uses `contexts-guide.tsx` with a narrow static module map. */
export function FourContexts({ slug }: { slug: string }) {
  const mod = useChartModule(slug);
  // Reserve the resolved layout's height so the module landing shifts nothing:
  // two rows of min-h-36 panels + the tab rail + the grid gap.
  if (!mod) return <div className="not-prose my-6 min-h-[22.5rem]" aria-hidden />;
  return <FourContextsView mod={mod} />;
}
