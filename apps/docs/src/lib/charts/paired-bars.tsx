import { PairedBars } from "@microcharts/react/paired-bars";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
type PairRow = { label: string; value: number | null; ref: number | null }[];
export const BUDGET: PairRow = [
  { label: "East", value: 940, ref: 1200 },
  { label: "West", value: 410, ref: 400 },
  { label: "South", value: 620, ref: 600 },
  { label: "North", value: 120, ref: 300 },
];

export const entry: ChartEntry = {
  name: "PairedBars",
  slug: "paired-bars",
  status: "stable",
  collection: "core",
  tagline: "Actual vs expected, category by category: one shared scale.",
  staticImport: `${PKG}/paired-bars`,
  interactiveImport: `${PKG}/paired-bars/interactive`,
  dataShape: "{ label, value, ref }[]",
  encoding: { channel: "adjacent bar lengths, zero-anchored", precision: "high" },
  nodeBudget: "2 per pair (pairs ≤ 5)",
  maxWidth: 240,
  maxHeight: 80,
  gotchas: [
    "Past 5 pairs the grouped read blurs; the component dev-warns past the cap.",
    "Every `ref` missing means MiniBar is the chart, and the component says so.",
  ],
  bestFor: ["budget vs actual per region", "target vs result rows"],
  avoidFor: ["no reference series (MiniBar)", "> 5 pairs"],
  props: [
    {
      name: "data",
      type: "{ label; value; ref }[]",
      required: true,
      description: "Value + reference per category.",
    },
    {
      name: "mode",
      type: '"grouped" | "overlay"',
      required: false,
      description: "Overlay puts the ref as a full-width ghost behind — halves the footprint.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Over/under-reference valence tint.",
    },
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      required: false,
      description: "Rows for wide cells.",
    },
    {
      name: "locale",
      type: "string | string[]",
      required: false,
      description: 'BCP 47 locale(s) for the gap named in the summary, e.g. "de-DE".',
    },
  ],
  demo: BUDGET.map((d) => d.value ?? 0),
  example: {
    title: "Budget vs actual",
    code: `import { PairedBars } from "${PKG}/paired-bars";\n\n<PairedBars data={regions} title="Actual vs plan" />`,
  },
  sampleData: [
    {
      name: "regions",
      code: `const regions = [
  { label: "East", value: 940, ref: 1200 },
  { label: "West", value: 410, ref: 400 },
  { label: "South", value: 620, ref: 600 },
  { label: "North", value: 120, ref: 300 },
];`,
    },
  ],
};

export function Preview() {
  return <PairedBars data={BUDGET} summary={false} width={120} height={40} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["grouped", "overlay"],
      init: "grouped",
    },
    { kind: "toggle", key: "positive", label: "valence", init: false },
    {
      kind: "segmented",
      key: "orientation",
      label: "orientation",
      options: ["vertical", "horizontal"],
      init: "vertical",
    },
    {
      kind: "segmented",
      key: "locale",
      label: "locale",
      options: ["en-US", "de-DE"],
      init: "en-US",
    },
    // `data` is the fixed demo series — edge cases (missing ref, single pair) get
    // their own LiveDemos below. `domain`/`color`/`format`/`strings`/`id`/

    // a reader twiddles.
  ],
  render: (s) => (
    <PairedBars
      data={BUDGET}
      mode={s.mode as "grouped" | "overlay"}
      positive={(s.positive as boolean) ? "up" : undefined}
      orientation={s.orientation as "horizontal" | "vertical"}
      locale={s.locale as string}
      summary={false}
      style={
        s.orientation === "horizontal" ? { width: 200, height: 110 } : { width: 220, height: 72 }
      }
    />
  ),
  code: (s) =>
    [
      "<PairedBars",
      "  data={regions}",
      s.mode !== "grouped" && `  mode="${s.mode}"`,
      (s.positive as boolean) && '  positive="up"',
      s.orientation === "horizontal" && '  orientation="horizontal"',
      s.locale !== "en-US" && `  locale="${s.locale}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover a pair or rove with arrows — each announces value vs reference.",
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<PairedBars data={row.mix} width={60} height={20} />`,
    node: <PairedBars data={BUDGET} summary={false} width={60} height={20} />,
  },
  {
    label: "overlay for tight cells",
    code: `// ghost = the reference, never the value\n<PairedBars data={row.mix} mode="overlay" />`,
    node: <PairedBars data={BUDGET} mode="overlay" summary={false} width={60} height={20} />,
  },
];

const MARKETING: PairRow = [
  { label: "Ads", value: 82, ref: 65 },
  { label: "Content", value: 38, ref: 50 },
  { label: "Events", value: 21, ref: 20 },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Regional spend vs plan this quarter{" "}
        <span className="mc-inline">
          <PairedBars data={BUDGET} summary={false} width={100} height={18} />
        </span>{" "}
        — East is furthest off target, 940 spent against a 1,200 budget.
      </p>
    ),
    code: `<p>\n  Regional spend vs plan this quarter{" "}\n  <span className="mc-inline">\n    <PairedBars data={regions} width={100} height={18} summary={false} />\n  </span>{" "}\n  — East is furthest off target, 940 spent against a 1,200 budget.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {BUDGET.slice(0, 3).map((r) => {
            const value = r.value ?? 0;
            const ref = r.ref ?? 0;
            const over = value >= ref;
            const gap = Math.abs(value - ref);
            return (
              <tr key={r.label}>
                <td className="py-1.5 pr-3 text-fd-muted-foreground">{r.label}</td>
                <td className="py-1.5">
                  <PairedBars data={[r]} positive="down" summary={false} width={50} height={16} />
                </td>
                <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                  {gap} {over ? "over" : "under"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    ),
    code: `<td>\n  <PairedBars data={[{ label: "East", value: 940, ref: 1200 }]} positive="down" />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Regions under budget</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">2 / 4</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">this quarter</span>
          </div>
        </div>
        <PairedBars data={BUDGET} positive="down" summary={false} width={110} height={30} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">2 / 4</span>\n  <span className="unit">regions under budget, this quarter</span>\n  <PairedBars data={regions} positive="down" width={110} height={30} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Regional", BUDGET],
            ["Marketing", MARKETING],
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
            <PairedBars data={[rows[0]!]} positive="down" summary={false} width={64} height={16} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Regional <PairedBars data={[{ label: "East", value: 940, ref: 1200 }]} positive="down" width={64} height={16} summary={false} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <PairedBars
      data={props.data.slice(0, 4).map((v, i) => ({ label: `c${i + 1}`, value: v, ref: v * 1.15 }))}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<PairedBars data={pairs} />`;
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
