/**
 * The copy-pasteable JSX behind the three interactive chart-page shells —
 * `<Playground>`, `<Sizing>` and `<FourContexts>` — extracted as plain strings.
 *
 * Those shells own the most useful code on a chart page (how to place it, how to
 * size it, what the props look like at rest), but the code lives inside React
 * modules: `playground.code(state, data)` is a function, and the recipes /
 * placements hang off `lib/charts/<slug>.tsx`. The Markdown mirrors and
 * `/llms-full.txt` are produced by a pure text transform that must never import
 * the 106-chart component graph, so the strings are snapshotted ahead of time
 * (`docs-code.generated.ts`, via `pnpm gen:docs-code`) and the transform reads
 * the snapshot. `docs-code-generated.test.ts` fails if the two drift.
 *
 * Every function here MIRRORS a component: keep them in step or the mirror will
 * publish code the page never showed.
 */
import { buildMarkContexts, inferMarkContextSpec, markInput } from "./contexts-factory";
import type { ChartContexts, ChartModule, KnobValue } from "./types";

export interface LabeledCode {
  label: string;
  code: string;
}

export interface ChartDocsCode {
  /** `<Playground>`'s opening snippet — the chart at its initial knob state. */
  playground: string;
  /** `<Sizing>` recipes, in the order the page stacks them. */
  recipes: LabeledCode[];
  /** `<FourContexts>` placements, in the order the grid lays them out. */
  contexts: LabeledCode[];
  /** The four-homes caveat, when the chart authored one. */
  contextsNote?: string;
}

/** Mirrors `contexts-view.tsx`'s `HOMES`. */
const HOME_LABELS = [
  ["sentence", "In a sentence"],
  ["cell", "In a table cell"],
  ["kpi", "In a KPI card"],
  ["tab", "In a tab header"],
] as const;

/** Mirrors `contexts-view.tsx`'s `genericContexts` / `liveContexts`, code only —
 *  the interactive swap touches `render`, never the snippets. */
function contextsOf(mod: ChartModule): ChartContexts {
  if (mod.contexts) return mod.contexts;
  const data = markInput(mod.entry);
  return buildMarkContexts(mod.Mark, mod.markCode, inferMarkContextSpec(mod.entry), data);
}

/**
 * Mirrors `PlaygroundView`'s snippet at first paint: knobs at their `init`,
 * interactive mode when the chart has an interactive twin, entrance motion off,
 * the readout on the chart (so no `readout={false}` / external-callback form).
 */
function playgroundOf(mod: ChartModule): string {
  const spec = mod.playground;
  const entry = mod.entry;
  const state: Record<string, KnobValue> = Object.fromEntries(
    (spec.knobs ?? []).map((k) => [k.key, k.init]),
  );
  const data = spec.data ?? [];
  const interactive = Boolean(spec.renderInteractive);
  const importPath = interactive
    ? (entry.interactiveImport ?? entry.staticImport)
    : entry.staticImport;

  const chartJsx = interactive
    ? (spec.codeInteractive?.(state, data, { animate: false }) ?? spec.code(state, data))
    : spec.code(state, data);

  // MinimapStrip drives a viewport, so its snippet opens with the state hook.
  const isMinimap = entry.slug === "minimap-strip";
  const winAt = (state.window as number | undefined) ?? 520;
  const jsx = isMinimap
    ? [
        `const [viewport, setViewport] = useState<[number, number]>([${winAt}, ${winAt + 140}]);`,
        "",
        chartJsx,
      ].join("\n")
    : chartJsx;

  return [
    `import { ${entry.name} } from "${importPath}";`,
    ...(isMinimap ? ['import { useState } from "react";'] : []),
    "",
    jsx,
  ].join("\n");
}

/** Every snippet the three shells would show for one chart. */
function chartDocsCode(mod: ChartModule): ChartDocsCode {
  const ctx = contextsOf(mod);
  return {
    playground: playgroundOf(mod),
    recipes: mod.recipes.map((r) => ({ label: r.label, code: r.code })),
    contexts: HOME_LABELS.map(([key, label]) => ({ label, code: ctx[key].code })),
    ...(ctx.note ? { contextsNote: ctx.note } : {}),
  };
}

/** The whole catalog's snippets, keyed by slug. */
export function buildDocsCode(modules: Record<string, ChartModule>): Record<string, ChartDocsCode> {
  return Object.fromEntries(
    Object.entries(modules).map(([slug, mod]) => [slug, chartDocsCode(mod)]),
  );
}
