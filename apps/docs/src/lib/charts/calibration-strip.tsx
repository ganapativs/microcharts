import { CalibrationStrip } from "@microcharts/react/calibration-strip";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";
import { calibrationBins } from "./contexts-helpers";

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
    "When a model says 70%, does it happen 70% of the time, and is there enough data to ask.",
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
      name: "mode",
      type: '"dots" | "bars"',
      required: false,
      description: "Bars draw signed deviation columns.",
    },
    {
      name: "color",
      type: "string",
      required: false,
      description: "Accent stroke/fill override.",
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
export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["dots", "bars"],
      init: "dots",
    },
    { kind: "range", key: "minSupport", label: "min support", min: 5, max: 60, init: 11 },
  ],
  render: (s) => (
    <CalibrationStrip
      data={BINS}
      mode={s.mode as "dots" | "bars"}
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
      s.mode !== "dots" && `  mode="${s.mode}"`,
      s.minSupport !== 11 && `  minSupport={${s.minSupport}}`,
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
    code: `<CalibrationStrip data={reliability} mode="bars" />`,
    node: <CalibrationStrip data={BINS} mode="bars" summary={false} width={220} height={36} />,
  },
];

const CTX_ROWS = [
  { name: "v2.1", meta: "0.92", data: calibrationBins(0.92) },
  { name: "v2.0", meta: "0.88", data: calibrationBins(0.88) },
  { name: "v1.9", meta: "0.81", data: calibrationBins(0.81) },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Model calibration{" "}
        <span className="mc-inline">
          <CalibrationStrip data={CTX_ROWS[0]!.data} height={16} summary={false} />
        </span>{" "}
        — well-calibrated above 0.6 predicted probability.
      </p>
    ),
    code: '<p>\n  Model calibration{" "}\n  <span className="mc-inline">\n    <CalibrationStrip data={reliability} summary={false} />\n  </span>{" "}\n  — well-calibrated above 0.6 predicted probability.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <CalibrationStrip data={row.data} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <CalibrationStrip data={reliability} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Calibration</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">0.92</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">ECE score</span>
          </div>
        </div>
        <CalibrationStrip data={CTX_ROWS[0]!.data} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">0.92</span>\n  <span className="unit">ECE score</span>\n  <CalibrationStrip data={reliability} />\n</div>',
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {CTX_ROWS.map((row, i) => (
          <span
            key={row.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${i === 0 ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground" : "border-fd-border text-fd-muted-foreground"}`}
          >
            {row.name}
            <CalibrationStrip data={row.data} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  v2.1 <CalibrationStrip data={reliability} />\n</button>',
  },
};

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
export default {
  entry,
  Preview,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModuleStatic;
