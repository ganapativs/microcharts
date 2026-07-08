import { HistogramStrip } from "@microcharts/react/histogram-strip";
import { InteractiveDemo } from "./histogram-strip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const TIMES = Array.from({ length: 120 }, (_, i) =>
  i % 3 === 0 ? 40 + (i % 10) : 20 + ((i * 7) % 60),
);

export const entry: ChartEntry = {
  name: "HistogramStrip",
  slug: "histogram-strip",
  status: "stable",
  collection: "core",
  tagline: "What does the distribution look like — mode, spread, skew in a cell.",
  staticImport: `${PKG}/histogram-strip`,
  interactiveImport: `${PKG}/histogram-strip/interactive`,
  dataShape: "number[] (raw observations, binned internally)",
  encoding: { channel: "bar height per uniform bin", precision: "medium (bin-level)" },
  nodeBudget: "1 per bin (≤ 12)",
  bestFor: ["latency clusters in a sentence", "distributions per row"],
  avoidFor: ["pre-aggregated counts (SparkBar)", "raw marks (RugStrip)"],
  props: [
    { name: "data", type: "number[]", required: true, description: "Raw observations." },
    {
      name: "bins",
      type: "number",
      required: false,
      description: "Bin count; auto = min(12, √n).",
    },
    {
      name: "highlight",
      type: "number",
      required: false,
      description: "A VALUE whose bin gets accent.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Fixed bin edges across multiples.",
    },
  ],
  demo: TIMES.slice(0, 40),
  example: {
    title: "Response times",
    code: `import { HistogramStrip } from "${PKG}/histogram-strip";\n\n<HistogramStrip data={times} title="Response times" />`,
  },
};

export function Preview() {
  return <HistogramStrip data={TIMES} summary={false} width={130} height={34} />;
}

export const showcase = {
  hint: "distribution",
  Node: () => (
    <HistogramStrip data={TIMES} highlight={45} title="Response times" width={130} height={34} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "bins", label: "bins", min: 3, max: 12, init: 8 },
    { kind: "toggle", key: "highlight", label: "highlight 45", init: false },
  ],
  render: (s) => (
    <HistogramStrip
      data={TIMES}
      bins={s.bins as number}
      highlight={(s.highlight as boolean) ? 45 : undefined}
      summary={false}
      width={260}
      height={64}
    />
  ),
  code: (s) =>
    [
      "<HistogramStrip",
      "  data={times}",
      `  bins={${s.bins}}`,
      (s.highlight as boolean) && "  highlight={45}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "where you fall",
    code: `<HistogramStrip data={salaries} highlight={yourSalary} />`,
    node: <HistogramStrip data={TIMES} highlight={45} summary={false} width={140} height={32} />,
  },
  {
    label: "fixed edges across rows",
    code: `<HistogramStrip data={rowA} domain={[0, 100]} />\n<HistogramStrip data={rowB} domain={[0, 100]} />`,
    node: <HistogramStrip data={TIMES} domain={[0, 100]} summary={false} width={140} height={32} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <HistogramStrip
      data={props.data}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<HistogramStrip data={times} />`;
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
