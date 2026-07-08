import type { ReactNode } from "react";
import { LiveDemo } from "@/components/ui/live-demo";
import { getModule } from "@/lib/charts/registry";

/**
 * Per-chart "Sizing" section — the code-first answer to "how big is it and how
 * do I control that?". Every recipe pairs the real rendered chart with the
 * exact JSX that produced it, so the size prop the reader copies is the size
 * they see (docs-as-tests discipline, same contract as <LiveDemo>). Recipes
 * live in each chart's registry module.
 */

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
