"use client";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CodeWithData } from "@/components/ui/code-with-data";
import { useChartSlug } from "@/components/charts/chart-slug-context";
import { swapChartTree } from "@/lib/charts/swap-chart-tree";
import { useChartModule } from "@/lib/charts/use-chart-module";
import { FluidFrame } from "@/components/ui/fluid-frame";
import type { SampleData } from "@/lib/charts/types";

type Tab = "preview" | "code";

/** Prefer interactive twin when children were built on the client with the
 *  static `Chart` identity (Sizing recipes rendered client-side). MDX variants
 *  already mount the interactive tag — swap is a no-op there. */
function LivePreview({ children }: { children: ReactNode }) {
  const slug = useChartSlug();
  const mod = useChartModule(slug);
  if (!mod?.Chart || !mod.ChartLive) return children;
  return <>{swapChartTree(children, mod.Chart, mod.ChartLive)}</>;
}

/**
 * Sizing recipes arrive as SERVER-rendered static pixels (`children`), which a
 * client-side identity swap cannot rewrite — RSC children are opaque. When the
 * lazy module lands, re-render the SAME recipe from it with the interactive
 * identity; the recipe node is identical geometry, so the panel never moves and
 * the marks gain hover in place.
 */
function RecipePreview({
  recipeOf,
  children,
}: {
  recipeOf: { slug: string; i: number };
  children: ReactNode;
}) {
  const mod = useChartModule(recipeOf.slug);
  const recipe = mod?.recipes?.[recipeOf.i];
  if (!recipe || !mod.Chart || !mod.ChartLive) return children;
  const node = swapChartTree(recipe.node, mod.Chart, mod.ChartLive) as ReactNode;
  return recipe.fluid ? <FluidFrame>{node}</FluidFrame> : <>{node}</>;
}

/** Client view for {@link LiveDemo}. All catalog lookups (size meta, sample
 *  data) happen in the server wrapper and arrive here as plain props, so this
 *  island never pulls the chart registry into a page's client bundle. */
export function LiveDemoView({
  children,
  code,
  lang = "tsx",
  label,
  metaText,
  sampleData,
  grid = false,
  recipeOf,
}: {
  children: ReactNode;
  code?: string;
  lang?: string;
  label?: string;
  metaText?: string;
  sampleData?: SampleData[];
  grid?: boolean;
  /** Server-rendered sizing recipe — swap to the live twin from this module. */
  recipeOf?: { slug: string; i: number };
}) {
  const [tab, setTab] = useState<Tab>("preview");
  const hasCode = code !== undefined;

  return (
    <div className="not-prose my-6 panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-hairline px-3 py-2">
        {label ? <span className="mono-label whitespace-nowrap pl-1">{label}</span> : <span />}
        <div className="flex items-center gap-2">
          {metaText ? (
            <span className="mono-label mr-1 whitespace-nowrap opacity-70">{metaText}</span>
          ) : null}
          {hasCode ? (
            <div role="tablist" aria-label="Demo view" className="seg">
              {(["preview", "code"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  data-active={tab === t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="seg-opt uppercase"
                >
                  {t}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {!hasCode || tab === "preview" ? (
        <div
          className={cn(
            "flex min-h-32 flex-wrap items-center justify-center gap-6 px-6 py-10",
            grid && "grid-paper",
          )}
        >
          {recipeOf ? (
            <RecipePreview recipeOf={recipeOf}>{children}</RecipePreview>
          ) : (
            <LivePreview>{children}</LivePreview>
          )}
        </div>
      ) : (
        <CodeWithData code={code} sampleData={sampleData} lang={lang} />
      )}
    </div>
  );
}
