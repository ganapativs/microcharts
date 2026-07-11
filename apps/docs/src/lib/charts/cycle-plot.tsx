import { CyclePlot } from "@microcharts/react/cycle-plot";
import { CyclePlot as CyclePlotInteractive } from "@microcharts/react/cycle-plot/interactive";
import { InteractiveDemo } from "./cycle-plot.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// 6 weeks of daily traffic — the week has a shape; Mondays are drifting up
export const WEEKS: number[] = [];
for (let w = 0; w < 6; w++) WEEKS.push(38, 40 + w * 2, 45, 48, 52, 61, 44);
export { DAYS };

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
      type: '"line" | "none"',
      required: false,
      description: "Within-slot micro-trend, or a spine-only quiet form.",
    },
  ],
  demo: WEEKS,
  example: {
    title: "Weekly shape",
    code: `import { CyclePlot } from "${PKG}/cycle-plot";\n\n<CyclePlot data={daily} period={7} slots={weekdays} cycleUnit="weeks" title="Weekly shape" />`,
  },
};

export function Preview() {
  return <CyclePlot data={WEEKS} period={7} summary={false} width={100} height={24} />;
}

export const showcase = {
  hint: "the week has a shape",
  Node: () => (
    <CyclePlot
      data={WEEKS}
      period={7}
      slots={DAYS}
      cycleUnit="weeks"
      title="Weekly shape"
      width={160}
      height={32}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "center",
      label: "center",
      options: ["mean", "median"],
      init: "mean",
    },
    { kind: "segmented", key: "trend", label: "trend", options: ["line", "none"], init: "line" },
    { kind: "toggle", key: "spine", label: "spine", init: true },
  ],
  render: (s) => (
    <CyclePlot
      data={WEEKS}
      period={7}
      slots={DAYS}
      cycleUnit="weeks"
      center={s.center as "mean" | "median"}
      trend={s.trend as "line" | "none"}
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
      s.trend !== "line" && `  trend="${s.trend}"`,
      s.spine === false && "  spine={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <CyclePlotInteractive
      data={WEEKS}
      period={7}
      slots={DAYS}
      cycleUnit="weeks"
      center={s.center as "mean" | "median"}
      trend={s.trend as "line" | "none"}
      spine={s.spine as boolean}
      animate={ui.animate}
      summary={false}
      width={280}
      height={40}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CyclePlot",
      "  data={daily}",
      "  period={7}",
      s.center !== "mean" && `  center="${s.center}"`,
      s.trend !== "line" && `  trend="${s.trend}"`,
      s.spine === false && "  spine={false}",
      ui.animate && "  animate",
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
    code: `<CyclePlot data={daily} period={7} trend="none" />`,
    node: (
      <CyclePlot data={WEEKS} period={7} trend="none" summary={false} width={200} height={32} />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = props.data.slice(0, 28).map((v) => 20 + (Math.abs(v) % 40));
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
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
