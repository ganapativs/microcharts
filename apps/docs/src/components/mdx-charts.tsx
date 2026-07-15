import type { MDXComponents } from "mdx/types";
import type { FC } from "react";
import dynamic from "next/dynamic";
import { getMDXComponents } from "@/components/mdx";
import { Sizing } from "@/components/charts/sizing";
import { Usage } from "@/components/charts/usage";
import { PropTable } from "@/components/charts/prop-table";
import { ChartChooser } from "@/components/charts/chooser";

// The registry-dragging interactive shells — deferred via next/dynamic (SSR on)
// so their client UI splits out of the route's initial script set. They pull the
// full 106-chart registry (`getModule`), so they belong ONLY to the chart route.
const Playground = dynamic(() =>
  import("@/components/charts/playground").then((m) => m.Playground),
) as FC<{ chart: string }>;
const FourContexts = dynamic(() =>
  import("@/components/charts/contexts").then((m) => m.FourContexts),
) as FC<{ slug: string }>;

/**
 * The full MDX map for the **chart route** (`/docs/charts` + every chart page).
 * It is the shared guide-safe base plus everything that intentionally pulls the
 * 106-chart component `registry` — `Sizing`, `Usage`, `PropTable`,
 * `ChartChooser`, `Playground`, and the full slug-driven `FourContexts`. Only
 * chart pages render these, so only the chart route pays for the chart graph;
 * text guides use the leaner `getMDXComponents` / `getGuideMDXComponents`.
 */
export function getChartMDXComponents(components?: MDXComponents) {
  return {
    ...getMDXComponents(),
    Sizing,
    Usage,
    PropTable,
    ChartChooser,
    Playground,
    FourContexts,
    ...components,
  } satisfies MDXComponents;
}

// The global MDX component type is the superset (chart map), so authoring any
// `.mdx` under content/docs — guide or chart — type-checks against every tag.
declare global {
  type MDXProvidedComponents = ReturnType<typeof getChartMDXComponents>;
}
