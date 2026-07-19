import { StackedArea } from "@microcharts/react/stacked-area";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const MIX = [
  { label: "Mobile", values: [30, 34, 36, 40, 44, 47, 52, 56, 58, 60, 63, 66] },
  { label: "Web", values: [50, 48, 47, 45, 42, 41, 38, 36, 35, 33, 32, 30] },
  { label: "API", values: [20, 18, 17, 15, 14, 12, 10, 8, 7, 7, 5, 4] },
];

export const entry: ChartEntry = {
  name: "StackedArea",
  slug: "stacked-area",
  status: "stable",
  collection: "core",
  tagline: "How the composition is shifting over time.",
  staticImport: `${PKG}/stacked-area`,
  interactiveImport: `${PKG}/stacked-area/interactive`,
  dataShape: "{ label, values }[], at most 3 series, stacked to 100%",
  encoding: {
    channel: "layer thickness (share) over time",
    precision: "low — thickness reads approximately; hover for exact shares",
  },
  nodeBudget: "≤ 7 (≤ 3 area paths + labels)",
  bestFor: ["traffic/revenue mix in KPI cards", "share-shift stories in sentences"],
  avoidFor: ["4+ series", "exact values over time (SparkGroup of Sparklines)"],
  props: [
    {
      name: "data",
      type: "{ label; values }[]",
      required: true,
      description: "≤ 3 series (hard cap).",
    },
    {
      name: "variant",
      type: '"stacked" | "ridge"',
      required: false,
      description: "Ridge = same stack, overlapping-crest skin.",
    },
    {
      name: "order",
      type: '"data" | "asc"',
      required: false,
      description: '"asc" puts the smallest series on top (least distortion).',
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Endpoint share labels per series (deterministic drop-out).",
    },
    {
      name: "curve",
      type: '"linear" | "smooth" | "step"',
      required: false,
      description: "Line interpolation (default linear); ridge forces smooth.",
    },
    {
      name: "colors",
      type: "string[]",
      required: false,
      description: "Per-series colours, cycled; overrides --mc-cat-N.",
    },
  ],
  demo: MIX[0].values,
  example: {
    title: "Traffic mix",
    code: `import { StackedArea } from "${PKG}/stacked-area";\n\n<StackedArea data={mix} title="Traffic mix" />`,
  },
  sampleData: [
    {
      name: "mix",
      code: `const mix = [
  { label: "Mobile", values: [30, 34, 36, 40, 44, 47, 52, 56, 58, 60, 63, 66] },
  { label: "Web", values: [50, 48, 47, 45, 42, 41, 38, 36, 35, 33, 32, 30] },
  { label: "API", values: [20, 18, 17, 15, 14, 12, 10, 8, 7, 7, 5, 4] },
];`,
    },
  ],
};

export function Preview() {
  return <StackedArea data={MIX} summary={false} width={130} height={22} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "variant",
      label: "variant",
      options: ["stacked", "ridge"],
      init: "stacked",
    },
    {
      kind: "segmented",
      key: "order",
      label: "order",
      options: ["data", "asc"],
      init: "data",
    },
    {
      kind: "segmented",
      key: "label",
      label: "endpoint labels",
      options: ["none", "last"],
      init: "none",
    },
    {
      kind: "segmented",
      key: "curve",
      label: "curve",
      options: ["linear", "smooth"],
      init: "linear",
    },
    {
      kind: "segmented",
      key: "locale",
      label: "locale",
      options: ["en-US", "de-DE"],
      init: "en-US",
    },
    // accessible-name plumbing, not chart-shape knobs (consistent with every
    // other chart's playground).
  ],
  render: (s) => (
    <StackedArea
      data={MIX}
      variant={s.variant as "stacked" | "ridge"}
      order={s.order as "data" | "asc"}
      label={s.label as "last" | "none"}
      curve={s.curve as "linear" | "smooth"}
      locale={s.locale as string}
      summary={false}
      width={260}
      height={32}
    />
  ),
  code: (s) =>
    [
      "<StackedArea",
      "  data={mix}",
      s.variant !== "stacked" && `  variant="${s.variant}"`,
      s.order !== "data" && `  order="${s.order}"`,
      s.label !== "none" && `  label="${s.label}"`,
      s.curve !== "linear" && `  curve="${s.curve}"`,
      s.locale !== "en-US" && `  locale="${s.locale}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow across — each point announces every layer's share at once.",
};

export const recipes: Recipe[] = [
  {
    label: "mix rows",
    code: `{regions.map((r) => (\n  <StackedArea key={r.id} data={r.mix} title={r.name} />\n))}`,
    node: <StackedArea data={MIX} summary={false} width={160} height={18} />,
  },
  {
    label: "ridge skin",
    code: `<StackedArea data={mix} variant="ridge" />`,
    node: <StackedArea data={MIX} variant="ridge" summary={false} width={160} height={20} />,
  },
];

const REGIONS: { name: string; mix: typeof MIX; leader: string }[] = [
  { name: "NA", mix: MIX, leader: "Mobile 66%" },
  {
    name: "EU",
    mix: [
      { label: "Mobile", values: [25, 26, 26, 27, 28, 28, 29, 30, 30, 31, 32, 33] },
      { label: "Web", values: [55, 54, 54, 53, 52, 52, 51, 50, 50, 49, 48, 47] },
      { label: "API", values: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20] },
    ],
    leader: "Web 47%",
  },
  {
    name: "APAC",
    mix: [
      { label: "Mobile", values: [60, 62, 64, 66, 68, 70, 72, 74, 75, 77, 78, 80] },
      { label: "Web", values: [30, 28, 27, 25, 23, 21, 19, 17, 16, 14, 13, 11] },
      { label: "API", values: [10, 10, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9] },
    ],
    leader: "Mobile 80%",
  },
];

const REVENUE = [
  { label: "Subscriptions", values: [62, 60, 58, 57, 55, 54, 52, 51, 50, 49, 48, 47] },
  { label: "Usage", values: [28, 29, 30, 30, 31, 32, 33, 33, 34, 34, 35, 36] },
  { label: "Services", values: [10, 11, 12, 13, 14, 14, 15, 16, 16, 17, 17, 17] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Traffic mix this year{" "}
        <span className="mc-inline">
          <StackedArea data={MIX} summary={false} width={80} height={16} />
        </span>{" "}
        — mobile overtook web, now 66% of sessions.
      </p>
    ),
    code: `<p>\n  Traffic mix this year{" "}\n  <StackedArea data={mix} width={80} height={16} /> — mobile overtook web, now 66% of sessions.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {REGIONS.map((r) => (
            <tr key={r.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{r.name}</td>
              <td className="py-1.5">
                <StackedArea data={r.mix} summary={false} width={60} height={18} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{r.leader}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <StackedArea data={mix} width={60} height={18} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Revenue mix</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">47%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">
              subscriptions, down from 62%
            </span>
          </div>
        </div>
        <StackedArea data={REVENUE} summary={false} width={120} height={30} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">47%</span>\n  <span className="unit">subscriptions, down from 62%</span>\n  <StackedArea data={mix} width={120} height={30} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Traffic", MIX],
            ["Revenue", REVENUE],
          ] as const
        ).map(([name, rows], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <StackedArea data={rows} summary={false} width={40} height={14} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Traffic <StackedArea data={mix} height={14} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <StackedArea
      data={[
        { label: "A", values: props.data.map((v) => Math.abs(v) + 1) },
        { label: "B", values: props.data.map((v, i) => Math.abs(v) * 0.6 + i * 0.2 + 1) },
      ]}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 14}
    />
  );
}

export function markCode(): string {
  return `<StackedArea data={mix} />`;
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
