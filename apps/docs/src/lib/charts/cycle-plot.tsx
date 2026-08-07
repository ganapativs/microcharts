import { CyclePlot } from "@microcharts/react/cycle-plot";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// 6 weeks of daily traffic — the week has a shape; Mondays are drifting up
export const WEEKS: number[] = [];
for (let w = 0; w < 6; w++) WEEKS.push(38, 40 + w * 2, 45, 48, 52, 61, 44);

export const entry: ChartEntry = {
  name: "CyclePlot",
  slug: "cycle-plot",
  status: "stable",
  collection: "decision",
  tagline: "What repeats beneath the trend?",
  staticImport: `${PKG}/cycle-plot`,
  interactiveImport: `${PKG}/cycle-plot/interactive`,
  dataShape: "number[] + period: number",
  encoding: { channel: "slot-mean spine + within-slot micro-trend", precision: "medium" },
  nodeBudget: "2 per slot + 2 (cap 12)",
  maxWidth: 320,
  maxHeight: 80,
  gotchas: ["A `period` outside 4–12 stops the cycle read working."],
  bestFor: [
    "a KPI card — the week (or month) has a shape",
    "weekday traffic, hourly load, monthly sales seasonality",
    "spotting a single slot that is itself drifting",
  ],
  avoidFor: ["a plain time series (Sparkline)", "one composition (SegmentedBar)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "A flat series, reshaped row-major into `period` slots.",
    },
    {
      name: "period",
      type: "number",
      required: true,
      description: "Slots per cycle (4–12) — e.g. 7 for weekdays.",
    },
    {
      name: "slots",
      type: "string[]",
      required: false,
      description: "Slot names for summaries, e.g. weekday labels.",
    },
    {
      name: "center",
      type: '"mean" | "median"',
      required: false,
      description: "Center statistic — median for skewed slot distributions.",
    },
    {
      name: "trend",
      type: "boolean",
      required: false,
      description: "Within-slot micro-trend line (default true); false = spine + ticks only.",
    },
    {
      name: "spine",
      type: "boolean",
      required: false,
      description: "The slot-center spine (default true); false leaves within-slot drift only.",
    },
    {
      name: "cycleUnit",
      type: "string",
      required: false,
      description: "Cycle noun for the summary, e.g. 'weeks' (default 'cycles').",
    },
  ],
  demo: WEEKS,
  example: {
    title: "Weekly shape",
    code: `import { CyclePlot } from "${PKG}/cycle-plot";\n\n<CyclePlot data={daily} period={7} slots={weekdays} cycleUnit="weeks" title="Weekly shape" />`,
  },
  sampleData: [
    {
      name: "daily",
      code: `// 6 weeks of daily traffic — the week has a shape; Mondays are drifting up
const daily: number[] = [];
for (let w = 0; w < 6; w++) daily.push(38, 40 + w * 2, 45, 48, 52, 61, 44);`,
    },
    {
      name: "weekdays",
      code: `const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];`,
    },
  ],
};

export function Preview() {
  return <CyclePlot data={WEEKS} period={7} summary={false} width={100} height={24} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "center",
      label: "center",
      options: ["mean", "median"],
      init: "mean",
    },
    { kind: "toggle", key: "trend", label: "within-slot trend", init: true },
    { kind: "toggle", key: "spine", label: "spine", init: true },
  ],
  render: (s) => (
    <CyclePlot
      data={WEEKS}
      period={7}
      slots={DAYS}
      cycleUnit="weeks"
      center={s.center as "mean" | "median"}
      trend={s.trend as boolean}
      spine={s.spine as boolean}
      summary={false}
      width={280}
      height={40}
    />
  ),
  code: (s) =>
    [
      "<CyclePlot",
      "  data={daily}",
      "  period={7}",
      s.center !== "mean" && `  center="${s.center}"`,
      s.trend === false && "  trend={false}",
      s.spine === false && "  spine={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the slots — each announces its mean, cycle count, and drift; ↑/↓ steps the individual weeks within a slot.",
};

export const recipes: Recipe[] = [
  {
    label: "median center (skewed slots)",
    code: `<CyclePlot data={daily} period={7} center="median" />`,
    node: (
      <CyclePlot data={WEEKS} period={7} center="median" summary={false} width={200} height={32} />
    ),
  },
  {
    label: "spine only (quiet form)",
    code: `<CyclePlot data={daily} period={7} trend={false} />`,
    node: (
      <CyclePlot data={WEEKS} period={7} trend={false} summary={false} width={200} height={32} />
    ),
  },
];

const CTX_ROWS = [
  { name: "US", meta: "Wed peak", data: [0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.97, 1.0] },
  { name: "EU", meta: "Tue peak", data: [0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.97, 1.0] },
  { name: "APAC", meta: "Thu peak", data: [0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.97, 1.0] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Weekly traffic shape{" "}
        <span className="mc-inline">
          <CyclePlot data={WEEKS} period={7} cycleUnit="weeks" height={24} summary={false} />
        </span>{" "}
        — weekday peak Wednesday, weekend dip.
      </p>
    ),
    code: '<p>\n  Weekly traffic shape{" "}\n  <span className="mc-inline">\n    <CyclePlot data={daily} period={7} summary={false} />\n  </span>{" "}\n  — weekday peak Wednesday, weekend dip.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <CyclePlot
                  data={row.data}
                  period={7}
                  cycleUnit="weeks"
                  height={24}
                  summary={false}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <CyclePlot data={daily} period={7} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Weekly shape</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">Wed</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">peak day</span>
          </div>
        </div>
        <CyclePlot
          data={CTX_ROWS[0]!.data}
          period={7}
          slots={DAYS}
          cycleUnit="weeks"
          height={36}
          summary={false}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">Wed</span>\n  <span className="unit">peak day</span>\n  <CyclePlot data={daily} period={7} />\n</div>',
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
            <CyclePlot data={row.data} period={7} cycleUnit="weeks" height={20} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  US <CyclePlot data={daily} period={7} />\n</button>',
  },
  note: "Best at KPI/card scale — weekly cycles need width for slot groups.",
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = (props.data.length ? props.data : WEEKS)
    .slice(0, 28)
    .map((v) => 20 + (Math.abs(v) % 40));
  return (
    <CyclePlot
      data={data}
      period={7}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<CyclePlot data={daily} period={7} />`;
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
