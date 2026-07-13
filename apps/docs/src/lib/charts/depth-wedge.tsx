import { DepthWedge } from "@microcharts/react/depth-wedge";
import { DepthWedge as DepthWedgeInteractive } from "@microcharts/react/depth-wedge/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const BOOK = {
  demand: [
    { level: 99.75, amount: 420 },
    { level: 99.5, amount: 360 },
    { level: 99.25, amount: 280 },
    { level: 99, amount: 200 },
    { level: 98.5, amount: 120 },
  ],
  supply: [
    { level: 100.25, amount: 300 },
    { level: 100.5, amount: 240 },
    { level: 100.75, amount: 160 },
    { level: 101, amount: 90 },
  ],
};

export const entry: ChartEntry = {
  name: "DepthWedge",
  slug: "depth-wedge",
  status: "stable",
  collection: "frontier",
  tagline:
    "How much pressure is stacked on each side of the current level, and how wide the gap is.",
  staticImport: `${PKG}/depth-wedge`,
  interactiveImport: `${PKG}/depth-wedge/interactive`,
  dataShape: "{ demand: { level, amount }[], supply: { level, amount }[] }",
  encoding: { channel: "area (cumulative step-wedges)", precision: "medium" },
  nodeBudget: "≤ 4",
  bestFor: ["order-book depth / liquidity", "supply vs demand posture"],
  avoidFor: ["a time series (Sparkline)", "a single ratio (Delta)"],
  props: [
    {
      name: "data",
      type: "{ demand, supply }",
      required: true,
      description: "Level/amount rows per side.",
    },
    {
      name: "levels",
      type: "number",
      required: false,
      description: "± level distance from mid to include.",
    },
    {
      name: "normalize",
      type: "boolean",
      required: false,
      description: "Plot cumulative shares per side.",
    },
    {
      name: "label",
      type: '"spread" | "none"',
      required: false,
      description: "The gap is the headline number.",
    },
  ],
  demo: [18],
  example: {
    title: "Order book",
    code: `import { DepthWedge } from "${PKG}/depth-wedge";\n\n<DepthWedge data={{ demand, supply }} title="Order book" />`,
  },
  sampleData: [
    {
      name: "demand",
      code: `const demand = [
  { level: 99.75, amount: 420 },
  { level: 99.5, amount: 360 },
  { level: 99.25, amount: 280 },
  { level: 99, amount: 200 },
  { level: 98.5, amount: 120 },
];`,
    },
    {
      name: "supply",
      code: `const supply = [
  { level: 100.25, amount: 300 },
  { level: 100.5, amount: 240 },
  { level: 100.75, amount: 160 },
  { level: 101, amount: 90 },
];`,
    },
  ],
};

export function Preview() {
  return <DepthWedge data={BOOK} summary={false} width={130} height={24} />;
}

export const showcase = {
  hint: "depth",
  Node: () => <DepthWedge data={BOOK} title="Order book" width={130} height={24} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "normalize", label: "normalize", init: false },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["spread", "none"],
      init: "spread",
    },
    { kind: "range", key: "levels", label: "levels ±", min: 1, max: 4, step: 0.5, init: 2 },
  ],
  render: (s) => (
    <DepthWedge
      data={BOOK}
      normalize={s.normalize as boolean}
      label={s.label as "spread" | "none"}
      levels={s.levels as number}
      summary={false}
      width={320}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<DepthWedge",
      "  data={{ demand, supply }}",
      s.normalize === true && "  normalize",
      s.label !== "spread" && `  label="${s.label}"`,
      s.levels !== 2 && `  levels={${s.levels}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <DepthWedgeInteractive
      data={BOOK}
      normalize={s.normalize as boolean}
      label={s.label as "spread" | "none"}
      levels={s.levels as number}
      animate={ui.animate}
      summary={false}
      width={320}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<DepthWedge",
      "  data={{ demand, supply }}",
      s.normalize === true && "  normalize",
      s.label !== "spread" && `  label="${s.label}"`,
      s.levels !== 2 && `  levels={${s.levels}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or use ←/→ to walk the levels — each announces the cumulative depth on its side of the spread.",
};

export const recipes: Recipe[] = [
  {
    label: "pair cell",
    code: `<DepthWedge data={{ demand, supply }} label="none" width={60} height={16} />`,
    node: <DepthWedge data={BOOK} label="none" summary={false} width={60} height={16} />,
  },
  {
    label: "normalized",
    code: `<DepthWedge data={{ demand, supply }} normalize />`,
    node: <DepthWedge data={BOOK} normalize summary={false} width={220} height={26} />,
  },
];

const CTX_ROWS = [
  { name: "BTC", meta: "0.04" },
  { name: "ETH", meta: "0.06" },
  { name: "SOL", meta: "0.11" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Order book depth{" "}
        <span className="mc-inline">
          <DepthWedge data={BOOK} height={16} summary={false} />
        </span>{" "}
        — bid-side liquidity thicker below mid.
      </p>
    ),
    code: "<p>\n  Order book depth <DepthWedge data={{ demand, supply }} /> — bid-side liquidity thicker below mid.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <DepthWedge data={BOOK} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <DepthWedge data={{ demand, supply }} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Spread</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">0.04</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">bid/ask imbalance</span>
          </div>
        </div>
        <DepthWedge data={BOOK} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">0.04</span>\n  <span className="unit">bid/ask imbalance</span>\n  <DepthWedge data={{ demand, supply }} />\n</div>',
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
            <DepthWedge data={BOOK} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  BTC <DepthWedge data={{ demand, supply }} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <DepthWedge
      data={BOOK}
      label="none"
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<DepthWedge data={{ demand, supply }} />`;
}

export function PreviewLive() {
  return <DepthWedgeInteractive data={BOOK} summary={false} width={130} height={24} animate />;
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
