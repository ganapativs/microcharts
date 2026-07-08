import { MicroBox } from "@microcharts/react/micro-box";
import { InteractiveDemo } from "./micro-box.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const RAW = [12, 30, 35, 38, 42, 45, 48, 51, 60, 96];

export const entry: ChartEntry = {
  name: "MicroBox",
  slug: "micro-box",
  status: "stable",
  collection: "core",
  tagline: "The p50 and spread of a metric — a five-number summary in a row.",
  staticImport: `${PKG}/micro-box`,
  interactiveImport: `${PKG}/micro-box/interactive`,
  dataShape: "number[] OR { min, q1, median, q3, max }",
  encoding: {
    channel: "box span (IQR) + median tick position",
    precision: "high for the five numbers",
  },
  nodeBudget: "≤ 4 (+ ≤ 3 outlier dots/side in tukey)",
  bestFor: ["latency percentile rows", "spread beside a stat"],
  avoidFor: ["modality/shape (HistogramStrip)", "< 5 observations (renders dots)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: false,
      description: "Raw observations (exclusive with stats).",
    },
    {
      name: "stats",
      type: "{ min; q1; median; q3; max }",
      required: false,
      description: "Precomputed server aggregates.",
    },
    {
      name: "whiskers",
      type: '"minmax" | "tukey"',
      required: false,
      description: "Tukey exposes outliers as dots.",
    },
    {
      name: "outliers",
      type: "boolean",
      required: false,
      description: "Render outlier dots in tukey mode.",
    },
  ],
  demo: RAW,
  example: {
    title: "Latency spread",
    code: `import { MicroBox } from "${PKG}/micro-box";\n\n<MicroBox stats={{ min: 12, q1: 35, median: 42, q3: 51, max: 96 }} title="p95 latency" />`,
  },
};

export function Preview() {
  return <MicroBox data={RAW} summary={false} style={{ width: 130, height: 22 }} />;
}

export const showcase = {
  hint: "five numbers",
  Node: () => <MicroBox data={RAW} title="Latency spread" style={{ width: 130, height: 22 }} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "whiskers",
      label: "whiskers",
      options: ["minmax", "tukey"],
      init: "minmax",
    },
    { kind: "toggle", key: "outlier", label: "add outlier", init: false },
  ],
  render: (s) => (
    <MicroBox
      data={(s.outlier as boolean) ? [...RAW, 400] : RAW}
      whiskers={s.whiskers as "minmax" | "tukey"}
      summary={false}
      style={{ width: 260, height: 40 }}
    />
  ),
  code: (s) =>
    [
      "<MicroBox",
      "  data={latencies}",
      s.whiskers !== "minmax" && `  whiskers="${s.whiskers}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "precomputed stats (production path)",
    code: `<MicroBox stats={{ min: 12, q1: 35, median: 42, q3: 51, max: 96 }} />`,
    node: (
      <MicroBox
        stats={{ min: 12, q1: 35, median: 42, q3: 51, max: 96 }}
        summary={false}
        style={{ width: 140, height: 18 }}
      />
    ),
  },
  {
    label: "shared domain rows",
    code: `<MicroBox stats={p50} domain={[0, 300]} />\n<MicroBox stats={p95} domain={[0, 300]} />`,
    node: (
      <MicroBox data={RAW} domain={[0, 300]} summary={false} style={{ width: 140, height: 18 }} />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <MicroBox
      data={props.data}
      summary={false}
      style={{ width: props.width ?? 40, height: props.height ?? 14 }}
    />
  );
}

export function markCode(): string {
  return `<MicroBox data={values} />`;
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
