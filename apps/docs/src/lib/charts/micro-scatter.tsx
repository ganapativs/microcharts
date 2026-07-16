import { MicroScatter } from "@microcharts/react/micro-scatter";
import { MicroScatter as MicroScatterInteractive } from "@microcharts/react/micro-scatter/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const CLOUD = Array.from({ length: 24 }, (_, i) => ({
  x: i,
  y: i * 3 + ((i * 7) % 5) * 6,
}));

export const entry: ChartEntry = {
  name: "MicroScatter",
  slug: "micro-scatter",
  status: "stable",
  collection: "core",
  tagline: "Are these two variables related? The relationship no other type tells.",
  staticImport: `${PKG}/micro-scatter`,
  interactiveImport: `${PKG}/micro-scatter/interactive`,
  dataShape: "{ x, y }[] (unordered pairs)",
  encoding: { channel: "2-D position on common scales", precision: "high" },
  nodeBudget: "1 per point (≤ 60)",
  bestFor: ["correlation in a sentence", "two-metric relationships in cards"],
  avoidFor: ["> 60 points (bin instead)", "time series (Sparkline)"],
  props: [
    { name: "data", type: "{ x; y }[]", required: true, description: "Unordered pairs." },
    {
      name: "trend",
      type: "boolean",
      required: false,
      description: "Least-squares line — linear only, never smoothed.",
    },
    {
      name: "focal",
      type: "number",
      required: false,
      description: 'Accent one point — "this one, among all of them".',
    },
    {
      name: "xDomain",
      type: "[number, number]",
      required: false,
      description: "X scale (domain keeps its grammar meaning: y).",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Y scale — the shared grammar name, paired with xDomain.",
    },
    { name: "r", type: "number", required: false, description: "Dot radius, clamped [1, 3]." },
  ],
  demo: CLOUD.map((p) => p.y),
  example: {
    title: "Latency vs error rate",
    code: `import { MicroScatter } from "${PKG}/micro-scatter";\n\n<MicroScatter data={pairs} title="Latency vs error rate" />`,
  },
  sampleData: [
    {
      name: "pairs",
      code: `const pairs = [
  { x: 0, y: 0 },
  { x: 1, y: 15 },
  { x: 2, y: 30 },
  { x: 3, y: 15 },
  { x: 4, y: 30 },
  { x: 5, y: 15 },
  { x: 6, y: 30 },
  { x: 7, y: 45 },
  { x: 8, y: 30 },
  { x: 9, y: 45 },
  { x: 10, y: 30 },
  { x: 11, y: 45 },
  { x: 12, y: 60 },
  { x: 13, y: 45 },
  { x: 14, y: 60 },
  { x: 15, y: 45 },
  { x: 16, y: 60 },
  { x: 17, y: 75 },
  { x: 18, y: 60 },
  { x: 19, y: 75 },
  { x: 20, y: 60 },
  { x: 21, y: 75 },
  { x: 22, y: 90 },
  { x: 23, y: 75 },
];`,
    },
  ],
};

export function Preview() {
  return <MicroScatter data={CLOUD} summary={false} width={110} height={66} />;
}

export const showcase = {
  hint: "correlation",
  Node: () => (
    <MicroScatter data={CLOUD} trend title="Spend vs conversions" width={110} height={66} />
  ),
};

// data: the whole point cloud, no shuffle button (a scatter's shape only
// reads at n ≈ 24 — a per-click reshuffle would defeat "read it once, trust
// it"). color, format, locale, id, className, style, children: styling/
// formatting escape hatches, not chart-shape knobs — no interactive control

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "trend", label: "trend line", init: false },
    { kind: "toggle", key: "focal", label: "focal point", init: false },
    { kind: "range", key: "r", label: "dot radius", min: 1, max: 3, step: 0.5, init: 1.5 },
    { kind: "toggle", key: "zoom", label: "zoom to first half (xDomain + domain)", init: false },
  ],
  render: (s) => (
    <MicroScatter
      data={CLOUD}
      trend={s.trend as boolean}
      focal={(s.focal as boolean) ? 12 : undefined}
      r={s.r as number}
      xDomain={(s.zoom as boolean) ? [0, 12] : undefined}
      domain={(s.zoom as boolean) ? [0, 60] : undefined}
      summary={false}
      width={220}
      height={132}
    />
  ),
  code: (s) =>
    [
      "<MicroScatter",
      "  data={pairs}",
      (s.trend as boolean) && "  trend",
      (s.focal as boolean) && "  focal={12}",
      s.r !== 1.5 && `  r={${s.r}}`,
      (s.zoom as boolean) && "  xDomain={[0, 12]}",
      (s.zoom as boolean) && "  domain={[0, 60]}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <MicroScatterInteractive
      data={CLOUD}
      trend={s.trend as boolean}
      focal={(s.focal as boolean) ? 12 : undefined}
      r={s.r as number}
      xDomain={(s.zoom as boolean) ? [0, 12] : undefined}
      domain={(s.zoom as boolean) ? [0, 60] : undefined}
      summary={false}
      animate={ui.animate}
      width={220}
      height={132}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<MicroScatter",
      "  data={pairs}",
      (s.trend as boolean) && "  trend",
      (s.focal as boolean) && "  focal={12}",
      s.r !== 1.5 && `  r={${s.r}}`,
      (s.zoom as boolean) && "  xDomain={[0, 12]}",
      (s.zoom as boolean) && "  domain={[0, 60]}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover the nearest point or step by x with ←/→ — each announces its pair.",
};

export const recipes: Recipe[] = [
  {
    label: "in a sentence",
    code: `latency and errors <MicroScatter data={pairs}\n  style={{ width: "2.5em", height: "1.5em" }} /> correlate strongly`,
    node: (
      <span>
        latency and errors{" "}
        <MicroScatter data={CLOUD} summary={false} style={{ width: "2.5em", height: "1.5em" }} />{" "}
        correlate strongly
      </span>
    ),
  },
  {
    label: "with the trend",
    code: `<MicroScatter data={pairs} trend />`,
    node: <MicroScatter data={CLOUD} trend summary={false} width={90} height={54} />,
  },
];

// Same shape as CLOUD at different y-scale — Pearson r stays 0.93.
const SERVICES = [
  { name: "Checkout", pairs: CLOUD.map((p) => ({ x: p.x, y: p.y * 10 })) }, // p95 latency, ms
  { name: "Search", pairs: CLOUD.map((p) => ({ x: p.x, y: p.y * 5 })) },
];

// Same x-range, uncorrelated y (deterministic).
// for the tab home, not a cosmetic second series.
const ORGANIC = Array.from({ length: 24 }, (_, i) => ({ x: i, y: ((i * 13) % 7) * 10 }));

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Bundle size and paint time across last week&apos;s builds{" "}
        <span className="mc-inline">
          <MicroScatter data={CLOUD} summary={false} width={70} height={20} />
        </span>{" "}
        — heavier bundles paint slower, r 0.93.
      </p>
    ),
    code: `<p>\n  Bundle size and paint time{" "}\n  <MicroScatter data={pairs} height={20} /> — heavier bundles paint slower, r 0.93.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {SERVICES.map((s) => (
            <tr key={s.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{s.name}</td>
              <td className="py-1.5">
                <MicroScatter data={s.pairs} summary={false} width={70} height={20} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">r 0.93</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `// concurrent requests vs p95 latency, per service\n{services.map((s) => (\n  <tr key={s.name}>\n    <td>{s.name}</td>\n    <td><MicroScatter data={s.pairs} /></td>\n  </tr>\n))}`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Spend vs. conversions</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">0.93</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">r, strong positive</span>
          </div>
        </div>
        <MicroScatter data={CLOUD} trend summary={false} width={200} height={90} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">0.93</span>\n  <span className="unit">r, strong positive</span>\n  <MicroScatter data={pairs} trend width={200} height={90} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Paid", CLOUD, "0.93"],
            ["Organic", ORGANIC, "0.01"],
          ] as const
        ).map(([name, pairs, r], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <MicroScatter data={pairs} summary={false} width={44} height={18} />
            <span className="text-fd-muted-foreground text-xs">r {r}</span>
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Paid <MicroScatter data={pairs} height={18} /> r 0.93\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <MicroScatter
      data={props.data.map((v, i) => ({ x: i, y: v }))}
      summary={false}
      width={props.width ?? 40}
      height={props.height ?? 24}
    />
  );
}

export function markCode(): string {
  return `<MicroScatter data={pairs} />`;
}

export function PreviewLive() {
  return <MicroScatterInteractive data={CLOUD} summary={false} width={110} height={66} animate />;
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
