"use client";
import "@microcharts/react/motion";
import type { ReactNode } from "react";
import { LiveDemoView } from "@/components/ui/live-demo-view";
import { useChartModule } from "@/lib/charts/use-chart-module";
import { swapChartTree } from "@/lib/charts/swap-chart-tree";

/** A visibly-constrained box so the "fills its container" recipe reads as fluid. */
function FluidFrame({ children }: { children: ReactNode }) {
  return (
    <div className="w-full">
      <div
        className="mx-auto rounded-md border border-dashed border-fd-border p-3"
        style={{ width: "100%", maxWidth: 320 }}
      >
        {children}
      </div>
    </div>
  );
}

/** Per-chart sizing recipes — interactive twin via the lazy chart module. */
export function Sizing({ chart }: { chart: string }) {
  const mod = useChartModule(chart);
  if (!mod) return <div className="not-prose my-6 min-h-32" aria-hidden />;
  const recipes = mod.recipes;
  if (!recipes || recipes.length === 0) return null;

  const { Chart, ChartLive } = mod;

  return (
    <>
      {recipes.map((r) => {
        const node = Chart && ChartLive ? swapChartTree(r.node, Chart, ChartLive) : r.node;
        return (
          <LiveDemoView key={r.label} label={r.label} code={r.code}>
            {r.fluid ? <FluidFrame>{node}</FluidFrame> : node}
          </LiveDemoView>
        );
      })}
    </>
  );
}
