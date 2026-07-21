import { MicroBox } from "@microcharts/react/micro-box";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const RAW = [12, 30, 35, 38, 42, 45, 48, 51, 60, 96];

// Named five-number summaries for the four-homes grid — the production path
// (`stats`) is precomputed server aggregates per endpoint/environment, ms.
const SEARCH = { min: 12, q1: 35, median: 42, q3: 51, max: 96 };
const CHECKOUT = { min: 40, q1: 88, median: 110, q3: 145, max: 320 };
const PROFILE = { min: 8, q1: 14, median: 18, q3: 24, max: 40 };
const CANARY = { min: 20, q1: 60, median: 85, q3: 130, max: 280 };
const ENDPOINTS = [
  { name: "/search", stats: SEARCH },
  { name: "/checkout", stats: CHECKOUT },
  { name: "/profile", stats: PROFILE },
];

export const entry: ChartEntry = {
  name: "MicroBox",
  slug: "micro-box",
  status: "stable",
  collection: "core",
  tagline: "The p50 and spread of a metric: a five-number summary in a row.",
  staticImport: `${PKG}/micro-box`,
  interactiveImport: `${PKG}/micro-box/interactive`,
  dataShape: "number[] OR { min, q1, median, q3, max }",
  encoding: {
    channel: "box span (IQR) + median tick position",
    precision: "high for the five numbers",
  },
  nodeBudget: "≤ 4 (+ ≤ 3 outlier dots/side in tukey)",
  bestFor: ["latency percentile rows", "spread beside a stat"],
  avoidFor: ["modality/shape (HistogramStrip)", "< 5 observations (renders dots)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: false,
      description: "Raw observations (exclusive with stats).",
    },
    {
      name: "stats",
      type: "{ min; q1; median; q3; max }",
      required: false,
      description: "Precomputed server aggregates.",
    },
    {
      name: "whiskers",
      type: '"minmax" | "tukey"',
      required: false,
      description: "Tukey exposes outliers as dots.",
    },
    {
      name: "outliers",
      type: "boolean",
      required: false,
      description: "Render outlier dots in tukey mode.",
    },
  ],
  demo: RAW,
  example: {
    title: "Latency spread",
    code: `import { MicroBox } from "${PKG}/micro-box";\n\n<MicroBox stats={{ min: 12, q1: 35, median: 42, q3: 51, max: 96 }} title="p95 latency" />`,
  },
  sampleData: [
    {
      name: "latencies",
      code: `const latencies = [12, 30, 35, 38, 42, 45, 48, 51, 60, 96]; // ms, raw observations`,
    },
  ],
};

export function Preview() {
  return <MicroBox data={RAW} summary={false} width={130} height={22} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "whiskers",
      label: "whiskers",
      options: ["minmax", "tukey"],
      init: "minmax",
    },
    { kind: "toggle", key: "outlier", label: "extra outlier value", init: false },
    { kind: "toggle", key: "outliers", label: "outlier dots", init: true },
  ],
  render: (s) => (
    <MicroBox
      data={(s.outlier as boolean) ? [...RAW, 400] : RAW}
      whiskers={s.whiskers as "minmax" | "tukey"}
      outliers={s.outliers as boolean}
      summary={false}
      width={260}
      height={40}
    />
  ),
  code: (s) =>
    [
      "<MicroBox",
      "  data={latencies}",
      s.whiskers !== "minmax" && `  whiskers="${s.whiskers}"`,
      s.whiskers === "tukey" && s.outliers === false && "  outliers={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow through the five stops — min, Q1, median, Q3, max.",
};

export const recipes: Recipe[] = [
  {
    label: "precomputed stats (production path)",
    code: `<MicroBox stats={{ min: 12, q1: 35, median: 42, q3: 51, max: 96 }} />`,
    node: (
      <MicroBox
        stats={{ min: 12, q1: 35, median: 42, q3: 51, max: 96 }}
        summary={false}
        width={140}
        height={18}
      />
    ),
  },
  {
    label: "shared domain rows",
    code: `<MicroBox stats={p50} domain={[0, 300]} />\n<MicroBox stats={p95} domain={[0, 300]} />`,
    node: <MicroBox data={RAW} domain={[0, 300]} summary={false} width={140} height={18} />,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Checkout latency this week{" "}
        <span className="mc-inline">
          <MicroBox stats={CHECKOUT} summary={false} width={90} height={16} />
        </span>{" "}
        — median 110ms, but the tail stretched past 300ms.
      </p>
    ),
    code: `<p>\n  Checkout latency this week{" "}\n  <span className="mc-inline">\n    <MicroBox stats={{ min: 40, q1: 88, median: 110, q3: 145, max: 320 }} width={90} height={16} summary={false} />\n  </span>{" "}\n  — median 110ms, tail past 300ms.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {ENDPOINTS.map((e) => (
            <tr key={e.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{e.name}</td>
              <td className="py-1.5">
                <MicroBox stats={e.stats} summary={false} width={70} height={16} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {e.stats.median} ms
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <MicroBox stats={{ min: 12, q1: 35, median: 42, q3: 51, max: 96 }} width={70} height={16} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">p95 latency</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">42 ms</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">median, IQR 35–51</span>
          </div>
        </div>
        <MicroBox stats={SEARCH} summary={false} width={200} height={30} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">42 ms</span>\n  <span className="unit">median, IQR 35–51</span>\n  <MicroBox stats={{ min: 12, q1: 35, median: 42, q3: 51, max: 96 }} width={200} height={30} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Prod", SEARCH],
            ["Canary", CANARY],
          ] as const
        ).map(([name, stats], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <MicroBox stats={stats} summary={false} width={44} height={14} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Prod <MicroBox stats={{ min: 12, q1: 35, median: 42, q3: 51, max: 96 }} width={44} height={14} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <MicroBox
      data={props.data}
      summary={false}
      width={props.width ?? 40}
      height={props.height ?? 14}
    />
  );
}

export function markCode(): string {
  return `<MicroBox data={values} />`;
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
