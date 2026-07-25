"use client";
import { useState, type ComponentType, type ReactNode } from "react";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { buildMarkContexts, inferMarkContextSpec, markInput } from "@/lib/charts/contexts-factory";
import { swapChartTree } from "@/lib/charts/swap-chart-tree";
import type { ChartContexts, ChartModule } from "@/lib/charts/types";

// Registry-FREE presentational core for the four-homes view. Kept in its own
// module (no `lib/charts/registry` import) so the guide route can render it for
// one chart without dragging the whole 106-chart component graph — Turbopack
// does not tree-shake co-located `'use client'` exports, so the registry lookup
// MUST live in a separate file from this view.

const HOMES = [
  { key: "sentence", label: "In a sentence" },
  { key: "cell", label: "In a table cell" },
  { key: "kpi", label: "In a KPI card" },
  { key: "tab", label: "In a tab header" },
] as const;

type MarkProps = { data: number[]; width?: number; height?: number };

/** Fallback when a chart hasn't authored `contexts` yet. */
function genericContexts(mod: ChartModule): ChartContexts {
  const data = markInput(mod.entry);
  const Mark = (mod.ChartLive ?? mod.Mark) as ComponentType<MarkProps>;
  return buildMarkContexts(Mark, mod.markCode, inferMarkContextSpec(mod.entry), data);
}

/** Prefer interactive twin inside authored homes; code samples stay static. */
function liveContexts(mod: ChartModule): ChartContexts {
  const base = mod.contexts ?? genericContexts(mod);
  if (!mod.Chart || !mod.ChartLive || !mod.contexts) return base;
  const { Chart, ChartLive } = mod;
  return {
    ...base,
    sentence: {
      ...base.sentence,
      render: () => swapChartTree(base.sentence.render(), Chart, ChartLive) as ReactNode,
    },
    cell: {
      ...base.cell,
      render: () => swapChartTree(base.cell.render(), Chart, ChartLive) as ReactNode,
    },
    kpi: {
      ...base.kpi,
      render: () => swapChartTree(base.kpi.render(), Chart, ChartLive) as ReactNode,
    },
    tab: {
      ...base.tab,
      render: () => swapChartTree(base.tab.render(), Chart, ChartLive) as ReactNode,
    },
  };
}

/** Chart in four placements: sentence, cell, KPI, tab — for one resolved module. */
export function FourContextsView({ mod }: { mod: ChartModule }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const ctx = liveContexts(mod);

  return (
    <div className="not-prose my-6">
      <div className="mb-3 flex justify-end">
        <div role="tablist" aria-label="Four homes view" className="seg">
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
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {HOMES.map(({ key, label }) => {
          const home = ctx[key];
          return (
            <div key={key} className="panel flex flex-col overflow-hidden">
              <div className="border-b border-hairline px-4 py-2">
                <span className="mono-label">{label}</span>
              </div>
              {tab === "code" ? (
                <div className="code-inset code-fill h-36 overflow-hidden">
                  <DynamicCodeBlock lang="tsx" code={home.code} />
                </div>
              ) : (
                <div className="flex min-h-36 flex-1 flex-col justify-center gap-2 p-4">
                  {home.render() as ReactNode}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {ctx.note ? (
        <p className="mt-2 text-[0.7rem] leading-snug text-fd-muted-foreground/80">{ctx.note}</p>
      ) : null}
      <p className="mt-2 text-[0.7rem] leading-snug text-fd-muted-foreground/80">
        Preview uses the public chart API only. When an interactive twin exists, it swaps in with
        the same props and no entrance motion - code samples stay on the static import. Placement
        recipes:{" "}
        <a href="/docs/composition" className="underline underline-offset-2">
          Composition
        </a>
        ,{" "}
        <a href="/docs/sizing" className="underline underline-offset-2">
          Sizing
        </a>
        .
      </p>
    </div>
  );
}
