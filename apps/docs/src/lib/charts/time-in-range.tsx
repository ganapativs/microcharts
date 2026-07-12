import { TimeInRange } from "@microcharts/react/time-in-range";
import { TimeInRange as TimeInRangeInteractive } from "@microcharts/react/time-in-range/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const GLUCOSE = { severeBelow: 2, below: 7, in: 72, above: 15, severeAbove: 4 };

export const entry: ChartEntry = {
  name: "TimeInRange",
  slug: "time-in-range",
  status: "stable",
  collection: "frontier",
  tagline: "How much of the period stayed inside the corridor — and which side it missed on.",
  staticImport: `${PKG}/time-in-range`,
  interactiveImport: `${PKG}/time-in-range/interactive`,
  dataShape: "{ severeBelow?, below, in, above, severeAbove? } (counts or fractions)",
  encoding: { channel: "stacked share length in fixed semantic order", precision: "high" },
  nodeBudget: "≤ 5 rects + ≤ 3 labels",
  bestFor: ["SLO / uptime corridors", "glucose-style time-in-range KPI"],
  avoidFor: ["ranking parts (SegmentedBar)", "a single ratio (Progress)"],
  props: [
    {
      name: "data",
      type: "TimeInRangeDatum",
      required: true,
      description: "Counts or fractions; normalized to 1.",
    },
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      required: false,
      description: "Vertical suits clinical columns and KPI cards.",
    },
    {
      name: "label",
      type: '"in" | "all" | "none"',
      required: false,
      description: "The in-range headline, a full audit, or clean.",
    },
  ],
  demo: [72, 9, 19],
  example: {
    title: "Glucose time-in-range",
    code: `import { TimeInRange } from "${PKG}/time-in-range";\n\n<TimeInRange data={{ below: 9, in: 72, above: 19 }} title="Time in range" />`,
  },
};

export function Preview() {
  return <TimeInRange data={GLUCOSE} summary={false} width={130} height={16} />;
}

export const showcase = {
  hint: "corridor",
  Node: () => <TimeInRange data={GLUCOSE} title="Time in range" width={130} height={16} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["in", "all", "none"],
      init: "in",
    },
    {
      kind: "segmented",
      key: "orientation",
      label: "orientation",
      options: ["horizontal", "vertical"],
      init: "horizontal",
    },
    { kind: "range", key: "in", label: "in-range", min: 20, max: 95, init: 72 },
  ],
  render: (s) => {
    const inV = s.in as number;
    const rest = 100 - inV;
    const data = {
      severeBelow: 2,
      below: Math.round(rest * 0.35),
      in: inV,
      above: Math.round(rest * 0.5),
      severeAbove: 2,
    };
    return s.orientation === "vertical" ? (
      <TimeInRange
        data={data}
        label={s.label as "in" | "all" | "none"}
        orientation="vertical"
        summary={false}
        width={26}
        height={120}
      />
    ) : (
      <TimeInRange
        data={data}
        label={s.label as "in" | "all" | "none"}
        summary={false}
        width={280}
        height={22}
      />
    );
  },
  code: (s) =>
    [
      "<TimeInRange",
      `  data={{ below: 9, in: ${s.in}, above: 19 }}`,
      s.label !== "in" && `  label="${s.label}"`,
      s.orientation !== "horizontal" && `  orientation="${s.orientation}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => {
    const inV = s.in as number;
    const rest = 100 - inV;
    const data = {
      severeBelow: 2,
      below: Math.round(rest * 0.35),
      in: inV,
      above: Math.round(rest * 0.5),
      severeAbove: 2,
    };
    return s.orientation === "vertical" ? (
      <TimeInRangeInteractive
        data={data}
        label={s.label as "in" | "all" | "none"}
        orientation="vertical"
        animate={ui.animate}
        summary={false}
        width={26}
        height={120}
      />
    ) : (
      <TimeInRangeInteractive
        data={data}
        label={s.label as "in" | "all" | "none"}
        animate={ui.animate}
        summary={false}
        width={280}
        height={22}
      />
    );
  },
  codeInteractive: (s, _data, ui) =>
    [
      "<TimeInRange",
      `  data={{ below: 9, in: ${s.in}, above: 19 }}`,
      s.label !== "in" && `  label="${s.label}"`,
      s.orientation !== "horizontal" && `  orientation="${s.orientation}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow across the zones — each announces its share of the period.",
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<TimeInRange data={row.tir} width={60} height={10} />`,
    node: <TimeInRange data={GLUCOSE} summary={false} width={60} height={10} />,
  },
  {
    label: "clinical column",
    code: `<TimeInRange data={tir} orientation="vertical" label="all" />`,
    node: (
      <TimeInRange
        data={GLUCOSE}
        orientation="vertical"
        label="all"
        summary={false}
        width={26}
        height={110}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const [a = 9, b = 72, c = 19] = props.data;
  return (
    <TimeInRange
      data={{ below: Math.abs(a) || 9, in: Math.abs(b) || 72, above: Math.abs(c) || 19 }}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 10}
    />
  );
}

export function markCode(): string {
  return `<TimeInRange data={{ below: 9, in: 72, above: 19 }} />`;
}

export default {
  entry,
  Preview,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
