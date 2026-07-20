import { PolarClock } from "@microcharts/react/polar-clock";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const DAY = Array.from({ length: 24 }, (_, h) => (h === 14 ? 312 : h === 4 ? 20 : 80 + h));
const WEEK = [120, 200, 180, 210, 260, 90, 60];

export const entry: ChartEntry = {
  name: "PolarClock",
  slug: "polar-clock",
  status: "stable",
  collection: "expressive",
  tagline: "The shape of a day or week cycle.",
  staticImport: `${PKG}/polar-clock`,
  interactiveImport: `${PKG}/polar-clock/interactive`,
  dataShape: "(number | null)[]",
  encoding: { channel: "radial bar length at a fixed cycle angle", precision: "medium" },
  nodeBudget: "4",
  bestFor: [
    "the shape of a 24-hour or 7-day cycle",
    "when a metric is busy across the cycle",
    "a compact seasonal read in a KPI card",
  ],
  avoidFor: [
    "exact value comparison (SparkBar over the unrolled cycle)",
    "a non-cyclic trend (Sparkline)",
    "more than a few dozen segments",
  ],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "One value per cycle division (24 hourly, 7 daily, any n).",
    },
    {
      name: "now",
      type: "number",
      required: false,
      description: "Index of the current segment to accent.",
    },
    {
      name: "inner",
      type: "number",
      required: false,
      description: "Inner radius fraction r0 — the zero baseline bars grow from (default 0.35).",
    },
    {
      name: "mode",
      type: '"length" | "opacity"',
      required: false,
      description: "Radial bars (default) or fixed-length 5-step fill.",
    },
    {
      name: "origin",
      type: "number",
      required: false,
      description: "Index rendered at 12 o'clock (week-start / midnight).",
    },
    {
      name: "labels",
      type: "boolean",
      required: false,
      description:
        "Hairline cardinal ticks at 0/¼/½/¾ — the at-rest orientation cue. Default true.",
    },
    {
      name: "segmentFormat",
      type: "(index, n) => string",
      required: false,
      description: "Segment index → label (default: HH:00 for n=24, weekday for n=7, else index).",
    },
  ],
  demo: DAY,
  example: {
    title: "Traffic by hour",
    code: `import { PolarClock } from "${PKG}/polar-clock";\n\n<PolarClock data={byHour} now={14} title="Traffic by hour" />`,
  },
  sampleData: [
    {
      name: "byHour",
      code: `// 24 hourly values, midnight → 23:00
const byHour = [
  80, 81, 82, 83, 20, 85, 86, 87, 88, 89, 90, 91, 92, 93, 312, 95, 96, 97, 98, 99, 100, 101, 102,
  103,
];`,
    },
    {
      name: "week",
      code: `const week = [120, 200, 180, 210, 260, 90, 60];`,
    },
  ],
};

export function Preview() {
  return <PolarClock data={DAY} now={14} summary={false} size={40} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "now", label: "now (hour)", min: 0, max: 23, step: 1, init: 14 },
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["length", "opacity"],
      init: "length",
    },
    { kind: "segmented", key: "labels", label: "ticks", options: ["on", "off"], init: "on" },
  ],
  render: (s) => (
    <PolarClock
      data={DAY}
      now={s.now as number}
      mode={s.mode as "length" | "opacity"}
      labels={s.labels === "on"}
      summary={false}
      size={120}
    />
  ),
  code: (s) =>
    [
      "<PolarClock",
      "  data={byHour}",
      `  now={${s.now}}`,
      s.mode !== "length" && `  mode="${s.mode}"`,
      s.labels === "off" && "  labels={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover around the face or arrow through the hours — each segment announces its time and value.",
};

export const recipes: Recipe[] = [
  {
    label: "a 7-day week, opacity mode for tiny sizes",
    code: `<PolarClock data={[120,200,180,210,260,90,60]} mode="opacity" />`,
    node: <PolarClock data={WEEK} mode="opacity" summary={false} size={40} />,
  },
  {
    label: "rotate a weekday to the top with origin",
    code: `<PolarClock data={week} origin={1} /> // Monday at 12 o'clock`,
    node: <PolarClock data={WEEK} origin={1} summary={false} size={40} />,
  },
];

const CTX_ROWS = [
  { name: "Mon", meta: "14:00", data: [10, 11, 11, 12, 12, 13, 13, 14] },
  { name: "Tue", meta: "15:00", data: [11, 11, 12, 13, 13, 14, 14, 15] },
  { name: "Wed", meta: "13:00", data: [9, 10, 10, 11, 11, 12, 12, 13] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Traffic by hour{" "}
        <span className="mc-inline">
          <PolarClock data={DAY} now={14} labels={false} size={28} summary={false} />
        </span>{" "}
        — peak at 2pm, quiet after midnight.
      </p>
    ),
    code: "<p>\n  Traffic by hour <PolarClock data={byHour} now={14} /> — peak at 2pm, quiet after midnight.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <PolarClock data={row.data} now={14} labels={false} size={32} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <PolarClock data={byHour} now={14} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Peak hour</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">14:00</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">busiest hour</span>
          </div>
        </div>
        <PolarClock data={CTX_ROWS[0]!.data} now={14} size={48} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">14:00</span>\n  <span className="unit">busiest hour</span>\n  <PolarClock data={byHour} now={14} />\n</div>',
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
            <PolarClock data={row.data} now={14} labels={false} size={28} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Mon <PolarClock data={byHour} now={14} />\n</button>',
  },
  note: "Best at KPI/card scale — hour wedges need room to resolve.",
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const vals = props.data.length ? props.data.map((v) => Math.abs(v)) : DAY;
  return <PolarClock data={vals} summary={false} size={props.height ?? 20} />;
}

export function markCode(): string {
  return `<PolarClock data={byHour} now={14} />`;
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
