import { TraceFold } from "@microcharts/react/trace-fold";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const ms = (n: number) => `${Math.round(n)} ms`;
export const TRACE = [
  { label: "request", start: 0, duration: 214, depth: 0 },
  { label: "db.query", start: 10, duration: 86, depth: 1, parent: 0 },
  { label: "auth", start: 0, duration: 8, depth: 1, parent: 0 },
  { label: "render", start: 96, duration: 60, depth: 1, parent: 0 },
  { label: "serialize", start: 156, duration: 40, depth: 1, parent: 0 },
  { label: "index-scan", start: 12, duration: 70, depth: 2, parent: 1 },
  { label: "decode", start: 82, duration: 12, depth: 2, parent: 1 },
  { label: "log", start: 200, duration: 14, depth: 1, parent: 0 },
  { label: "gc", start: 90, duration: 5, depth: 2, parent: 1 },
];

export const entry: ChartEntry = {
  name: "TraceFold",
  slug: "trace-fold",
  status: "stable",
  collection: "frontier",
  tagline: "Where the latency went: which spans, at which depth, on the path that set the total.",
  staticImport: `${PKG}/trace-fold`,
  interactiveImport: `${PKG}/trace-fold/interactive`,
  dataShape: "{ label, start, duration, depth, parent?, critical? }[]",
  encoding: {
    channel: "width = duration, x = start, row = depth; critical path accented",
    precision: "high",
  },
  nodeBudget: "1 rect per span, cap 40",
  maxWidth: 480,
  maxHeight: 50,
  gotchas: [
    "Height is derived from the fold count when you pass none.",
    "In-SVG label size derives from the mark's height and floors at 7 viewBox units (raise it with `labelSize`); a box too small to seat the label drops the label rather than shrinking it.",
  ],
  bestFor: ["request traces / flame charts", "p95-exemplar latency breakdowns"],
  avoidFor: ["a single duration (Bullet)", "a time series (Sparkline)"],
  props: [
    {
      name: "data",
      type: "Span[]",
      required: true,
      description: "Flat span list; parent = index.",
    },
    {
      name: "emphasis",
      type: '"critical" | "none"',
      required: false,
      description: "Mute non-critical spans, or uniform.",
    },
    {
      name: "labels",
      type: "boolean",
      required: false,
      description: "Width-gated in-rect labels.",
    },
  ],
  demo: [214, 86],
  example: {
    title: "Request trace",
    code: `import { TraceFold } from "${PKG}/trace-fold";\n\n<TraceFold data={spans} title="Request trace" />`,
  },
  sampleData: [
    {
      name: "spans",
      code: `const spans = [
  { label: "request", start: 0, duration: 214, depth: 0 },
  { label: "db.query", start: 10, duration: 86, depth: 1, parent: 0 },
  { label: "auth", start: 0, duration: 8, depth: 1, parent: 0 },
  { label: "render", start: 96, duration: 60, depth: 1, parent: 0 },
  { label: "serialize", start: 156, duration: 40, depth: 1, parent: 0 },
  { label: "index-scan", start: 12, duration: 70, depth: 2, parent: 1 },
  { label: "decode", start: 82, duration: 12, depth: 2, parent: 1 },
  { label: "log", start: 200, duration: 14, depth: 1, parent: 0 },
  { label: "gc", start: 90, duration: 5, depth: 2, parent: 1 },
];`,
    },
  ],
};

export function Preview() {
  return <TraceFold data={TRACE} format={ms} summary={false} width={180} height={48} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "emphasis",
      label: "emphasis",
      options: ["critical", "none"],
      init: "critical",
    },
    { kind: "toggle", key: "labels", label: "labels", init: true },
  ],
  render: (s) => (
    <TraceFold
      data={TRACE}
      emphasis={s.emphasis as "critical" | "none"}
      labels={s.labels as boolean}
      format={ms}
      summary={false}
      width={320}
      height={48}
    />
  ),
  code: (s) =>
    [
      "<TraceFold",
      "  data={spans}",
      s.emphasis !== "critical" && `  emphasis="${s.emphasis}"`,
      s.labels === false && "  labels={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover, or use ←/→ within a depth and ↑/↓ between depths — each span announces its duration, share, and path status.",
};

export const recipes: Recipe[] = [
  {
    label: "endpoint cell",
    code: `<TraceFold data={row.spans} labels={false} width={80} height={24} />`,
    node: <TraceFold data={TRACE} labels={false} summary={false} width={80} height={24} />,
  },
  {
    label: "structure audit",
    code: `<TraceFold data={spans} emphasis="none" />`,
    node: <TraceFold data={TRACE} emphasis="none" summary={false} width={220} height={44} />,
  },
];

const mkTrace = (total: number) =>
  [
    { label: "request", start: 0, duration: total, depth: 0 },
    { label: "handler", start: 8, duration: Math.round(total * 0.4), depth: 1, parent: 0 },
    { label: "db", start: 12, duration: Math.round(total * 0.35), depth: 2, parent: 1 },
    {
      label: "serialize",
      start: Math.round(total * 0.55),
      duration: Math.round(total * 0.3),
      depth: 1,
      parent: 0,
    },
  ] as typeof TRACE;

const CTX_ROWS = [
  { name: "GET /api", meta: "214ms", data: TRACE },
  { name: "POST /checkout", meta: "890ms", data: mkTrace(890) },
  { name: "GET /health", meta: "12ms", data: mkTrace(12) },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Request trace{" "}
        <span className="mc-inline">
          <TraceFold data={TRACE} format={ms} height={16} summary={false} />
        </span>{" "}
        — 214 ms total, DB span dominates.
      </p>
    ),
    code: '<p>\n  Request trace{" "}\n  <span className="mc-inline">\n    <TraceFold data={spans} summary={false} />\n  </span>{" "}\n  — 214 ms total, DB span dominates.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <TraceFold data={row.data} format={ms} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <TraceFold data={spans} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Latency</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">214ms</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">total trace</span>
          </div>
        </div>
        <TraceFold data={CTX_ROWS[0]!.data} format={ms} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">214ms</span>\n  <span className="unit">total trace</span>\n  <TraceFold data={spans} />\n</div>',
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
            <TraceFold data={row.data} format={ms} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  /api <TraceFold data={spans} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <TraceFold
      data={TRACE}
      labels={false}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 24}
    />
  );
}

export function markCode(): string {
  return `<TraceFold data={spans} />`;
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
