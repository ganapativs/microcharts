import { PercentileLadder } from "@microcharts/react/percentile-ladder";
import { PercentileLadder as PercentileLadderInteractive } from "@microcharts/react/percentile-ladder/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a long-tailed latency sample (ms)
const LATENCY = Array.from({ length: 200 }, (_, i) =>
  i < 130
    ? 90 + (i % 50)
    : i < 180
      ? 150 + ((i * 7) % 320)
      : i < 196
        ? 480 + ((i * 11) % 900)
        : 1500 + ((i * 13) % 800),
);
// literal (no undefined identifiers) source for the printed example snippet —
// matches LATENCY's generator exactly
const LATENCY_LITERAL = `Array.from({ length: 200 }, (_, i) =>
    i < 130
      ? 90 + (i % 50)
      : i < 180
        ? 150 + ((i * 7) % 320)
        : i < 196
          ? 480 + ((i * 11) % 900)
          : 1500 + ((i * 13) % 800),
  )`;

export const entry: ChartEntry = {
  name: "PercentileLadder",
  slug: "percentile-ladder",
  status: "stable",
  collection: "decision",
  tagline: "What does the tail look like — not just the median?",
  staticImport: `${PKG}/percentile-ladder`,
  interactiveImport: `${PKG}/percentile-ladder/interactive`,
  dataShape: "number[]",
  encoding: {
    channel: "tick position on a zero-anchored strip",
    precision: "high — point estimates per percentile",
  },
  nodeBudget: "≤ 8",
  bestFor: ["latency SLOs in a sentence", "tail per endpoint in tables", "payment-size spread"],
  avoidFor: ["odds of an outcome (QuantileDots)", "full shape (MicroBox)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Raw sample; quantiles are derived.",
    },
    {
      name: "ps",
      type: "number[]",
      required: false,
      description: "Percentiles to mark (default [50, 90, 99], 2–4).",
    },
    {
      name: "scale",
      type: '"linear" | "log"',
      required: false,
      description: "Log for long tails (falls back on any value ≤ 0; renders a log tag).",
    },
    {
      name: "label",
      type: '"ps" | "values" | "both" | "none"',
      required: false,
      description: "What the tick labels state.",
    },
    {
      name: "marks",
      type: '"tick" | "dot"',
      required: false,
      description: "Tick marks (default) or dot marks — dots read calmer over dense text.",
    },
  ],
  demo: [90, 120, 480, 2100],
  example: {
    title: "Request latency",
    code: `import { PercentileLadder } from "${PKG}/percentile-ladder";

<PercentileLadder
  data={${LATENCY_LITERAL}}
  format={{ style: "unit", unit: "millisecond" }}
  title="Request latency"
/>`,
  },
};

export function Preview() {
  return <PercentileLadder data={LATENCY} summary={false} width={140} height={14} />;
}

export const showcase = {
  hint: "tail ladder",
  Node: () => <PercentileLadder data={LATENCY} title="Request latency" width={150} height={14} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "scale", label: "scale", options: ["linear", "log"], init: "linear" },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["ps", "values", "both", "none"],
      init: "ps",
    },
    { kind: "segmented", key: "marks", label: "marks", options: ["tick", "dot"], init: "tick" },
  ],
  data: LATENCY,
  render: (s, data) => (
    <PercentileLadder
      data={data}
      scale={s.scale as "linear" | "log"}
      label={s.label as "ps" | "values" | "both" | "none"}
      marks={s.marks as "tick" | "dot"}
      summary={false}
      width={280}
      height={18}
    />
  ),
  code: (s) =>
    [
      "<PercentileLadder",
      "  data={latencies}",
      s.scale !== "linear" && `  scale="${s.scale}"`,
      s.label !== "ps" && `  label="${s.label}"`,
      s.marks !== "tick" && `  marks="${s.marks}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, data, ui) => (
    <PercentileLadderInteractive
      data={data}
      scale={s.scale as "linear" | "log"}
      label={s.label as "ps" | "values" | "both" | "none"}
      marks={s.marks as "tick" | "dot"}
      summary={false}
      animate={ui.animate}
      width={280}
      height={18}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<PercentileLadder",
      "  data={latencies}",
      s.scale !== "linear" && `  scale="${s.scale}"`,
      s.label !== "ps" && `  label="${s.label}"`,
      s.marks !== "tick" && `  marks="${s.marks}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the ticks — each states its value and its multiple of the median.",
};

export const recipes: Recipe[] = [
  {
    label: "stricter SLO percentiles",
    code: `<PercentileLadder data={latencies} ps={[50, 95, 99.9]} />`,
    node: (
      <PercentileLadder
        data={LATENCY}
        ps={[50, 95, 99.9]}
        summary={false}
        width={150}
        height={14}
      />
    ),
  },
  {
    label: "log for long tails",
    code: `// the transform is never silent — a log tag renders\n<PercentileLadder data={latencies} scale="log" />`,
    node: <PercentileLadder data={LATENCY} scale="log" summary={false} width={150} height={14} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <PercentileLadder
      data={props.data}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 12}
    />
  );
}

export function markCode(): string {
  return `<PercentileLadder data={latencies} />`;
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
