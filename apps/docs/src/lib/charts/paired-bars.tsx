import { PairedBars } from "@microcharts/react/paired-bars";
import { InteractiveDemo } from "./paired-bars.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const BUDGET = [
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
  tagline: "Actual vs expected, category by category — one shared scale.",
  staticImport: `${PKG}/paired-bars`,
  interactiveImport: `${PKG}/paired-bars/interactive`,
  dataShape: "{ label, value, ref }[]",
  encoding: { channel: "adjacent bar lengths, zero-anchored", precision: "high" },
  nodeBudget: "2 per pair (pairs ≤ 5)",
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
  ],
  demo: BUDGET.map((d) => d.value),
  example: {
    title: "Budget vs actual",
    code: `import { PairedBars } from "${PKG}/paired-bars";\n\n<PairedBars data={regions} title="Actual vs plan" />`,
  },
};

export function Preview() {
  return <PairedBars data={BUDGET} summary={false} style={{ width: 120, height: 40 }} />;
}

export const showcase = {
  hint: "vs reference",
  Node: () => (
    <PairedBars data={BUDGET} title="Actual vs plan" style={{ width: 120, height: 40 }} />
  ),
};

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
  ],
  render: (s) => (
    <PairedBars
      data={BUDGET}
      mode={s.mode as "grouped" | "overlay"}
      positive={(s.positive as boolean) ? "up" : undefined}
      orientation={s.orientation as "horizontal" | "vertical"}
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
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<PairedBars data={row.mix} style={{ width: 60, height: 20 }} />`,
    node: <PairedBars data={BUDGET} summary={false} style={{ width: 60, height: 20 }} />,
  },
  {
    label: "overlay for tight cells",
    code: `// ghost = the reference, never the value\n<PairedBars data={row.mix} mode="overlay" />`,
    node: (
      <PairedBars data={BUDGET} mode="overlay" summary={false} style={{ width: 60, height: 20 }} />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <PairedBars
      data={props.data.slice(0, 4).map((v, i) => ({ label: `c${i + 1}`, value: v, ref: v * 1.15 }))}
      summary={false}
      style={{ width: props.width ?? 60, height: props.height ?? 20 }}
    />
  );
}

export function markCode(): string {
  return `<PairedBars data={pairs} />`;
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
