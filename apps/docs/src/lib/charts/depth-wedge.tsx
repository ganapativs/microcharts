import { DepthWedge } from "@microcharts/react/depth-wedge";
import { DepthWedge as DepthWedgeInteractive } from "@microcharts/react/depth-wedge/interactive";
import { InteractiveDemo } from "./depth-wedge.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

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
    code: `import { DepthWedge } from "${PKG}/depth-wedge";

const demand = [
  { level: 99.75, amount: 420 },
  { level: 99.5, amount: 360 },
  { level: 99.25, amount: 280 },
  { level: 99, amount: 200 },
  { level: 98.5, amount: 120 },
];
const supply = [
  { level: 100.25, amount: 300 },
  { level: 100.5, amount: 240 },
  { level: 100.75, amount: 160 },
  { level: 101, amount: 90 },
];

<DepthWedge data={{ demand, supply }} title="Order book" />`,
  },
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
      ui.animate && "  animate",
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
    code: `<DepthWedge data={book} label="none" width={60} height={16} />`,
    node: <DepthWedge data={BOOK} label="none" summary={false} width={60} height={16} />,
  },
  {
    label: "normalized",
    code: `<DepthWedge data={book} normalize />`,
    node: <DepthWedge data={BOOK} normalize summary={false} width={220} height={26} />,
  },
];

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

export default {
  entry,
  Preview,
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
