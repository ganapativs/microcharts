import type { ReactNode } from "react";
import { STABLE_CHARTS } from "@/lib/charts/registry";
import { COLLECTIONS } from "@/lib/collections";
import { GalleryDock } from "./gallery-dock";

function catalogCounts() {
  const counts: Record<string, number> = { all: STABLE_CHARTS.length };
  for (const c of STABLE_CHARTS) counts[c.collection] = (counts[c.collection] ?? 0) + 1;
  return counts;
}

/** Persists the floating dock across /charts ↔ /charts/[collection]. */
export default function ChartsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <GalleryDock counts={catalogCounts()} collections={COLLECTIONS} />
    </>
  );
}
