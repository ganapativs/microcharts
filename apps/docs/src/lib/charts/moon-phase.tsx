import { MoonPhase } from "@microcharts/react/moon-phase";
import { MoonPhase as MoonPhaseInteractive } from "@microcharts/react/moon-phase/interactive";
import { InteractiveDemo } from "./moon-phase.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "MoonPhase",
  slug: "moon-phase",
  status: "stable",
  collection: "expressive",
  tagline: "How far through a cycle or period — readable across cultures.",
  staticImport: `${PKG}/moon-phase`,
  interactiveImport: `${PKG}/moon-phase/interactive`,
  // The lit region already cross-fades on value change (one-shot WAAPI
  // value-transition in client.tsx) — a mount entrance would fight that
  // existing motion, so this chart has no `animate` prop at all.
  animates: false,
  dataShape: "{ value: number }",
  encoding: { channel: "illuminated area fraction of the disc", precision: "medium" },
  nodeBudget: "3",
  bestFor: [
    "sprint or quota progress in a sentence",
    "a billing-period or release-cycle marker",
    "any 0–1 completion that reads at a glance",
  ],
  avoidFor: ["exact percentages (Progress)", "trends (Sparkline)", "comparisons (MiniBar)"],
  props: [
    { name: "value", type: "number", required: true, description: "Fraction 0–1 (clamped)." },
    {
      name: "mode",
      type: '"progress" | "cycle"',
      required: false,
      description:
        "progress = monotonic fill; cycle = true lunar mapping (0 new → 0.5 full → 1 new).",
    },
  ],
  demo: [68],
  example: {
    title: "Sprint",
    code: `import { MoonPhase } from "${PKG}/moon-phase";\n\n<MoonPhase value={0.68} title="Sprint" />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-center gap-3">
      {[0.1, 0.35, 0.5, 0.75, 1].map((v) => (
        <MoonPhase key={v} value={v} summary={false} size={20} />
      ))}
    </span>
  );
}

export const showcase = {
  hint: "through the cycle",
  Node: () => <MoonPhase value={0.68} title="Sprint" size={26} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value %", min: 0, max: 100, step: 1, init: 68 },
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["progress", "cycle"],
      init: "progress",
    },
  ],
  render: (s) => (
    <MoonPhase
      value={(s.value as number) / 100}
      mode={s.mode as "progress" | "cycle"}
      summary={false}
      size={44}
    />
  ),
  code: (s) =>
    [
      "<MoonPhase",
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.mode !== "progress" && `  mode="${s.mode}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  // No `animate` prop exists on this chart (see entry.animates) — the lit
  // region's own value-transition cross-fade is the only motion.
  renderInteractive: (s) => (
    <MoonPhaseInteractive
      value={(s.value as number) / 100}
      mode={s.mode as "progress" | "cycle"}
      summary={false}
      size={44}
    />
  ),
  codeInteractive: (s) =>
    [
      "<MoonPhase",
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.mode !== "progress" && `  mode="${s.mode}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Tap to advance the phase — the lit region cross-fades to its new area (reduced-motion → it swaps), hover reveals the percent, and each change is announced through a polite live region.",
  animates: false,
};

export const recipes: Recipe[] = [
  {
    label: "cycle mode maps the real lunar phases",
    code: `<MoonPhase value={0.5} mode="cycle" /> // full moon`,
    node: (
      <span className="inline-flex gap-2 items-center">
        {[0, 0.25, 0.5, 0.75].map((v) => (
          <MoonPhase key={v} value={v} mode="cycle" summary={false} size={22} />
        ))}
      </span>
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? (Math.abs(props.data[0]!) % 100) / 100 : 0.68;
  return <MoonPhase value={v} summary={false} size={props.height ?? 16} />;
}

export function markCode(): string {
  return `<MoonPhase value={0.68} />`;
}

export default {
  entry,
  Preview,
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
