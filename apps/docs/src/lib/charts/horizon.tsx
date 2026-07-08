import { Horizon } from "@microcharts/react/horizon";
import { InteractiveDemo } from "./horizon.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const LOAD = [
  2, 5, 9, 14, 22, 31, 26, 18, 12, 24, 38, 45, 41, 30, 19, 11, 6, 3, 8, 16, 27, 35, 29, 20,
];

export const entry: ChartEntry = {
  name: "Horizon",
  slug: "horizon",
  status: "stable",
  collection: "core",
  tagline: "A wide-range series folded into a slim, dense band.",
  staticImport: `${PKG}/horizon`,
  interactiveImport: `${PKG}/horizon/interactive`,
  dataShape: "(number | null)[] over time",
  encoding: {
    channel: "position + fold-layer opacity (darker = higher band)",
    precision: "low — a density read; Sparkline when exact shape matters",
  },
  nodeBudget: "≤ 6 (≤ 3 fold paths per direction)",
  bestFor: ["dense monitoring rows (dozens stacked)", "wide-range series in tight cells"],
  avoidFor: ["first-glance audiences (folding needs a key)", "few rows with room (Sparkline)"],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "Series over time.",
    },
    {
      name: "folds",
      type: "2 | 3",
      required: false,
      description: "Band count — 3 only when the range genuinely spans it.",
    },
    {
      name: "mode",
      type: '"mirror" | "offset"',
      required: false,
      description: "Mirror flips negatives upward (denser); offset keeps up/down.",
    },
    {
      name: "baseline",
      type: "number",
      required: false,
      description: "Fold origin (e.g. a target level) — authored, never inferred.",
    },
  ],
  demo: LOAD,
  example: {
    title: "Cluster load",
    code: `import { Horizon } from "${PKG}/horizon";\n\n<Horizon data={cpuLoad} title="Cluster load" />`,
  },
};

export function Preview() {
  return <Horizon data={LOAD} summary={false} style={{ width: 130, height: 16 }} />;
}

export const showcase = {
  hint: "dense fold",
  Node: () => <Horizon data={LOAD} title="Cluster load" style={{ width: 130, height: 16 }} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "folds",
      label: "folds",
      options: ["2", "3"],
      init: "2",
    },
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["mirror", "offset"],
      init: "mirror",
    },
  ],
  render: (s) => (
    <Horizon
      data={LOAD.map((v, i) => v - 20 + (i % 3))}
      folds={Number(s.folds) as 2 | 3}
      mode={s.mode as "mirror" | "offset"}
      summary={false}
      style={{ width: 260, height: 24 }}
    />
  ),
  code: (s) =>
    [
      "<Horizon",
      "  data={cpuLoad}",
      s.folds !== "2" && `  folds={${s.folds}}`,
      s.mode !== "mirror" && `  mode="${s.mode}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "monitoring rows",
    code: `{hosts.map((h) => (\n  <Horizon key={h.id} data={h.load} title={h.name} />\n))}`,
    node: <Horizon data={LOAD} summary={false} style={{ width: 160, height: 12 }} />,
  },
  {
    label: "fold around a target",
    code: `<Horizon data={latency} baseline={200} />`,
    node: <Horizon data={LOAD} baseline={20} summary={false} style={{ width: 160, height: 14 }} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <Horizon
      data={props.data}
      summary={false}
      style={{ width: props.width ?? 60, height: props.height ?? 12 }}
    />
  );
}

export function markCode(): string {
  return `<Horizon data={series} />`;
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
