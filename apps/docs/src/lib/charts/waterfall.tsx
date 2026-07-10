import { Waterfall } from "@microcharts/react/waterfall";
import { InteractiveDemo } from "./waterfall.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const PL = [
  { label: "Product", value: 42 },
  { label: "Services", value: 18 },
  { label: "Refunds", value: -12 },
  { label: "Opex", value: -26 },
  { label: "FX", value: 5 },
];

export const entry: ChartEntry = {
  name: "Waterfall",
  slug: "waterfall",
  status: "stable",
  collection: "core",
  tagline: "How the deltas compose into the total — P&L in a cell.",
  staticImport: `${PKG}/waterfall`,
  interactiveImport: `${PKG}/waterfall/interactive`,
  dataShape: "{ label, value }[] of signed deltas, in order",
  encoding: {
    channel: "bar position/length from a running level",
    precision: "medium — label='delta' or the interactive readout for exact steps",
  },
  nodeBudget: "≤ 15 (≤ 7 step rects + connectors + total bar)",
  bestFor: ["P&L bridges in table cells", "net-change decomposition in KPI cards"],
  avoidFor: ["unordered category comparison (MiniBar)", "more than ~8 steps"],
  props: [
    {
      name: "data",
      type: "{ label; value }[]",
      required: true,
      description: "Signed deltas in order.",
    },
    {
      name: "start",
      type: "number",
      required: false,
      description: "Opening level (prior-period close).",
    },
    {
      name: "total",
      type: "boolean",
      required: false,
      description: "Zero-anchored closing total bar (default on).",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: '"down" = decreases are good (cost breakdowns).',
    },
  ],
  demo: PL.map((d) => d.value),
  example: {
    title: "Net income bridge",
    code: `import { Waterfall } from "${PKG}/waterfall";

const steps = [
  { label: "Product", value: 42 },
  { label: "Services", value: 18 },
  { label: "Refunds", value: -12 },
  { label: "Opex", value: -26 },
  { label: "FX", value: 5 },
];

<Waterfall data={steps} start={60} title="Net income bridge" />`,
  },
};

export function Preview() {
  return <Waterfall data={PL} start={60} summary={false} width={130} height={24} />;
}

export const showcase = {
  hint: "bridge",
  Node: () => <Waterfall data={PL} start={60} title="Net income bridge" width={130} height={24} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "total", label: "total bar", init: true },
    {
      kind: "segmented",
      key: "positive",
      label: "positive",
      options: ["up", "down"],
      init: "up",
    },
  ],
  render: (s) => (
    <Waterfall
      data={PL}
      start={60}
      total={s.total as boolean}
      positive={s.positive as "up" | "down"}
      summary={false}
      width={260}
      height={32}
    />
  ),
  code: (s) =>
    [
      "<Waterfall",
      "  data={steps}",
      "  start={60}",
      s.total === false && "  total={false}",
      s.positive !== "up" && `  positive="${s.positive}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "P&L rows",
    code: `{quarters.map((q) => (\n  <Waterfall key={q.id} data={q.steps} start={q.open} title={q.name} />\n))}`,
    node: <Waterfall data={PL} start={60} summary={false} width={160} height={20} />,
  },
  {
    label: "cost bridge (down is good)",
    code: `<Waterfall data={costSteps} positive="down" />`,
    node: (
      <Waterfall
        data={PL.map((d) => ({ label: d.label, value: -d.value }))}
        start={60}
        positive="down"
        summary={false}
        width={160}
        height={20}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <Waterfall
      data={props.data.slice(0, 6).map((v, i) => ({ label: `S${i + 1}`, value: v - 10 }))}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<Waterfall data={steps} start={open} />`;
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
