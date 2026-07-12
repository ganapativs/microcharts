import type { ReactNode } from "react";
import { LiveDemo } from "@/components/ui/live-demo";
import { getModule } from "@/lib/charts/registry";

/** Per-chart sizing recipes — each pairs a live chart with its exact JSX. */

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

export function Sizing({ chart }: { chart: string }) {
  const recipes = getModule(chart)?.recipes;
  if (!recipes || recipes.length === 0) return null;

  return (
    <>
      {recipes.map((r) => (
        <LiveDemo key={r.label} label={r.label} code={r.code}>
          {r.fluid ? <FluidFrame>{r.node}</FluidFrame> : r.node}
        </LiveDemo>
      ))}
    </>
  );
}
