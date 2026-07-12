import { BalanceBeam } from "@microcharts/react/balance-beam";
import { BalanceBeam as BalanceBeamInteractive } from "@microcharts/react/balance-beam/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
type Pair = [{ label: string; value: number }, { label: string; value: number }];
const FLOW: Pair = [
  { label: "Inflow", value: 620 },
  { label: "Outflow", value: 480 },
];

export const entry: ChartEntry = {
  name: "BalanceBeam",
  slug: "balance-beam",
  status: "stable",
  collection: "expressive",
  tagline: "Which of two sides outweighs, and roughly by how much.",
  staticImport: `${PKG}/balance-beam`,
  interactiveImport: `${PKG}/balance-beam/interactive`,
  dataShape: "[{ label, value }, { label, value }]",
  encoding: { channel: "beam tilt direction + saturating angle", precision: "medium" },
  nodeBudget: "≤ 6",
  bestFor: [
    "a buy vs sell or in vs out read in a sentence",
    "a pro vs con weight in a KPI card",
    "an A-vs-B pair where direction is the story",
  ],
  avoidFor: ["exact ratios (PairedBars / Delta)", "more than two items (MiniBar)", "trends"],
  props: [
    {
      name: "data",
      type: "[{label,value},{label,value}]",
      required: true,
      description: "Exactly two items.",
    },
    {
      name: "maxTilt",
      type: "number",
      required: false,
      description: "Degrees at full saturation (default 12).",
    },
    {
      name: "shape",
      type: '"square" | "round"',
      required: false,
      description: "Weight shape (default square).",
    },
    {
      name: "mode",
      type: '"ratio" | "difference"',
      required: false,
      description: "ratio = share-of-whole; difference = absolute, scaled by domain.",
    },
  ],
  demo: [620, 480],
  example: {
    title: "Cash flow",
    code: `import { BalanceBeam } from "${PKG}/balance-beam";\n\n<BalanceBeam data={[{ label: "Inflow", value: 620 }, { label: "Outflow", value: 480 }]} />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-center gap-4">
      <BalanceBeam data={FLOW} summary={false} width={56} height={24} />
      <BalanceBeam
        data={[
          { label: "A", value: 500 },
          { label: "B", value: 500 },
        ]}
        summary={false}
        width={56}
        height={24}
      />
    </span>
  );
}

export const showcase = {
  hint: "which side wins",
  Node: () => <BalanceBeam data={FLOW} label="values" title="Cash flow" width={72} height={30} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "left", label: "left", min: 0, max: 1000, step: 20, init: 620 },
    { kind: "range", key: "right", label: "right", min: 0, max: 1000, step: 20, init: 480 },
    {
      kind: "segmented",
      key: "shape",
      label: "shape",
      options: ["square", "round"],
      init: "square",
    },
    { kind: "toggle", key: "label", label: "values", init: false },
  ],
  render: (s) => (
    <BalanceBeam
      data={[
        { label: "Inflow", value: s.left as number },
        { label: "Outflow", value: s.right as number },
      ]}
      shape={s.shape as "square" | "round"}
      label={s.label ? "values" : "none"}
      summary={false}
      width={120}
      height={44}
    />
  ),
  code: (s) =>
    [
      "<BalanceBeam",
      `  data={[{ label: "Inflow", value: ${s.left} }, { label: "Outflow", value: ${s.right} }]}`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      s.label && '  label="values"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <BalanceBeamInteractive
      data={[
        { label: "Inflow", value: s.left as number },
        { label: "Outflow", value: s.right as number },
      ]}
      shape={s.shape as "square" | "round"}
      label={s.label ? "values" : "none"}
      summary={false}
      animate={ui.animate}
      width={120}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<BalanceBeam",
      `  data={[{ label: "Inflow", value: ${s.left} }, { label: "Outflow", value: ${s.right} }]}`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      s.label && '  label="values"',
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow Left/Right to read a side's value — a flip of the heavier side is announced.",
};

export const recipes: Recipe[] = [
  {
    label: "round weights + values",
    code: `<BalanceBeam data={pair} shape="round" label="values" />`,
    node: (
      <BalanceBeam
        data={FLOW}
        shape="round"
        label="values"
        summary={false}
        width={90}
        height={34}
      />
    ),
  },
  {
    label: "balanced reads level",
    code: `<BalanceBeam data={[{ label: "A", value: 500 }, { label: "B", value: 500 }]} />`,
    node: (
      <BalanceBeam
        data={[
          { label: "A", value: 500 },
          { label: "B", value: 500 },
        ]}
        summary={false}
        width={70}
        height={28}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const a = props.data[0] ?? 620;
  const b = props.data[1] ?? 480;
  return (
    <BalanceBeam
      data={[
        { label: "A", value: Math.abs(a) },
        { label: "B", value: Math.abs(b) },
      ]}
      summary={false}
      width={props.width ?? 48}
      height={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<BalanceBeam data={[{ label: "A", value: 620 }, { label: "B", value: 480 }]} />`;
}

export default {
  entry,
  Preview,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
