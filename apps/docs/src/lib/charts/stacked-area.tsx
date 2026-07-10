import { StackedArea } from "@microcharts/react/stacked-area";
import { InteractiveDemo } from "./stacked-area.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const MIX = [
  { label: "Mobile", values: [30, 34, 36, 40, 44, 47, 52, 56, 58, 60, 63, 66] },
  { label: "Web", values: [50, 48, 47, 45, 42, 41, 38, 36, 35, 33, 32, 30] },
  { label: "API", values: [20, 18, 17, 15, 14, 12, 10, 8, 7, 7, 5, 4] },
];

export const entry: ChartEntry = {
  name: "StackedArea",
  slug: "stacked-area",
  status: "stable",
  collection: "core",
  tagline: "How the composition is shifting over time.",
  staticImport: `${PKG}/stacked-area`,
  interactiveImport: `${PKG}/stacked-area/interactive`,
  dataShape: "{ label, values }[] — at most 3 series, stacked to 100%",
  encoding: {
    channel: "layer thickness (share) over time",
    precision: "low — thickness reads approximately; hover for exact shares",
  },
  nodeBudget: "≤ 7 (≤ 3 area paths + labels)",
  bestFor: ["traffic/revenue mix in KPI cards", "share-shift stories in sentences"],
  avoidFor: ["4+ series", "exact values over time (SparkGroup of Sparklines)"],
  props: [
    {
      name: "data",
      type: "{ label; values }[]",
      required: true,
      description: "≤ 3 series (hard cap).",
    },
    {
      name: "variant",
      type: '"stacked" | "ridge"',
      required: false,
      description: "Ridge = same stack, overlapping-crest skin.",
    },
    {
      name: "order",
      type: '"data" | "asc"',
      required: false,
      description: '"asc" puts the smallest series on top (least distortion).',
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Endpoint share labels per series (deterministic drop-out).",
    },
  ],
  demo: MIX[0].values,
  example: {
    title: "Traffic mix",
    code: `import { StackedArea } from "${PKG}/stacked-area";

const mix = [
  { label: "Mobile", values: [30, 34, 36, 40, 44, 47, 52, 56, 58, 60, 63, 66] },
  { label: "Web", values: [50, 48, 47, 45, 42, 41, 38, 36, 35, 33, 32, 30] },
  { label: "API", values: [20, 18, 17, 15, 14, 12, 10, 8, 7, 7, 5, 4] },
];

<StackedArea data={mix} title="Traffic mix" />`,
  },
};

export function Preview() {
  return <StackedArea data={MIX} summary={false} width={130} height={22} />;
}

export const showcase = {
  hint: "mix shift",
  Node: () => <StackedArea data={MIX} title="Traffic mix" width={130} height={22} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "variant",
      label: "variant",
      options: ["stacked", "ridge"],
      init: "stacked",
    },
    {
      kind: "segmented",
      key: "curve",
      label: "curve",
      options: ["linear", "smooth"],
      init: "linear",
    },
  ],
  render: (s) => (
    <StackedArea
      data={MIX}
      variant={s.variant as "stacked" | "ridge"}
      curve={s.curve as "linear" | "smooth"}
      summary={false}
      width={260}
      height={32}
    />
  ),
  code: (s) =>
    [
      "<StackedArea",
      "  data={mix}",
      s.variant !== "stacked" && `  variant="${s.variant}"`,
      s.curve !== "linear" && `  curve="${s.curve}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "mix rows",
    code: `{regions.map((r) => (\n  <StackedArea key={r.id} data={r.mix} title={r.name} />\n))}`,
    node: <StackedArea data={MIX} summary={false} width={160} height={18} />,
  },
  {
    label: "ridge skin",
    code: `<StackedArea data={mix} variant="ridge" />`,
    node: <StackedArea data={MIX} variant="ridge" summary={false} width={160} height={20} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <StackedArea
      data={[
        { label: "A", values: props.data.map((v) => Math.abs(v) + 1) },
        { label: "B", values: props.data.map((v, i) => Math.abs(v) * 0.6 + i * 0.2 + 1) },
      ]}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 14}
    />
  );
}

export function markCode(): string {
  return `<StackedArea data={mix} />`;
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
