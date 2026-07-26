import { PercentileLadder } from "@microcharts/react/percentile-ladder";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a long-tailed latency sample (ms)
export const LATENCY = Array.from({ length: 200 }, (_, i) =>
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
  tagline: "What does the tail look like, not just the median?",
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
  return <PercentileLadder data={LATENCY} summary={false} width={160} height={20} />;
}
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

const CTX_ROWS = [
  { name: "checkout", meta: "2.1s", data: [2, 2, 2, 2, 2, 2, 2, 2] },
  { name: "auth", meta: "480ms", data: [346, 365, 384, 403, 422, 442, 461, 480] },
  { name: "search", meta: "890ms", data: [641, 676, 712, 748, 783, 819, 854, 890] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Request latency{" "}
        <span className="mc-inline">
          <PercentileLadder data={LATENCY} height={16} summary={false} />
        </span>{" "}
        — p99 at 2.1 s, long tail visible.
      </p>
    ),
    code: '<p>\n  Request latency{" "}\n  <span className="mc-inline">\n    <PercentileLadder data={latencies} summary={false} />\n  </span>{" "}\n  — p99 at 2.1 s, long tail visible.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <PercentileLadder data={row.data} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <PercentileLadder data={latencies} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">p99</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">2.1s</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">latency</span>
          </div>
        </div>
        <PercentileLadder data={CTX_ROWS[0]!.data} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">2.1s</span>\n  <span className="unit">latency</span>\n  <PercentileLadder data={latencies} />\n</div>',
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
            <PercentileLadder data={row.data} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  checkout <PercentileLadder data={latencies} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <PercentileLadder
      data={props.data.length ? props.data : LATENCY}
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
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModuleStatic;
