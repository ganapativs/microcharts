import type { MDXComponents } from "mdx/types";
import { getMDXComponents } from "@/components/mdx";
import * as chartTagsLive from "@/components/mdx-chart-tags-live";
import { Usage } from "@/components/charts/usage";
import { PropTable } from "@/components/charts/prop-table";
import { InteractionNote } from "@/components/charts/interaction-note";
import { ChartChooser } from "@/components/charts/chooser";
// Server wrappers: each reads its chart's static module from the server-only
// registry (build-time cost, zero client bytes) and renders the section at its
// final size before the lazy live module lands — the client islands they mount
// stay deferred via next/dynamic inside sections-server. They pull the full
// registry, so they belong ONLY to the chart route.
import { FourContexts, Playground, Sizing } from "@/components/charts/sections-server";

/**
 * The full MDX map for the **chart route** (`/docs/charts` + every chart page).
 * Chart tags are the `/interactive` twins (RSC children are opaque, so a
 * post-hoc swap cannot rewrite static MDX demos). Guides keep the lean static
 * map via `getMDXComponents` / `getGuideMDXComponents`.
 */
export function getChartMDXComponents(components?: MDXComponents) {
  return {
    ...getMDXComponents(),
    ...chartTagsLive,
    Sizing,
    Usage,
    PropTable,
    InteractionNote,
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
