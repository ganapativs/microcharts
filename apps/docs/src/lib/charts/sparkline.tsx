import { Sparkline } from "@microcharts/react/sparkline";
import { Sparkline as SparklineInteractive } from "@microcharts/react/sparkline/interactive";
import { wave } from "./demo-data";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "Sparkline",
  slug: "sparkline",
  status: "stable",
  collection: "core",
  tagline: "A trend over ordered values, small enough to sit in a sentence.",
  staticImport: `${PKG}/sparkline`,
  interactiveImport: `${PKG}/sparkline/interactive`,
  dataShape: "number[]",
  encoding: { channel: "position (length along a line)", precision: "high" },
  nodeBudget: "≤ 6",
  bestFor: ["inline trend", "table-cell trend", "KPI sparkline", "dense dashboards"],
  avoidFor: ["part-to-whole", "exact category comparison"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "The series. null/NaN are gaps.",
    },
    {
      name: "curve",
      type: '"linear" | "smooth" | "step"',
      required: false,
      description: "Line shape.",
    },
    {
      name: "fill",
      type: "boolean",
      required: false,
      description: "Zero-anchored area under the line.",
    },
    {
      name: "band",
      type: "[number, number]",
      required: false,
      description: "Constant normal-range band.",
    },
    {
      name: "dots",
      type: '"auto" | "minmax" | "none"',
      required: false,
      description: "Endpoint or min/max dots.",
    },
    {
      name: "label",
      type: '"none" | "last" | "minmax"',
      required: false,
      description: "Direct value labels: endpoint, or the extremes.",
    },
    {
      name: "maxPoints",
      type: "number",
      required: false,
      description: "Line-point cap (default 200); longer series decimate min/max-preserving.",
    },
    {
      name: "title",
      type: "string",
      required: false,
      description: "Accessible name; joins the auto summary.",
    },
    {
      name: "summary",
      type: "string | false",
      required: false,
      description: "Override or disable the auto summary.",
    },
  ],
  demo: [3, 5, 4, 8, 6, 9, 7, 11, 10, 14],
  example: {
    title: "Weekly revenue",
    code: `import { Sparkline } from "${PKG}/sparkline";\n\n<Sparkline data={[3, 5, 4, 8, 6, 9]} title="Weekly revenue" />`,
  },
};

export function Preview() {
  return <Sparkline data={entry.demo} width={180} height={48} dots="minmax" summary={false} />;
}

export const showcase = {
  hint: "trend",
  Node: () => (
    <SparklineInteractive
      data={[8, 11, 9, 14, 12, 18, 15, 21, 19, 26, 24, 30]}
      width={150}
      height={44}
      dots="minmax"
      title="Revenue trend"
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "curve", options: ["linear", "smooth", "step"], init: "smooth" },
    { kind: "segmented", key: "dots", options: ["auto", "minmax", "none"], init: "minmax" },
    { kind: "toggle", key: "fill", init: false },
    { kind: "toggle", key: "band", init: false },
    { kind: "segmented", key: "label", options: ["none", "last", "minmax"], init: "last" },
    // maxPoints, title, and summary are documented but not knobbed: maxPoints only
    // matters past 200 points (shown live in the "2,000 points" edge case below),
    // and title/summary are naming props, not a visual read the knobs above change.
  ],
  data: wave(0),
  shuffle: wave,
  render: (s, data) => (
    <Sparkline
      data={data}
      width={340}
      height={92}
      curve={s.curve as "linear" | "smooth" | "step"}
      dots={s.dots as "auto" | "minmax" | "none"}
      fill={s.fill as boolean}
      band={s.band ? [10, 26] : undefined}
      label={s.label as "none" | "last" | "minmax"}
      className="w-full max-w-md"
      style={{ height: "auto" }}
      title="Playground"
    />
  ),
  code: (s, data) =>
    [
      "<Sparkline",
      `  data={[${data.join(", ")}]}`,
      `  curve="${s.curve}"`,
      `  dots="${s.dots}"`,
      s.fill && "  fill",
      s.band && "  band={[10, 26]}",
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, data, ui) => (
    <SparklineInteractive
      data={data}
      width={340}
      height={92}
      curve={s.curve as "linear" | "smooth" | "step"}
      dots={s.dots as "auto" | "minmax" | "none"}
      fill={s.fill as boolean}
      band={s.band ? [10, 26] : undefined}
      label={s.label as "none" | "last" | "minmax"}
      animate={ui.animate}
      className="w-full max-w-md"
      title="Playground"
    />
  ),
  codeInteractive: (s, data, ui) =>
    [
      "<Sparkline",
      `  data={[${data.join(", ")}]}`,
      `  curve="${s.curve}"`,
      `  dots="${s.dots}"`,
      s.fill && "  fill",
      s.band && "  band={[10, 26]}",
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover the line, or focus it and walk points with ← →.",
};

export const recipes: Recipe[] = [
  {
    label: "default",
    code: `// data alone → an intrinsic 80×20 box\n<Sparkline data={[3, 5, 4, 8, 6, 9]} />`,
    node: <Sparkline data={[3, 5, 4, 8, 6, 9]} summary={false} />,
  },
  {
    label: "fixed size",
    code: `// width & height are viewBox units — they also set the pixel box\n<Sparkline data={[3, 5, 4, 8, 6, 9]} width={200} height={48} />`,
    node: <Sparkline data={[3, 5, 4, 8, 6, 9]} width={200} height={48} summary={false} />,
  },
  {
    label: "responsive",
    code: `// omit width/height, let CSS drive the width — the viewBox keeps the ratio\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <Sparkline data={[3, 5, 4, 8, 6, 9]} style={{ width: "100%", height: "auto" }} />\n</div>`,
    fluid: true,
    node: (
      <Sparkline
        data={[3, 5, 4, 8, 6, 9]}
        style={{ width: "100%", height: "auto" }}
        summary={false}
      />
    ),
  },
];

const LATENCY = [48, 45, 44, 40, 38, 36, 33, 31]; // p95 latency, ms — trending down
const SERVICES: { name: string; data: number[]; current: string }[] = [
  { name: "checkout-api", data: LATENCY, current: "31 ms" },
  { name: "auth-api", data: [12, 13, 12, 14, 13, 15, 14, 16], current: "16 ms" },
  { name: "search-api", data: [80, 78, 82, 79, 81, 80, 79, 78], current: "78 ms" },
];
const CONNECTIONS = [1240, 1310, 1290, 1420, 1380, 1510, 1470, 1600]; // concurrent, now 1,600
const METRICS: { name: string; data: number[] }[] = [
  { name: "CPU", data: [62, 65, 61, 68, 70, 66, 72, 75] },
  { name: "Memory", data: [48, 47, 49, 46, 45, 44, 43, 42] },
  { name: "Network", data: [120, 118, 122, 119, 121, 120, 119, 118] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        p95 latency this week{" "}
        <span className="mc-inline">
          <Sparkline data={LATENCY} summary={false} width={64} height={16} dots="none" />
        </span>{" "}
        — trending down.
      </p>
    ),
    code: `<p>\n  p95 latency this week{" "}\n  <Sparkline data={[48, 45, 44, 40, 38, 36, 33, 31]} width={64} height={16} dots="none" /> — trending down.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {SERVICES.map((s) => (
            <tr key={s.name} className="border-t border-fd-border/60 first:border-0">
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{s.name}</td>
              <td className="py-1.5">
                <Sparkline data={s.data} summary={false} width={64} height={18} dots="none" />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{s.current}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<tr>\n  <td>checkout-api</td>\n  <td>\n    <Sparkline data={[48, 45, 44, 40, 38, 36, 33, 31]} width={64} height={18} dots="none" />\n  </td>\n  <td>31 ms</td>\n</tr>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Active connections</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">1,600</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">concurrent, now</span>
          </div>
        </div>
        <Sparkline data={CONNECTIONS} summary={false} width={90} height={28} fill />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">1,600</span>\n  <span className="unit">concurrent, now</span>\n  <Sparkline data={[1240, 1310, 1290, 1420, 1380, 1510, 1470, 1600]} width={90} height={28} fill />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {METRICS.map((m, i) => (
          <span
            key={m.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {m.name}
            <Sparkline data={m.data} summary={false} width={40} height={14} dots="none" />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  CPU <Sparkline data={[62, 65, 61, 68, 70, 66, 72, 75]} width={40} height={14} dots="none" />\n</button>`,
  },
};

export function Mark({ data, width, height }: { data: number[]; width?: number; height?: number }) {
  return <Sparkline data={data} width={width ?? 64} height={height ?? 18} summary={false} />;
}

export function markCode(width?: number, height?: number): string {
  const size = width && height ? ` width={${width}} height={${height}}` : "";
  return `<Sparkline data={data}${size} />`;
}

export function PreviewLive() {
  return (
    <SparklineInteractive
      data={entry.demo}
      width={180}
      height={48}
      dots="minmax"
      summary={false}
      animate
    />
  );
}

export default {
  entry,
  Preview,
  PreviewLive,
  showcase,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
