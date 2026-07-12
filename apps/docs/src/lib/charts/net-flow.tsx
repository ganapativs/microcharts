import { NetFlow } from "@microcharts/react/net-flow";
import { NetFlow as NetFlowInteractive } from "@microcharts/react/net-flow/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// monthly cash flow (values in $k) — mostly net-positive, two months in the red
export const DEMO = [
  { in: 42, out: 31 },
  { in: 38, out: 35 },
  { in: 45, out: 29 },
  { in: 40, out: 44 },
  { in: 52, out: 38 },
  { in: 48, out: 41 },
  { in: 55, out: 36 },
  { in: 50, out: 47 },
  { in: 58, out: 39 },
  { in: 44, out: 52 },
  { in: 60, out: 41 },
  { in: 57, out: 43 },
];
export const KFMT = (n: number) => `${n}k`;

export const entry: ChartEntry = {
  name: "NetFlow",
  slug: "net-flow",
  status: "stable",
  collection: "decision",
  tagline: "In versus out — and where does that leave us net?",
  staticImport: `${PKG}/net-flow`,
  interactiveImport: `${PKG}/net-flow/interactive`,
  dataShape: "{ in, out }[] per period, oldest first",
  encoding: {
    channel: "mirrored area extent around zero + net line position",
    precision: "medium — the net line restores the precise decision value",
  },
  nodeBudget: "≤ 6",
  bestFor: [
    "cash flow per account row",
    "user in/out (signups vs churn) in a KPI card",
    "any in-vs-out where the net is the decision",
  ],
  avoidFor: ["a single net series (Sparkline)", "one period's split (Delta / SegmentedBar)"],
  props: [
    {
      name: "data",
      type: "{ in; out }[]",
      required: true,
      description: "Periods, oldest first — inflow and outflow magnitudes (both ≥ 0).",
    },
    {
      name: "mode",
      type: '"area" | "bars"',
      required: false,
      description: "Mirrored areas (default) or discrete columns for few periods.",
    },
    {
      name: "net",
      type: "boolean",
      required: false,
      description: "The net line (in − out). Default true.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which direction is good — 'down' for debt-paydown contexts.",
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Signed net in a right gutter.",
    },
  ],
  demo: DEMO.map((d) => d.in - d.out),
  example: {
    title: "Monthly cash flow",
    code: `import { NetFlow } from "${PKG}/net-flow";\n\n<NetFlow data={months} title="Monthly cash flow" />`,
  },
  sampleData: [
    {
      name: "months",
      code: `// monthly cash flow (values in $k) — mostly net-positive, two months in the red
const months = [
  { in: 42, out: 31 }, { in: 38, out: 35 }, { in: 45, out: 29 }, { in: 40, out: 44 },
  { in: 52, out: 38 }, { in: 48, out: 41 }, { in: 55, out: 36 }, { in: 50, out: 47 },
  { in: 58, out: 39 }, { in: 44, out: 52 }, { in: 60, out: 41 }, { in: 57, out: 43 },
];`,
    },
  ],
};

export function Preview() {
  return <NetFlow data={DEMO} format={KFMT} summary={false} width={150} height={26} />;
}

export const showcase = {
  hint: "in vs out, net",
  Node: () => (
    <NetFlow data={DEMO} format={KFMT} title="Monthly cash flow" width={150} height={26} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "mode", label: "mode", options: ["area", "bars"], init: "area" },
    { kind: "toggle", key: "net", label: "net line", init: true },
    { kind: "segmented", key: "label", label: "label", options: ["none", "last"], init: "last" },
  ],
  render: (s) => (
    <NetFlow
      data={DEMO}
      format={KFMT}
      mode={s.mode as "area" | "bars"}
      net={s.net as boolean}
      label={s.label as "last" | "none"}
      summary={false}
      width={280}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<NetFlow",
      "  data={months}",
      s.mode !== "area" && `  mode="${s.mode}"`,
      s.net === false && "  net={false}",
      s.label !== "last" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <NetFlowInteractive
      data={DEMO}
      format={KFMT}
      mode={s.mode as "area" | "bars"}
      net={s.net as boolean}
      label={s.label as "last" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<NetFlow",
      "  data={months}",
      s.mode !== "area" && `  mode="${s.mode}"`,
      s.net === false && "  net={false}",
      s.label !== "last" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the months — each announces inflow, outflow, and the signed net.",
};

export const recipes: Recipe[] = [
  {
    label: "mirrored bars for few months",
    code: `<NetFlow
  data={[
    { in: 42, out: 31 }, { in: 38, out: 35 }, { in: 45, out: 29 }, { in: 40, out: 44 },
    { in: 52, out: 38 }, { in: 48, out: 41 }, { in: 55, out: 36 }, { in: 50, out: 47 },
    { in: 58, out: 39 }, { in: 44, out: 52 }, { in: 60, out: 41 }, { in: 57, out: 43 },
  ]}
  mode="bars"
/>`,
    node: <NetFlow data={DEMO} format={KFMT} mode="bars" summary={false} width={170} height={26} />,
  },
  {
    label: "debt paydown (outflow is the goal)",
    code: `<NetFlow
  data={[
    { in: 42, out: 31 }, { in: 38, out: 35 }, { in: 45, out: 29 }, { in: 40, out: 44 },
    { in: 52, out: 38 }, { in: 48, out: 41 }, { in: 55, out: 36 }, { in: 50, out: 47 },
    { in: 58, out: 39 }, { in: 44, out: 52 }, { in: 60, out: 41 }, { in: 57, out: 43 },
  ]}
  positive="down"
/>`,
    node: (
      <NetFlow data={DEMO} format={KFMT} positive="down" summary={false} width={170} height={26} />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <NetFlow
      data={props.data.map((v, j) => ({ in: Math.abs(v) + 4, out: Math.abs(v) * 0.7 + (j % 4) }))}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<NetFlow data={months} />`;
}

export function PreviewLive() {
  return (
    <NetFlowInteractive data={DEMO} format={KFMT} summary={false} width={150} height={26} animate />
  );
}

export default {
  entry,
  Preview,
  PreviewLive,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
