import { CalibrationStrip } from "@microcharts/react/calibration-strip";
import { CalibrationStrip as CalibrationStripInteractive } from "@microcharts/react/calibration-strip/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const BINS = [
  { predicted: 0.05, observed: 0.05, count: 100 },
  { predicted: 0.15, observed: 0.16, count: 90 },
  { predicted: 0.25, observed: 0.24, count: 80 },
  { predicted: 0.35, observed: 0.36, count: 70 },
  { predicted: 0.45, observed: 0.44, count: 60 },
  { predicted: 0.55, observed: 0.56, count: 50 },
  { predicted: 0.65, observed: 0.63, count: 40 },
  { predicted: 0.7, observed: 0.52, count: 30 },
  { predicted: 0.85, observed: 0.83, count: 8 },
  { predicted: 0.95, observed: 0.9, count: 5 },
];

export const entry: ChartEntry = {
  name: "CalibrationStrip",
  slug: "calibration-strip",
  status: "stable",
  collection: "frontier",
  tagline:
    "When a model says 70%, does it happen 70% of the time — and is there enough data to ask.",
  staticImport: `${PKG}/calibration-strip`,
  interactiveImport: `${PKG}/calibration-strip/interactive`,
  dataShape: "{ p, outcome }[] raw, or { predicted, observed, count }[] pre-binned",
  encoding: { channel: "observed frequency vs the identity diagonal per bin", precision: "medium" },
  nodeBudget: "≤ 4",
  bestFor: ["classifier reliability / trust", "probability-forecast auditing"],
  avoidFor: ["a single accuracy number (Delta)", "where errors go (ConfusionGrid)"],
  props: [
    {
      name: "data",
      type: "RawPair[] | BinnedRow[]",
      required: true,
      description: "Raw pairs or pre-binned reliability rows.",
    },
    {
      name: "bins",
      type: "number",
      required: false,
      description: "Uniform bin count for raw input.",
    },
    {
      name: "minSupport",
      type: "number",
      required: false,
      description: "Below this a bin renders low-confidence.",
    },
    {
      name: "variant",
      type: '"dots" | "bars"',
      required: false,
      description: "Bars draw signed deviation columns.",
    },
  ],
  demo: [70, 52],
  example: {
    title: "Model calibration",
    code: `import { CalibrationStrip } from "${PKG}/calibration-strip";\n\n<CalibrationStrip data={reliability} title="Model calibration" />`,
  },
  sampleData: [
    {
      name: "reliability",
      code: `const reliability = [
  { predicted: 0.05, observed: 0.05, count: 100 },
  { predicted: 0.15, observed: 0.16, count: 90 },
  { predicted: 0.25, observed: 0.24, count: 80 },
  { predicted: 0.35, observed: 0.36, count: 70 },
  { predicted: 0.45, observed: 0.44, count: 60 },
  { predicted: 0.55, observed: 0.56, count: 50 },
  { predicted: 0.65, observed: 0.63, count: 40 },
  { predicted: 0.7, observed: 0.52, count: 30 },
  { predicted: 0.85, observed: 0.83, count: 8 },
  { predicted: 0.95, observed: 0.9, count: 5 },
];`,
    },
  ],
};

export function Preview() {
  return <CalibrationStrip data={BINS} summary={false} width={130} height={32} />;
}

export const showcase = {
  hint: "reliability",
  Node: () => <CalibrationStrip data={BINS} title="Model calibration" width={130} height={32} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "variant",
      label: "variant",
      options: ["dots", "bars"],
      init: "dots",
    },
    { kind: "range", key: "minSupport", label: "min support", min: 5, max: 60, init: 11 },
  ],
  render: (s) => (
    <CalibrationStrip
      data={BINS}
      variant={s.variant as "dots" | "bars"}
      minSupport={s.minSupport as number}
      summary={false}
      width={300}
      height={44}
    />
  ),
  code: (s) =>
    [
      "<CalibrationStrip",
      "  data={reliability}",
      s.variant !== "dots" && `  variant="${s.variant}"`,
      s.minSupport !== 11 && `  minSupport={${s.minSupport}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <CalibrationStripInteractive
      data={BINS}
      variant={s.variant as "dots" | "bars"}
      minSupport={s.minSupport as number}
      summary={false}
      animate={ui.animate}
      width={300}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CalibrationStrip",
      "  data={reliability}",
      s.variant !== "dots" && `  variant="${s.variant}"`,
      s.minSupport !== 11 && `  minSupport={${s.minSupport}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or use ←/→ across the bins — each announces predicted vs observed and its sample support.",
};

export const recipes: Recipe[] = [
  {
    label: "eval-table cell",
    code: `<CalibrationStrip data={row.reliability} width={80} height={24} />`,
    node: <CalibrationStrip data={BINS} summary={false} width={80} height={24} />,
  },
  {
    label: "deviation bars",
    code: `<CalibrationStrip data={reliability} variant="bars" />`,
    node: <CalibrationStrip data={BINS} variant="bars" summary={false} width={220} height={36} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <CalibrationStrip
      data={BINS}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 24}
    />
  );
}

export function markCode(): string {
  return `<CalibrationStrip data={reliability} />`;
}

export function PreviewLive() {
  return (
    <CalibrationStripInteractive data={BINS} summary={false} width={130} height={32} animate />
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
