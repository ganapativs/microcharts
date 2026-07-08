import { MicroScatter } from "@microcharts/react/micro-scatter";
import { InteractiveDemo } from "./micro-scatter.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const CLOUD = Array.from({ length: 24 }, (_, i) => ({
  x: i,
  y: i * 3 + ((i * 7) % 5) * 6,
}));

export const entry: ChartEntry = {
  name: "MicroScatter",
  slug: "micro-scatter",
  status: "stable",
  collection: "core",
  tagline: "Are these two variables related — the relationship no other type tells.",
  staticImport: `${PKG}/micro-scatter`,
  interactiveImport: `${PKG}/micro-scatter/interactive`,
  dataShape: "{ x, y }[] (unordered pairs)",
  encoding: { channel: "2-D position on common scales", precision: "high" },
  nodeBudget: "1 per point (≤ 60)",
  bestFor: ["correlation in a sentence", "two-metric relationships in cards"],
  avoidFor: ["> 60 points (bin instead)", "time series (Sparkline)"],
  props: [
    { name: "data", type: "{ x; y }[]", required: true, description: "Unordered pairs." },
    {
      name: "trend",
      type: "boolean",
      required: false,
      description: "Least-squares line — linear only, never smoothed.",
    },
    {
      name: "focal",
      type: "number",
      required: false,
      description: 'Accent one point — "this one, among all of them".',
    },
    {
      name: "xDomain",
      type: "[number, number]",
      required: false,
      description: "X scale (domain keeps its grammar meaning: y).",
    },
    { name: "r", type: "number", required: false, description: "Dot radius, clamped [1, 3]." },
  ],
  demo: CLOUD.map((p) => p.y),
  example: {
    title: "Latency vs error rate",
    code: `import { MicroScatter } from "${PKG}/micro-scatter";\n\n<MicroScatter data={pairs} title="Latency vs error rate" />`,
  },
};

export function Preview() {
  return <MicroScatter data={CLOUD} summary={false} style={{ width: 110, height: 66 }} />;
}

export const showcase = {
  hint: "correlation",
  Node: () => (
    <MicroScatter
      data={CLOUD}
      trend
      title="Spend vs conversions"
      style={{ width: 110, height: 66 }}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "trend", label: "trend line", init: false },
    { kind: "toggle", key: "focal", label: "focal point", init: false },
    { kind: "range", key: "r", label: "dot radius", min: 1, max: 3, step: 0.5, init: 1.5 },
  ],
  render: (s) => (
    <MicroScatter
      data={CLOUD}
      trend={s.trend as boolean}
      focal={(s.focal as boolean) ? 12 : undefined}
      r={s.r as number}
      summary={false}
      style={{ width: 220, height: 132 }}
    />
  ),
  code: (s) =>
    [
      "<MicroScatter",
      "  data={pairs}",
      (s.trend as boolean) && "  trend",
      (s.focal as boolean) && "  focal={12}",
      s.r !== 1.5 && `  r={${s.r}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "in a sentence",
    code: `latency and errors <MicroScatter data={pairs}\n  style={{ width: "2.5em", height: "1.5em" }} /> correlate strongly`,
    node: (
      <span>
        latency and errors{" "}
        <MicroScatter data={CLOUD} summary={false} style={{ width: "2.5em", height: "1.5em" }} />{" "}
        correlate strongly
      </span>
    ),
  },
  {
    label: "with the trend",
    code: `<MicroScatter data={pairs} trend />`,
    node: <MicroScatter data={CLOUD} trend summary={false} style={{ width: 90, height: 54 }} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <MicroScatter
      data={props.data.map((v, i) => ({ x: i, y: v }))}
      summary={false}
      style={{ width: props.width ?? 40, height: props.height ?? 24 }}
    />
  );
}

export function markCode(): string {
  return `<MicroScatter data={pairs} />`;
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
