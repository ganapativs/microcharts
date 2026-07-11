import { HistogramStrip } from "@microcharts/react/histogram-strip";
import { InteractiveDemo } from "./histogram-strip.client";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const TIMES = Array.from({ length: 120 }, (_, i) =>
  i % 3 === 0 ? 40 + (i % 10) : 20 + ((i * 7) % 60),
);
// Per-endpoint latency samples (ms) — distinct clusters, a real "distributions
// per row" table. p50s below are the true medians of each series.
const ENDPOINTS: { name: string; times: number[]; p50: number }[] = [
  { name: "GET /users", times: Array.from({ length: 20 }, (_, i) => 15 + ((i * 4) % 15)), p50: 22 },
  {
    name: "POST /orders",
    times: Array.from({ length: 20 }, (_, i) => 25 + ((i * 6) % 35)),
    p50: 39,
  },
  {
    name: "GET /search",
    times: Array.from({ length: 20 }, (_, i) => 55 + ((i * 5) % 70)),
    p50: 80,
  },
];
// A slower, wider nightly job — contrast for the tab home.
const BATCH = Array.from({ length: 30 }, (_, i) => 80 + ((i * 13) % 140));

export const entry: ChartEntry = {
  name: "HistogramStrip",
  slug: "histogram-strip",
  status: "stable",
  collection: "core",
  tagline: "What does the distribution look like — mode, spread, skew in a cell.",
  staticImport: `${PKG}/histogram-strip`,
  interactiveImport: `${PKG}/histogram-strip/interactive`,
  dataShape: "number[] (raw observations, binned internally)",
  encoding: { channel: "bar height per uniform bin", precision: "medium (bin-level)" },
  nodeBudget: "1 per bin (≤ 12)",
  bestFor: ["latency clusters in a sentence", "distributions per row"],
  avoidFor: ["pre-aggregated counts (SparkBar)", "raw marks (RugStrip)"],
  props: [
    { name: "data", type: "number[]", required: true, description: "Raw observations." },
    {
      name: "bins",
      type: "number",
      required: false,
      description: "Bin count; auto = min(12, √n).",
    },
    {
      name: "markValue",
      type: "number",
      required: false,
      description: "A VALUE whose bin gets accent.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Fixed bin edges across multiples.",
    },
    {
      name: "format",
      type: "Intl.NumberFormatOptions | fn",
      required: false,
      description: "Formats the bin edges named in the summary.",
    },
    {
      name: "locale",
      type: "string | string[]",
      required: false,
      description: "BCP 47 locale(s) for the formatted bin edges.",
    },
  ],
  demo: TIMES.slice(0, 40),
  example: {
    title: "Response times",
    code: `import { HistogramStrip } from "${PKG}/histogram-strip";

const times = Array.from({ length: 120 }, (_, i) =>
  i % 3 === 0 ? 40 + (i % 10) : 20 + ((i * 7) % 60),
);

<HistogramStrip data={times} title="Response times" />`,
  },
  sampleData: [
    {
      name: "times",
      code: `const times = Array.from({ length: 120 }, (_, i) =>
  i % 3 === 0 ? 40 + (i % 10) : 20 + ((i * 7) % 60),
);`,
    },
  ],
};

export function Preview() {
  return <HistogramStrip data={TIMES} summary={false} width={130} height={34} />;
}

export const showcase = {
  hint: "distribution",
  Node: () => (
    <HistogramStrip data={TIMES} markValue={45} title="Response times" width={130} height={34} />
  ),
};

export const playground: PlaygroundSpec = {
  // data is the fixed demo series; width/height/color/format/strings/title/
  // summary/id/className/style/children are sizing/styling/accessible-name
  // chrome, not interactive read decisions — every remaining documented prop
  // (bins, markValue, domain, locale) has a control below.
  knobs: [
    { kind: "range", key: "bins", label: "bins", min: 3, max: 12, init: 8 },
    { kind: "toggle", key: "markValue", label: "mark 45", init: false },
    { kind: "toggle", key: "domain", label: "fixed domain [0, 100]", init: false },
    {
      kind: "segmented",
      key: "locale",
      label: "locale",
      options: ["en-US", "de-DE"],
      init: "en-US",
    },
  ],
  render: (s) => (
    <HistogramStrip
      data={TIMES}
      bins={s.bins as number}
      markValue={(s.markValue as boolean) ? 45 : undefined}
      domain={(s.domain as boolean) ? [0, 100] : undefined}
      locale={s.locale as string}
      summary={false}
      width={260}
      height={64}
    />
  ),
  code: (s) =>
    [
      "<HistogramStrip",
      "  data={times}",
      `  bins={${s.bins}}`,
      (s.markValue as boolean) && "  markValue={45}",
      (s.domain as boolean) && "  domain={[0, 100]}",
      (s.locale as string) !== "en-US" && `  locale="${s.locale}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "where you fall",
    code: `const times = Array.from({ length: 120 }, (_, i) =>
  i % 3 === 0 ? 40 + (i % 10) : 20 + ((i * 7) % 60),
);

<HistogramStrip data={times} markValue={45} />`,
    node: <HistogramStrip data={TIMES} markValue={45} summary={false} width={140} height={32} />,
  },
  {
    label: "fixed edges across rows",
    code: `const times = Array.from({ length: 120 }, (_, i) =>
  i % 3 === 0 ? 40 + (i % 10) : 20 + ((i * 7) % 60),
);

<HistogramStrip data={times} domain={[0, 100]} />`,
    node: <HistogramStrip data={TIMES} domain={[0, 100]} summary={false} width={140} height={32} />,
  },
];

/* The four homes — HistogramStrip always doing the one thing it's for: reading
   a distribution's shape at a glance. Every host is a latency-monitoring
   surface, never a generic "signups" template. */
export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        API latency this hour{" "}
        <span className="mx-1 inline-flex align-middle">
          <HistogramStrip data={TIMES} summary={false} width={90} height={18} />
        </span>{" "}
        — most calls land 40–50 ms, a few tail past 70.
      </p>
    ),
    code: `<p>\n  API latency this hour{" "}\n  <HistogramStrip data={times} width={90} height={18} /> — most calls land 40–50 ms, a few tail past 70.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {ENDPOINTS.map((e) => (
            <tr key={e.name} className="border-t border-fd-border/60 first:border-0">
              <td className="py-1.5 pr-3 font-mono text-xs text-fd-muted-foreground">{e.name}</td>
              <td className="py-1.5">
                <HistogramStrip data={e.times} summary={false} width={64} height={18} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">p50 {e.p50} ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <HistogramStrip data={Array.from({ length: 20 }, (_, i) => 15 + ((i * 4) % 15))} width={64} height={18} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">API latency (last hour)</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">46 ms</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">median</span>
          </div>
        </div>
        <HistogramStrip data={TIMES} summary={false} width={90} height={30} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">46 ms</span>\n  <span className="unit">median</span>\n  <HistogramStrip data={times} width={90} height={30} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["API", TIMES],
            ["Nightly batch", BATCH],
          ] as const
        ).map(([name, series], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <HistogramStrip data={series} summary={false} width={40} height={14} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  API <HistogramStrip data={times} width={40} height={14} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <HistogramStrip
      data={props.data}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<HistogramStrip data={times} />`;
}

export default {
  entry,
  Preview,
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
