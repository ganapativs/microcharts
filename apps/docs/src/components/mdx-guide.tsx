import type { MDXComponents } from "mdx/types";
import type { FC } from "react";
import dynamic from "next/dynamic";
import { getMDXComponents } from "@/components/mdx";

// Guide pages that show a four-homes demo (today only /docs, slug="sparkline")
// use a narrow, registry-FREE FourContexts. It resolves its module from a small
// per-chart map (`contexts-guide.tsx`) instead of the 106-chart registry, so the
// guide route never ships the chart graph. Deferred so its client UI splits out
// of the initial script set.
const FourContexts = dynamic(() =>
  import("@/components/charts/contexts-guide").then((m) => m.FourContexts),
) as FC<{ slug: string }>;

/**
 * MDX map for the **guide route** (the top-level /docs catch-all — every text
 * guide + the /docs landing page). It is the shared guide-safe base plus the
 * narrow registry-free `FourContexts`. It carries NONE of the registry shells
 * (`Sizing`, `ChartChooser`, `Usage`, `PropTable`, `Playground`, full
 * `FourContexts`), so a text guide ships without the 106-chart component graph.
 */
export function getGuideMDXComponents(components?: MDXComponents) {
  return {
    ...getMDXComponents(),
    FourContexts,
    ...components,
  } satisfies MDXComponents;
}
