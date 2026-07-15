"use client";
import { getModule } from "@/lib/charts/registry";
import { FourContextsView } from "./contexts-view";

/** Chart in four placements: sentence, cell, KPI, tab. Chart-route version —
 *  resolves any slug from the full registry. The registry-free presentational
 *  core lives in `contexts-view.tsx`; the guide route uses `contexts-guide.tsx`
 *  with a narrow module map so a text page never ships all 106 charts. */
export function FourContexts({ slug }: { slug: string }) {
  const mod = getModule(slug);
  if (!mod) return null;
  return <FourContextsView mod={mod} />;
}
