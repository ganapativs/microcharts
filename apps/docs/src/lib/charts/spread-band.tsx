import { SpreadBand } from "@microcharts/react/spread-band";
import { SpreadBand as SpreadBandInteractive } from "@microcharts/react/spread-band/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const ORG = [8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24];
const PAID = [12, 12, 13, 13, 13, 14, 14, 14, 15, 15, 16, 16];
const PAIRS = ORG.map((a, i) => ({ a, b: PAID[i]! }));
const LABELS: [string, string] = ["Organic", "Paid"];

export const entry: ChartEntry = {
  name: "SpreadBand",
  slug: "spread-band",
  status: "stable",
  collection: "decision",
  tagline: "Which of two series leads, by how much, and since when.",
  staticImport: `${PKG}/spread-band`,
  interactiveImport: `${PKG}/spread-band/interactive`,
  dataShape: "data: { a, b }[] — a = subject, b = reference (null in either = gap in both)",
  encoding: {
    channel: "signed area between two lines on ONE shared scale, split at crossings",
    precision: "medium — the filled gap is the read; hover for the exact lead",
  },
  nodeBudget: "≤ 8 (2 band fills + 2 lines + crossing/endpoint dots + label)",
  bestFor: ["lead-vs-reference in KPI cards", "actual-vs-plan where the flip matters"],
  avoidFor: ["3+ series (SparkGroup)", "unpaired series or different units (never dual axes)"],
  props: [
    {
      name: "data",
      type: "{ a: number | null; b: number | null }[]",
      required: true,
      description: "Paired readings — a is the subject, b the reference.",
    },
    {
      name: "labels",
      type: "[string, string]",
      required: false,
      description: "Names the two series in the summary and label.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which lead is the good valence; down flips the fill colors.",
    },
    {
      name: "label",
      type: '"gap" | "none"',
      required: false,
      description: "Current signed gap in a right gutter (default gap).",
    },
  ],
  demo: ORG,
  example: {
    title: "Organic vs paid",
    code: `import { SpreadBand } from "${PKG}/spread-band";\n\n<SpreadBand data={pairs} labels={["Organic", "Paid"]} title="Organic vs paid" />`,
  },
  sampleData: [
    {
      name: "pairs",
      code: `const pairs = [
  { a: 8, b: 12 }, { a: 9, b: 12 }, { a: 11, b: 13 }, { a: 12, b: 13 },
  { a: 14, b: 13 }, { a: 15, b: 14 }, { a: 17, b: 14 }, { a: 18, b: 14 },
  { a: 20, b: 15 }, { a: 21, b: 15 }, { a: 23, b: 16 }, { a: 24, b: 16 },
];`,
    },
  ],
};

export function Preview() {
  return <SpreadBand data={PAIRS} labels={LABELS} summary={false} width={140} height={26} />;
}

export const showcase = {
  hint: "lead + flip",
  Node: () => (
    <SpreadBand data={PAIRS} labels={LABELS} title="Organic vs paid" width={140} height={26} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "label", label: "label", options: ["gap", "none"], init: "gap" },
    {
      kind: "segmented",
      key: "positive",
      label: "good lead",
      options: ["up", "down"],
      init: "up",
    },
  ],
  render: (s) => (
    <SpreadBand
      data={PAIRS}
      labels={LABELS}
      label={s.label as "gap" | "none"}
      positive={s.positive as "up" | "down"}
      summary={false}
      width={260}
      height={34}
    />
  ),
  code: (s) =>
    [
      "<SpreadBand",
      "  data={pairs}",
      '  labels={["Organic", "Paid"]}',
      s.label !== "gap" && `  label="${s.label}"`,
      s.positive !== "up" && `  positive="${s.positive}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <SpreadBandInteractive
      data={PAIRS}
      labels={LABELS}
      label={s.label as "gap" | "none"}
      positive={s.positive as "up" | "down"}
      animate={ui.animate}
      summary={false}
      width={260}
      height={34}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<SpreadBand",
      "  data={pairs}",
      '  labels={["Organic", "Paid"]}',
      s.label !== "gap" && `  label="${s.label}"`,
      s.positive !== "up" && `  positive="${s.positive}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow across — each point announces who leads and by how much.",
};

export const recipes: Recipe[] = [
  {
    label: "lead vs reference in a cell",
    code: `{rows.map((r) => (\n  <SpreadBand key={r.id} data={r.pairs} labels={["Us", "Market"]} title={r.name} />\n))}`,
    node: <SpreadBand data={PAIRS} labels={LABELS} summary={false} width={160} height={16} />,
  },
  {
    label: "actual vs plan with the gap",
    code: `<SpreadBand data={pairs} labels={["Actual", "Plan"]} label="gap" />`,
    node: (
      <SpreadBand
        data={PAIRS}
        labels={LABELS}
        label="gap"
        summary={false}
        width={170}
        height={22}
      />
    ),
  },
];

const CTX_ROWS = [
  { name: "Organic", meta: "+18%" },
  { name: "Paid", meta: "baseline" },
  { name: "Referral", meta: "+6%" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Organic vs paid{" "}
        <span className="mc-inline">
          <SpreadBand data={PAIRS} labels={LABELS} height={16} summary={false} />
        </span>{" "}
        — organic leads by 18% on median.
      </p>
    ),
    code: '<p>\n  Organic vs paid <SpreadBand data={pairs} labels={["Organic", "Paid"]} /> — organic leads by 18% on median.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <SpreadBand data={PAIRS} labels={LABELS} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: '<td>\n  <SpreadBand data={pairs} labels={["Organic", "Paid"]} />\n</td>',
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Gap</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">+18%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">organic vs paid</span>
          </div>
        </div>
        <SpreadBand data={PAIRS} labels={LABELS} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">+18%</span>\n  <span className="unit">organic vs paid</span>\n  <SpreadBand data={pairs} labels={["Organic", "Paid"]} />\n</div>',
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
            <SpreadBand data={PAIRS} labels={LABELS} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Organic <SpreadBand data={pairs} labels={["Organic", "Paid"]} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  if (!props.data.length) {
    return (
      <SpreadBand
        data={PAIRS}
        labels={LABELS}
        summary={false}
        width={props.width ?? 60}
        height={props.height ?? 14}
      />
    );
  }
  return (
    <SpreadBand
      data={props.data.map((v, i) => ({ a: v, b: v * 0.82 + i * 0.4 }))}
      labels={LABELS}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 14}
    />
  );
}

export function markCode(): string {
  return `<SpreadBand data={pairs} labels={["Organic", "Paid"]} />`;
}

export function PreviewLive() {
  return (
    <SpreadBandInteractive
      data={PAIRS}
      labels={LABELS}
      summary={false}
      width={140}
      height={26}
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
