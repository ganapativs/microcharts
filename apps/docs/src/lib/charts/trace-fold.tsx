import { TraceFold } from "@microcharts/react/trace-fold";
import { TraceFold as TraceFoldInteractive } from "@microcharts/react/trace-fold/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const ms = (n: number) => `${Math.round(n)} ms`;
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
  tagline: "Where the latency went — which spans, at which depth, on the path that set the total.",
  staticImport: `${PKG}/trace-fold`,
  interactiveImport: `${PKG}/trace-fold/interactive`,
  dataShape: "{ label, start, duration, depth, parent?, critical? }[]",
  encoding: {
    channel: "width = duration, x = start, row = depth; critical path accented",
    precision: "high",
  },
  nodeBudget: "1 rect per span, cap 40",
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

export const showcase = {
  hint: "critical path",
  Node: () => <TraceFold data={TRACE} format={ms} title="Request trace" width={180} height={48} />,
};

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
  renderInteractive: (s, _data, ui) => (
    <TraceFoldInteractive
      data={TRACE}
      emphasis={s.emphasis as "critical" | "none"}
      labels={s.labels as boolean}
      format={ms}
      animate={ui.animate}
      summary={false}
      width={320}
      height={48}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<TraceFold",
      "  data={spans}",
      s.emphasis !== "critical" && `  emphasis="${s.emphasis}"`,
      s.labels === false && "  labels={false}",
      ui.animate && "  animate",
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
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
