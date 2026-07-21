"use client";
import sparkline from "@/lib/charts/sparkline.live";
import type { ChartModule } from "@/lib/charts/types";
import { FourContextsView } from "./contexts-view";

// Narrow module map for `<FourContexts />` on GUIDE pages — only the slugs a
// guide actually renders (today just /docs uses it, slug="sparkline"), imported
// one by one like `home/hero-modules.ts`. Sourcing the module here instead of
// `registry.getModule()` keeps the 106-chart graph out of the guide route.
// Keep in sync with FourContexts usages in content/docs/*.mdx (non-charts).
const GUIDE_CONTEXT_MODULES: Record<string, ChartModule> = {
  sparkline: sparkline,
};

/** Four-homes view for guide pages — registry-free, narrow slug set. */
export function FourContexts({ slug }: { slug: string }) {
  const mod = GUIDE_CONTEXT_MODULES[slug];
  if (!mod) return null;
  return <FourContextsView mod={mod} />;
}
