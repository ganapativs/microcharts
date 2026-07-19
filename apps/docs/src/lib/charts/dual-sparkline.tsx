import { DualSparkline } from "@microcharts/react/dual-sparkline";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const US = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4, 19, 21];
export const BENCH = [12, 12.4, 12.8, 13.1, 13.6, 14, 14.2, 14.8, 15, 15.4, 15.8, 16];
/** Same two series, roles swapped or matched — zero invented numbers, three real
 *  reads: leading, trailing, and identical ("Matching benchmark."). */
const ROWS: { label: string; data: number[]; compare: number[]; read: string }[] = [
  { label: "Checkout", data: US, compare: BENCH, read: "leading" },
  { label: "Search", data: BENCH, compare: US, read: "trailing" },
  { label: "Onboarding", data: BENCH, compare: BENCH, read: "matching" },
];

export const entry: ChartEntry = {
  name: "DualSparkline",
  slug: "dual-sparkline",
  status: "stable",
  collection: "core",
  tagline: "How is this series doing against its benchmark.",
  staticImport: `${PKG}/dual-sparkline`,
  interactiveImport: `${PKG}/dual-sparkline/interactive`,
  dataShape: "data: (number | null)[] + compare: (number | null)[], exactly two series",
  encoding: {
    channel: "two line positions on ONE shared scale",
    precision: "medium — the gap between the lines is the read; hover for exact pairs",
  },
  nodeBudget: "≤ 8 (2 paths + band + endpoint dots + label)",
  bestFor: ["metric-vs-benchmark in table cells", "actual-vs-plan in KPI cards"],
  avoidFor: ["3+ series (SparkGroup)", "different units per series (never dual axes)"],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "The series being judged.",
    },
    {
      name: "compare",
      type: "(number | null)[]",
      required: true,
      description: "The benchmark — dashed, thinner, neutral.",
    },
    {
      name: "compareLabel",
      type: "string",
      required: false,
      description: "Names the reference in the summary and announcements.",
    },
    {
      name: "curve",
      type: '"linear" | "smooth" | "step"',
      required: false,
      description: "Line shape (default 'linear').",
    },
    {
      name: "band",
      type: "[number, number]",
      required: false,
      description: "Normal-range band behind both (shared grammar).",
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Endpoint value label for the primary series.",
    },
    {
      name: "seriesStrings",
      type: "SeriesStrings",
      required: false,
      description: "i18n strings for the per-series trend clauses.",
    },
  ],
  demo: US,
  example: {
    title: "Conversion vs market",
    code: `import { DualSparkline } from "${PKG}/dual-sparkline";\n\n<DualSparkline data={ours} compare={market} title="Conversion vs market" />`,
  },
  sampleData: [
    {
      name: "ours",
      code: `const ours = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4, 19, 21];`,
    },
    {
      name: "market",
      code: `const market = [12, 12.4, 12.8, 13.1, 13.6, 14, 14.2, 14.8, 15, 15.4, 15.8, 16];`,
    },
  ],
};

export function Preview() {
  return <DualSparkline data={US} compare={BENCH} summary={false} width={130} height={22} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["none", "last"],
      init: "none",
    },
    { kind: "toggle", key: "band", label: "band", init: false },
  ],
  render: (s) => (
    <DualSparkline
      data={US}
      compare={BENCH}
      label={s.label as "last" | "none"}
      band={s.band ? [13, 16] : undefined}
      summary={false}
      width={260}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<DualSparkline",
      "  data={ours}",
      "  compare={market}",
      s.label !== "none" && `  label="${s.label}"`,
      s.band && "  band={[13, 16]}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow across — each point announces both values side by side.",
};

export const recipes: Recipe[] = [
  {
    label: "channel rows vs market",
    code: `{channels.map((c) => (\n  <DualSparkline key={c.id} data={c.series} compare={market} title={c.name} />\n))}`,
    node: <DualSparkline data={US} compare={BENCH} summary={false} width={160} height={16} />,
  },
  {
    label: "flip the primary — benchmark as the judged line",
    code: `<DualSparkline data={market} compare={ours} label="last" />`,
    node: (
      <DualSparkline
        data={BENCH}
        compare={US}
        label="last"
        summary={false}
        width={160}
        height={18}
      />
    ),
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Checkout conversion is outrunning the market{" "}
        <span className="mc-inline">
          <DualSparkline data={US} compare={BENCH} summary={false} width={70} height={18} />
        </span>{" "}
        — up 75% this quarter against the market&apos;s 33% gain.
      </p>
    ),
    code: `<p>\n  Checkout conversion is outrunning the market{" "}\n  <DualSparkline data={ours} compare={market} width={70} height={18} /> — up 75% vs the market's 33%.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {ROWS.map((r) => (
            <tr key={r.label}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{r.label}</td>
              <td className="py-1.5">
                <DualSparkline
                  data={r.data}
                  compare={r.compare}
                  summary={false}
                  width={70}
                  height={18}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{r.read}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <DualSparkline data={ours} compare={market} width={70} height={18} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Conversion vs plan</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">21%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">plan 16% · +75% vs +33%</span>
          </div>
        </div>
        <DualSparkline
          data={US}
          compare={BENCH}
          label="last"
          summary={false}
          width={130}
          height={40}
        />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">21%</span>\n  <span className="unit">plan 16% · +75% vs +33%</span>\n  <DualSparkline data={ours} compare={market} label="last" width={130} height={40} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {ROWS.slice(0, 2).map((r, i) => (
          <span
            key={r.label}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {r.label}
            <DualSparkline
              data={r.data}
              compare={r.compare}
              summary={false}
              width={50}
              height={14}
            />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Checkout <DualSparkline data={ours} compare={market} width={50} height={14} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <DualSparkline
      data={props.data}
      compare={props.data.map((v, i) => v * 0.85 + i * 0.1)}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 14}
    />
  );
}

export function markCode(): string {
  return `<DualSparkline data={ours} compare={market} />`;
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
