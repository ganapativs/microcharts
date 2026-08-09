import { SegmentedBar } from "@microcharts/react/segmented-bar";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 20 },
];
// Developers read docs on Chrome; readers hit the blog from a phone. Two real
// pages, two honestly different browser mixes — the "traffic mix per row" story.
const DOCS_MIX = [
  { label: "Chrome", value: 700 },
  { label: "Safari", value: 90 },
  { label: "Firefox", value: 60 },
  { label: "Edge", value: 40 },
];
const BLOG_MIX = [
  { label: "Safari", value: 410 },
  { label: "Chrome", value: 340 },
  { label: "Firefox", value: 40 },
];
const PAGES = [
  { path: "/", mix: MIX },
  { path: "/docs", mix: DOCS_MIX },
  { path: "/blog", mix: BLOG_MIX },
];
function topShare(mix: { label: string; value: number }[]): { label: string; pct: number } {
  const total = mix.reduce((s, d) => s + d.value, 0);
  const top = mix.reduce((a, b) => (b.value > a.value ? b : a));
  return { label: top.label, pct: Math.round((top.value / total) * 100) };
}

export const entry: ChartEntry = {
  name: "SegmentedBar",
  slug: "segmented-bar",
  status: "stable",
  collection: "core",
  tagline: "What is this made of, and in what proportions.",
  staticImport: `${PKG}/segmented-bar`,
  interactiveImport: `${PKG}/segmented-bar/interactive`,
  dataShape: "{ label, value }[] (parts of a whole)",
  encoding: { channel: "segment length in a fixed bar", precision: "medium-high" },
  nodeBudget: "≤ 6 + labels",
  maxWidth: 260,
  maxHeight: 40,
  gotchas: [
    "In-SVG label size derives from the mark's height and floors at 7 viewBox units (raise it with `labelSize`); a box too small to seat the label drops the label rather than shrinking it.",
  ],
  bestFor: ["traffic mix per row", "composition in cards"],
  avoidFor: ["comparing across rows precisely (MiniBar)", "negative parts (Waterfall)"],
  props: [
    {
      name: "data",
      type: "{ label; value }[]",
      required: true,
      description: "Parts of the whole.",
    },
    {
      name: "maxSegments",
      type: "number",
      required: false,
      description: "Rollup threshold — the tail becomes a labeled Other.",
    },
    {
      name: "order",
      type: '"data" | "desc"',
      required: false,
      description: "Preserve inherent sequences or rank the composition.",
    },
    {
      name: "label",
      type: '"none" | "percent" | "value"',
      required: false,
      description: "Centered per segment (deterministic drop-out; default percent).",
    },
    {
      name: "colors",
      type: "string[]",
      required: false,
      description: "Per-segment colours, cycled; overrides --mc-cat-N. Other stays neutral.",
    },
  ],
  demo: MIX.map((d) => d.value),
  example: {
    title: "Browser share",
    code: `import { SegmentedBar } from "${PKG}/segmented-bar";\n\n<SegmentedBar data={mix} title="Browser share" />`,
  },
  sampleData: [
    {
      name: "mix",
      code: `const mix = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 20 },
];`,
    },
  ],
};

export function Preview() {
  return <SegmentedBar data={MIX} summary={false} width={130} height={16} />;
} // format/locale/strings/title/summary/id/className/style/children/width/height:
// styling/formatting escape hatches, not chart-shape knobs — no interactive

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["none", "percent", "value"],
      init: "percent",
    },
    { kind: "segmented", key: "order", label: "order", options: ["data", "desc"], init: "data" },
    { kind: "range", key: "maxSegments", label: "max segments", min: 2, max: 5, init: 5 },
  ],
  render: (s) => (
    <SegmentedBar
      data={MIX}
      label={s.label as "none" | "percent" | "value"}
      order={s.order as "data" | "desc"}
      maxSegments={s.maxSegments as number}
      summary={false}
      width={260}
      height={22}
    />
  ),
  code: (s) =>
    [
      "<SegmentedBar",
      "  data={mix}",
      s.label !== "percent" && `  label="${s.label}"`,
      s.order !== "data" && `  order="${s.order}"`,
      s.maxSegments !== 5 && `  maxSegments={${s.maxSegments}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow through the segments — Other announces its member count.",
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<SegmentedBar data={row.mix} width={60} height={10} />`,
    node: <SegmentedBar data={MIX} summary={false} width={60} height={10} />,
  },
  {
    label: "value labels",
    code: `<SegmentedBar
  data={[
    { label: "Chrome", value: 620 },
    { label: "Safari", value: 240 },
    { label: "Firefox", value: 90 },
    { label: "Edge", value: 30 },
    { label: "Arc", value: 20 },
  ]}
  label="value"
  style={{ width: 160 }}
/>`,
    node: <SegmentedBar data={MIX} label="value" summary={false} width={160} height={14} />,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        This week&apos;s sessions skew Chrome{" "}
        <span className="mc-inline">
          <SegmentedBar data={MIX} summary={false} width={90} height={14} />
        </span>{" "}
        — 62% Chrome, 24% Safari, the rest long tail.
      </p>
    ),
    code: `<p>\n  This week's sessions skew Chrome{" "}\n  <span className="mc-inline">\n    <SegmentedBar data={mix} width={90} height={14} summary={false} />\n  </span>{" "}\n  — 62% Chrome, 24% Safari, the rest long tail.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {PAGES.map((p) => {
            const top = topShare(p.mix);
            return (
              <tr key={p.path}>
                <td className="py-1.5 pr-3 text-fd-muted-foreground">{p.path}</td>
                <td className="py-1.5">
                  <SegmentedBar data={p.mix} summary={false} width={90} height={12} />
                </td>
                <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                  {top.label} {top.pct}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    ),
    code: `<td>\n  <SegmentedBar data={row.mix} width={90} height={12} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Browser coverage</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">62%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">sessions on Chrome</span>
          </div>
        </div>
        <SegmentedBar data={MIX} summary={false} width={200} height={20} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">62%</span>\n  <span className="unit">sessions on Chrome</span>\n  <SegmentedBar data={mix} width={200} height={20} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Marketing", MIX],
            ["Docs", DOCS_MIX],
          ] as const
        ).map(([name, mix], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <SegmentedBar data={mix} summary={false} width={54} height={12} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Marketing <SegmentedBar data={mix} width={54} height={12} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <SegmentedBar
      data={props.data.slice(0, 4).map((v, i) => ({ label: `c${i + 1}`, value: v }))}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 10}
    />
  );
}

export function markCode(): string {
  return `<SegmentedBar data={mix} />`;
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
