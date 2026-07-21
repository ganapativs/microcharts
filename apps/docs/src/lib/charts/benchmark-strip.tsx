import { BenchmarkStrip } from "@microcharts/react/benchmark-strip";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// 42 peer latencies (ms), stable + deterministic
export const PEERS = Array.from(
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
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which side of the band is good (colors the focal dot).",
    },
    {
      name: "median",
      type: "boolean",
      required: false,
      description: "Center tick (default true).",
    },
  ],
  demo: PEERS,
  example: {
    title: "Latency vs peers",
    code: `import { BenchmarkStrip } from "${PKG}/benchmark-strip";\n\n<BenchmarkStrip data={peerLatencies} value={312} format={{ style: "unit", unit: "millisecond" }} title="Latency vs peers" />`,
  },
  sampleData: [
    {
      name: "peerLatencies",
      code: `// 42 peer latencies (ms)\nconst peerLatencies = [${PEERS.join(", ")}];`,
    },
  ],
};

export function Preview() {
  return <BenchmarkStrip data={PEERS} value={312} summary={false} width={140} height={14} />;
}
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
  interactiveHint:
    "Hover or arrow across the quantile edges — each names its percentile and value.",
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
    code: `// latency: lower is better → below the median reads positive\n<BenchmarkStrip data={peerLatencies} value={230} positive="down" />`,
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

const CTX_ROWS = [
  { name: "checkout", meta: "312 ms", data: [225, 237, 250, 262, 275, 287, 300, 312] },
  { name: "auth", meta: "48 ms", data: [35, 36, 38, 40, 42, 44, 46, 48] },
  { name: "search", meta: "890 ms", data: [641, 676, 712, 748, 783, 819, 854, 890] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Latency vs peers{" "}
        <span className="mc-inline">
          <BenchmarkStrip data={PEERS} value={312} height={16} summary={false} />
        </span>{" "}
        — slower than 78% of the cohort.
      </p>
    ),
    code: '<p>\n  Latency vs peers{" "}\n  <span className="mc-inline">\n    <BenchmarkStrip data={peerLatencies} value={value} summary={false} />\n  </span>{" "}\n  — slower than 78% of the cohort.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <BenchmarkStrip
                  data={row.data}
                  value={row.data.at(-1)!}
                  height={18}
                  summary={false}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <BenchmarkStrip data={peerLatencies} value={value} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">p95 latency</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">312</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">ms · 78th pctile</span>
          </div>
        </div>
        <BenchmarkStrip data={CTX_ROWS[0]!.data} value={312} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">312</span>\n  <span className="unit">ms · 78th pctile</span>\n  <BenchmarkStrip data={peerLatencies} value={value} />\n</div>',
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
            <BenchmarkStrip data={row.data} value={row.data.at(-1)!} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  checkout <BenchmarkStrip data={peerLatencies} value={value} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <BenchmarkStrip
      data={props.data}
      value={props.data[Math.floor(props.data.length / 2)] ?? 0}
      label="none"
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 12}
    />
  );
}

export function markCode(): string {
  return `<BenchmarkStrip data={peerLatencies} value={value} />`;
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
