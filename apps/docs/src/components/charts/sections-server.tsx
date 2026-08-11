import dynamic from "next/dynamic";
import type { FC, ReactNode } from "react";
import { getModule } from "@/lib/charts/registry";
import { DOCS_CODE } from "@/lib/charts/docs-code.generated";
import { measurementProps } from "@/lib/charts/inject-chart-props";
import type { KnobValue } from "@/lib/charts/types";
import type { PlaygroundSkeleton } from "./playground-skeleton";
import { LiveDemoView } from "@/components/ui/live-demo-view";
import { FluidFrame } from "@/components/ui/fluid-frame";

/**
 * Server wrappers for the chart page's lazy sections. Each one reads the
 * chart's STATIC module half from the server-only registry at build time and
 * hands the client island everything it needs to render its full chrome —
 * before the lazy live module lands. That is what keeps these panels at their
 * final size from the first paint: the island no longer trades a guessed
 * placeholder for content of a different height, because there is no guessed
 * placeholder. The registry import is server-side only; it adds nothing to any
 * client bundle.
 */

// The interactive shells stay deferred so their client UI splits out of the
// route's initial script set (same rationale as the old mdx-charts wiring).
const PlaygroundIsland = dynamic(() =>
  import("@/components/charts/playground").then((m) => m.PlaygroundIsland),
) as FC<{ chart: string; skeleton: PlaygroundSkeleton }>;
const FourContextsIsland = dynamic(() =>
  import("@/components/charts/contexts").then((m) => m.FourContextsIsland),
) as FC<{
  slug: string;
  staticSlots: Record<string, ReactNode>;
  codes: Record<string, string>;
  note?: string | undefined;
}>;

/** Live playground — full chrome server-known, chart pixels lazy. */
export function Playground({ chart }: { chart: string }) {
  const mod = getModule(chart);
  if (!mod) return null;
  const spec = mod.playground;
  const init: Record<string, KnobValue> = Object.fromEntries(
    spec.knobs.map((k) => [k.key, k.init]),
  );
  const data = spec.data ?? [];
  // The prop-level shuffle test the island runs post-module, evaluated here on
  // the STATIC first-paint render (same chart props, minus callbacks).
  let hasPropShuffle = false;
  try {
    hasPropShuffle = measurementProps(spec.render(init, data)).length > 0;
  } catch {
    /* a throwing fixture falls back to no button — the island recovers */
  }
  const skeleton: PlaygroundSkeleton = {
    entry: mod.entry,
    knobs: spec.knobs,
    data: spec.data,
    animates: spec.animates,
    interactiveHint: spec.interactiveHint,
    hasShuffle: !!spec.shuffle,
    hasPropShuffle,
    // `renderInteractive` lives in the LIVE half (the static half may not
    // import interactive entries), so its presence is read off the entry:
    // every chart with an interactive import has one — verified 106/106.
    hasInteractive: !!mod.entry.interactiveImport,
    // The island's exact first-paint code block, from the drift-tested
    // snapshot (`docs-code-generated.test.ts` pins it to the live modules) —
    // identical string, so the code block never reflows on module load.
    initialCode: DOCS_CODE[chart]?.playground ?? spec.code(init, data),
  };
  return <PlaygroundIsland chart={chart} skeleton={skeleton} />;
}

/** Chart in four placements — static tiles server-rendered, live swap on load. */
export function FourContexts({ slug }: { slug: string }) {
  const mod = getModule(slug);
  const ctx = mod?.contexts;
  if (!mod || !ctx) {
    // Charts without authored contexts derive them from the module client-side
    // (generic fallback needs the live Mark). Keep the lazy path for those.
    return <FourContextsIsland slug={slug} staticSlots={{}} codes={{}} />;
  }
  return (
    <FourContextsIsland
      slug={slug}
      staticSlots={{
        sentence: ctx.sentence.render(),
        cell: ctx.cell.render(),
        kpi: ctx.kpi.render(),
        tab: ctx.tab.render(),
      }}
      codes={{
        sentence: ctx.sentence.code,
        cell: ctx.cell.code,
        kpi: ctx.kpi.code,
        tab: ctx.tab.code,
      }}
      note={ctx.note}
    />
  );
}

/** Per-chart sizing recipes — static pixels in the HTML, live swap on load. */
export function Sizing({ chart }: { chart: string }) {
  const mod = getModule(chart);
  const recipes = mod?.recipes;
  if (!recipes || recipes.length === 0) return null;
  return (
    <>
      {recipes.map((r, i) => (
        <LiveDemoView key={r.label} label={r.label} code={r.code} recipeOf={{ slug: chart, i }}>
          {r.fluid ? <FluidFrame>{r.node}</FluidFrame> : r.node}
        </LiveDemoView>
      ))}
    </>
  );
}
