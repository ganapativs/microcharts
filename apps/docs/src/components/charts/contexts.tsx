"use client";
import type { ReactNode } from "react";
import { useChartModule } from "@/lib/charts/use-chart-module";
import { FourContextsView } from "./contexts-view";

/** Chart in four placements: sentence, cell, KPI, tab. Chart-route version —
 *  the server wrapper (`sections-server.tsx`) renders the STATIC tiles into the
 *  page HTML (`staticSlots`), so the grid is at its final size from the first
 *  paint; when the lazy module lands the same tiles re-render with the
 *  interactive twin in place. Calling `registry.getModule()` here instead would
 *  put all 106 chart modules — each with its interactive twin — in this route's
 *  client bundle (~311 kB gzip, measured). */
export function FourContextsIsland({
  slug,
  staticSlots,
  codes,
  note,
}: {
  slug: string;
  staticSlots: Record<string, ReactNode>;
  codes: Record<string, string>;
  note?: string | undefined;
}) {
  const mod = useChartModule(slug);
  return <FourContextsView mod={mod} fallback={{ slots: staticSlots, codes, note }} />;
}
