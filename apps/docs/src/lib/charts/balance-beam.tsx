import { BalanceBeam } from "@microcharts/react/balance-beam";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
type Pair = [{ label: string; value: number }, { label: string; value: number }];
export const FLOW: Pair = [
  { label: "Inflow", value: 620 },
  { label: "Outflow", value: 480 },
];

export const entry: ChartEntry = {
  name: "BalanceBeam",
  slug: "balance-beam",
  status: "stable",
  collection: "expressive",
  tagline: "Which of two sides outweighs, and roughly by how much.",
  staticImport: `${PKG}/balance-beam`,
  interactiveImport: `${PKG}/balance-beam/interactive`,
  dataShape: "[{ label, value }, { label, value }]",
  encoding: { channel: "beam tilt direction + saturating angle", precision: "medium" },
  nodeBudget: "≤ 6",
  bestFor: [
    "a buy vs sell or in vs out read in a sentence",
    "a pro vs con weight in a KPI card",
    "an A-vs-B pair where direction is the story",
  ],
  avoidFor: ["exact ratios (PairedBars / Delta)", "more than two items (MiniBar)", "trends"],
  props: [
    {
      name: "data",
      type: "[{label,value},{label,value}]",
      required: true,
      description: "Exactly two items.",
    },
    {
      name: "maxTilt",
      type: "number",
      required: false,
      description: "Degrees at full saturation (default 12).",
    },
    {
      name: "shape",
      type: '"square" | "round"',
      required: false,
      description: "Weight shape (default square).",
    },
    {
      name: "mode",
      type: '"ratio" | "difference"',
      required: false,
      description: "ratio = share-of-whole; difference = absolute, scaled by domain.",
    },
  ],
  demo: [620, 480],
  example: {
    title: "Cash flow",
    code: `import { BalanceBeam } from "${PKG}/balance-beam";\n\n<BalanceBeam data={[{ label: "Inflow", value: 620 }, { label: "Outflow", value: 480 }]} />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-center gap-4">
      <BalanceBeam data={FLOW} summary={false} width={56} height={24} />
      <BalanceBeam
        data={[
          { label: "A", value: 500 },
          { label: "B", value: 500 },
        ]}
        summary={false}
        width={56}
        height={24}
      />
    </span>
  );
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "left", label: "left", min: 0, max: 1000, step: 20, init: 620 },
    { kind: "range", key: "right", label: "right", min: 0, max: 1000, step: 20, init: 480 },
    {
      kind: "segmented",
      key: "shape",
      label: "shape",
      options: ["square", "round"],
      init: "square",
    },
    { kind: "toggle", key: "label", label: "values", init: false },
  ],
  render: (s) => (
    <BalanceBeam
      data={[
        { label: "Inflow", value: s.left as number },
        { label: "Outflow", value: s.right as number },
      ]}
      shape={s.shape as "square" | "round"}
      label={s.label ? "values" : "none"}
      summary={false}
      width={120}
      height={44}
    />
  ),
  code: (s) =>
    [
      "<BalanceBeam",
      `  data={[{ label: "Inflow", value: ${s.left} }, { label: "Outflow", value: ${s.right} }]}`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      s.label && '  label="values"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow Left/Right to read a side's value — a flip of the heavier side is announced.",
};

export const recipes: Recipe[] = [
  {
    label: "round weights + values",
    code: `<BalanceBeam data={pair} shape="round" label="values" />`,
    node: (
      <BalanceBeam
        data={FLOW}
        shape="round"
        label="values"
        summary={false}
        width={90}
        height={34}
      />
    ),
  },
  {
    label: "balanced reads level",
    code: `<BalanceBeam data={[{ label: "A", value: 500 }, { label: "B", value: 500 }]} />`,
    node: (
      <BalanceBeam
        data={[
          { label: "A", value: 500 },
          { label: "B", value: 500 },
        ]}
        summary={false}
        width={70}
        height={28}
      />
    ),
  },
];

const CTX_ROWS = [
  {
    name: "Operating",
    meta: "+620",
    data: [
      { label: "Inflow", value: 620 },
      { label: "Outflow", value: 180 },
    ] as typeof FLOW,
  },
  {
    name: "Investing",
    meta: "−480",
    data: [
      { label: "Inflow", value: 120 },
      { label: "Outflow", value: 600 },
    ] as typeof FLOW,
  },
  {
    name: "Financing",
    meta: "+140",
    data: [
      { label: "Inflow", value: 200 },
      { label: "Outflow", value: 60 },
    ] as typeof FLOW,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Cash flow this month{" "}
        <span className="mc-inline">
          <BalanceBeam data={FLOW} label="none" height={16} summary={false} />
        </span>{" "}
        — inflow outweighs outflow, beam tilts right.
      </p>
    ),
    code: '<p>\n  Cash flow this month{" "}\n  <span className="mc-inline">\n    <BalanceBeam data={[{ label: "A", value: 620 }, { label: "B", value: 480 }]} summary={false} />\n  </span>{" "}\n  — inflow outweighs outflow, beam tilts right.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <BalanceBeam data={row.data} label="none" height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: '<td>\n  <BalanceBeam data={[{ label: "A", value: 620 }, { label: "B", value: 480 }]} />\n</td>',
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Cash flow</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">+140</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">net inflow</span>
          </div>
        </div>
        <BalanceBeam data={CTX_ROWS[0]!.data} label="values" height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">+140</span>\n  <span className="unit">net inflow</span>\n  <BalanceBeam data={[{ label: "A", value: 620 }, { label: "B", value: 480 }]} />\n</div>',
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
            <BalanceBeam data={row.data} label="none" height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Operating <BalanceBeam data={[{ label: "A", value: 620 }, { label: "B", value: 480 }]} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const a = props.data[0] ?? 620;
  const b = props.data[1] ?? 480;
  return (
    <BalanceBeam
      data={[
        { label: "A", value: Math.abs(a) },
        { label: "B", value: Math.abs(b) },
      ]}
      summary={false}
      width={props.width ?? 48}
      height={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<BalanceBeam data={[{ label: "A", value: 620 }, { label: "B", value: 480 }]} />`;
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
