import { PolarClock } from "@microcharts/react/polar-clock";
import { PolarClock as PolarClockInteractive } from "@microcharts/react/polar-clock/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

const DAY = Array.from({ length: 24 }, (_, h) => (h === 14 ? 312 : h === 4 ? 20 : 80 + h));
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
      name: "mode",
      type: '"length" | "opacity"',
      required: false,
      description: "Radial bars (default) or fixed-length 5-step fill.",
    },
    {
      name: "start",
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

export const showcase = {
  hint: "the day cycle",
  Node: () => <PolarClock data={DAY} now={14} title="Traffic by hour" size={52} />,
};

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
  renderInteractive: (s, _data, ui) => (
    <PolarClockInteractive
      data={DAY}
      now={s.now as number}
      mode={s.mode as "length" | "opacity"}
      labels={s.labels === "on"}
      animate={ui.animate}
      summary={false}
      size={120}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<PolarClock",
      "  data={byHour}",
      `  now={${s.now}}`,
      s.mode !== "length" && `  mode="${s.mode}"`,
      s.labels === "off" && "  labels={false}",
      ui.animate && "  animate",
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
    label: "rotate a weekday to the top with start",
    code: `<PolarClock data={week} start={1} /> // Monday at 12 o'clock`,
    node: <PolarClock data={WEEK} start={1} summary={false} size={40} />,
  },
];

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
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
