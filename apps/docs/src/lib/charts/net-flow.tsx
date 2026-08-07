import { NetFlow } from "@microcharts/react/net-flow";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// monthly cash flow (values in $k) — mostly net-positive, two months in the red
export const DEMO = [
  { in: 42, out: 31 },
  { in: 38, out: 35 },
  { in: 45, out: 29 },
  { in: 40, out: 44 },
  { in: 52, out: 38 },
  { in: 48, out: 41 },
  { in: 55, out: 36 },
  { in: 50, out: 47 },
  { in: 58, out: 39 },
  { in: 44, out: 52 },
  { in: 60, out: 41 },
  { in: 57, out: 43 },
];
export const KFMT = (n: number) => `${n}k`;

export const entry: ChartEntry = {
  name: "NetFlow",
  slug: "net-flow",
  status: "stable",
  collection: "decision",
  tagline: "In versus out, and where does that leave us net?",
  staticImport: `${PKG}/net-flow`,
  interactiveImport: `${PKG}/net-flow/interactive`,
  dataShape: "{ in, out }[] per period, oldest first",
  encoding: {
    channel: "mirrored area extent around zero + net line position",
    precision: "medium — the net line restores the precise decision value",
  },
  nodeBudget: "≤ 6",
  maxWidth: 320,
  maxHeight: 80,
  gotchas: [
    "In-SVG label size derives from the mark's height and floors at 7 viewBox units (raise it with `labelSize`); a box too small to seat the label drops the label rather than shrinking it.",
  ],
  bestFor: [
    "cash flow per account row",
    "user in/out (signups vs churn) in a KPI card",
    "any in-vs-out where the net is the decision",
  ],
  avoidFor: ["a single net series (Sparkline)", "one period's split (Delta / SegmentedBar)"],
  props: [
    {
      name: "data",
      type: "{ in; out }[]",
      required: true,
      description: "Periods, oldest first — inflow and outflow magnitudes (both ≥ 0).",
    },
    {
      name: "mode",
      type: '"area" | "bars"',
      required: false,
      description: "Mirrored areas (default) or discrete columns for few periods.",
    },
    {
      name: "net",
      type: "boolean",
      required: false,
      description: "The net line (in − out). Default true.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which direction is good — 'down' for debt-paydown contexts.",
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Signed net in a right gutter.",
    },
  ],
  demo: DEMO.map((d) => d.in - d.out),
  example: {
    title: "Monthly cash flow",
    code: `import { NetFlow } from "${PKG}/net-flow";\n\n<NetFlow data={months} title="Monthly cash flow" />`,
  },
  sampleData: [
    {
      name: "months",
      code: `// monthly cash flow (values in $k) — mostly net-positive, two months in the red
const months = [
  { in: 42, out: 31 }, { in: 38, out: 35 }, { in: 45, out: 29 }, { in: 40, out: 44 },
  { in: 52, out: 38 }, { in: 48, out: 41 }, { in: 55, out: 36 }, { in: 50, out: 47 },
  { in: 58, out: 39 }, { in: 44, out: 52 }, { in: 60, out: 41 }, { in: 57, out: 43 },
];`,
    },
  ],
};

export function Preview() {
  return <NetFlow data={DEMO} format={KFMT} summary={false} width={150} height={26} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "mode", label: "mode", options: ["area", "bars"], init: "area" },
    { kind: "toggle", key: "net", label: "net line", init: true },
    { kind: "segmented", key: "label", label: "label", options: ["none", "last"], init: "last" },
  ],
  render: (s) => (
    <NetFlow
      data={DEMO}
      format={KFMT}
      mode={s.mode as "area" | "bars"}
      net={s.net as boolean}
      label={s.label as "last" | "none"}
      summary={false}
      width={280}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<NetFlow",
      "  data={months}",
      s.mode !== "area" && `  mode="${s.mode}"`,
      s.net === false && "  net={false}",
      s.label !== "last" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the months — each announces inflow, outflow, and the signed net.",
};

export const recipes: Recipe[] = [
  {
    label: "mirrored bars for few months",
    code: `<NetFlow
  data={[
    { in: 42, out: 31 }, { in: 38, out: 35 }, { in: 45, out: 29 }, { in: 40, out: 44 },
    { in: 52, out: 38 }, { in: 48, out: 41 }, { in: 55, out: 36 }, { in: 50, out: 47 },
    { in: 58, out: 39 }, { in: 44, out: 52 }, { in: 60, out: 41 }, { in: 57, out: 43 },
  ]}
  mode="bars"
/>`,
    node: <NetFlow data={DEMO} format={KFMT} mode="bars" summary={false} width={170} height={26} />,
  },
  {
    label: "debt paydown (outflow is the goal)",
    code: `<NetFlow
  data={[
    { in: 42, out: 31 }, { in: 38, out: 35 }, { in: 45, out: 29 }, { in: 40, out: 44 },
    { in: 52, out: 38 }, { in: 48, out: 41 }, { in: 55, out: 36 }, { in: 50, out: 47 },
    { in: 58, out: 39 }, { in: 44, out: 52 }, { in: 60, out: 41 }, { in: 57, out: 43 },
  ]}
  positive="down"
/>`,
    node: (
      <NetFlow data={DEMO} format={KFMT} positive="down" summary={false} width={170} height={26} />
    ),
  },
];

const CTX_ROWS = [
  {
    name: "Operating",
    meta: "+$62K",
    data: [
      { in: 52, out: 38 },
      { in: 55, out: 36 },
      { in: 58, out: 34 },
      { in: 60, out: 32 },
      { in: 62, out: 30 },
      { in: 64, out: 28 },
      { in: 66, out: 26 },
      { in: 68, out: 24 },
    ] as typeof DEMO,
  },
  {
    name: "Investing",
    meta: "−$28K",
    data: [
      { in: 18, out: 32 },
      { in: 16, out: 34 },
      { in: 15, out: 36 },
      { in: 14, out: 38 },
      { in: 12, out: 40 },
      { in: 11, out: 42 },
      { in: 10, out: 44 },
      { in: 8, out: 46 },
    ] as typeof DEMO,
  },
  {
    name: "Financing",
    meta: "+$8K",
    data: [
      { in: 22, out: 18 },
      { in: 23, out: 17 },
      { in: 24, out: 17 },
      { in: 25, out: 16 },
      { in: 26, out: 16 },
      { in: 27, out: 15 },
      { in: 28, out: 15 },
      { in: 29, out: 14 },
    ] as typeof DEMO,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Monthly cash flow{" "}
        <span className="mc-inline">
          <NetFlow data={DEMO} format={KFMT} height={16} summary={false} />
        </span>{" "}
        — net positive for the third month.
      </p>
    ),
    code: '<p>\n  Monthly cash flow{" "}\n  <span className="mc-inline">\n    <NetFlow data={months} summary={false} />\n  </span>{" "}\n  — net positive for the third month.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <NetFlow data={row.data} format={KFMT} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <NetFlow data={months} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Net flow</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">+$42K</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">this month</span>
          </div>
        </div>
        <NetFlow data={CTX_ROWS[0]!.data} format={KFMT} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">+$42K</span>\n  <span className="unit">this month</span>\n  <NetFlow data={months} />\n</div>',
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
            <NetFlow data={row.data} format={KFMT} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Operating <NetFlow data={months} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  if (!props.data.length) {
    return (
      <NetFlow
        data={DEMO}
        label="none"
        summary={false}
        width={props.width ?? 70}
        height={props.height ?? 18}
      />
    );
  }
  return (
    <NetFlow
      data={props.data.map((v, j) => ({ in: Math.abs(v) + 4, out: Math.abs(v) * 0.7 + (j % 4) }))}
      label="none"
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<NetFlow data={months} />`;
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
