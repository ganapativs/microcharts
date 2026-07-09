import { BenchmarkStrip } from "@microcharts/react/benchmark-strip";
import { InteractiveDemo } from "./benchmark-strip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
// 42 peer latencies (ms), stable + deterministic
const PEERS = Array.from(
  { length: 42 },
  (_, i) => 180 + Math.round(220 * Math.sin(i / 5) ** 2) + (i % 7) * 12,
);

export const entry: ChartEntry = {
  name: "BenchmarkStrip",
  slug: "benchmark-strip",
  status: "stable",
  collection: "decision",
  tagline: "Is this value normal for its peer group?",
  staticImport: `${PKG}/benchmark-strip`,
  interactiveImport: `${PKG}/benchmark-strip/interactive`,
  dataShape: "number[] + value",
  encoding: {
    channel: "position on a common scale against an empirical band",
    precision: "high — percentile stated",
  },
  nodeBudget: "≤ 6",
  bestFor: ["a value against its cohort", "per-row peer comparison in tables", "SLA context"],
  avoidFor: ["a single trend (Sparkline)", "two groups (ABStrips)"],
  props: [
    { name: "data", type: "number[]", required: true, description: "Peer values." },
    { name: "value", type: "number", required: true, description: "The focal reading." },
    {
      name: "range",
      type: '"p5p95" | "minmax"',
      required: false,
      description: "Outer band; minmax for small samples.",
    },
    {
      name: "label",
      type: '"value" | "percentile" | "none"',
      required: false,
      description: "What the right gutter states (default percentile).",
    },
  ],
  demo: PEERS,
  example: {
    title: "Latency vs peers",
    code: `import { BenchmarkStrip } from "${PKG}/benchmark-strip";\n\n<BenchmarkStrip data={peerLatencies} value={312} format={{ style: "unit", unit: "millisecond" }} title="Latency vs peers" />`,
  },
};

export function Preview() {
  return <BenchmarkStrip data={PEERS} value={312} summary={false} width={140} height={14} />;
}

export const showcase = {
  hint: "peer band + dot",
  Node: () => (
    <BenchmarkStrip data={PEERS} value={312} title="Latency vs peers" width={150} height={14} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value", min: 120, max: 460, step: 4, init: 312 },
    {
      kind: "segmented",
      key: "range",
      label: "range",
      options: ["p5p95", "minmax"],
      init: "p5p95",
    },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["percentile", "value", "none"],
      init: "percentile",
    },
  ],
  data: PEERS,
  render: (s, data) => (
    <BenchmarkStrip
      data={data}
      value={s.value as number}
      range={s.range as "p5p95" | "minmax"}
      label={s.label as "percentile" | "value" | "none"}
      summary={false}
      width={280}
      height={16}
    />
  ),
  code: (s) =>
    [
      "<BenchmarkStrip",
      "  data={peerLatencies}",
      `  value={${s.value}}`,
      s.range !== "p5p95" && `  range="${s.range}"`,
      s.label !== "percentile" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "small samples stay honest",
    code: `// n < 8 falls back to min–max — tail quantiles would be fiction\n<BenchmarkStrip data={[210, 260, 300, 340, 410]} value={300} />`,
    node: (
      <BenchmarkStrip
        data={[210, 260, 300, 340, 410]}
        value={300}
        summary={false}
        width={150}
        height={14}
      />
    ),
  },
  {
    label: "polarity colors the dot",
    code: `// latency: lower is better → below the median reads positive\n<BenchmarkStrip data={peers} value={230} positive="down" />`,
    node: (
      <BenchmarkStrip
        data={PEERS}
        value={230}
        positive="down"
        summary={false}
        width={150}
        height={14}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <BenchmarkStrip
      data={props.data}
      value={props.data[Math.floor(props.data.length / 2)] ?? 0}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 12}
    />
  );
}

export function markCode(): string {
  return `<BenchmarkStrip data={peers} value={value} />`;
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
