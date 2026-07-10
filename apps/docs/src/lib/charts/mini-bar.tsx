import { MiniBar } from "@microcharts/react/mini-bar";
import { InteractiveDemo } from "./mini-bar.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const MIX = [
  { label: "East", value: 940 },
  { label: "West", value: 410 },
  { label: "South", value: 620 },
  { label: "North", value: 120 },
];

export const entry: ChartEntry = {
  name: "MiniBar",
  slug: "mini-bar",
  status: "stable",
  collection: "core",
  tagline: "Which category is biggest, and by roughly how much.",
  staticImport: `${PKG}/mini-bar`,
  interactiveImport: `${PKG}/mini-bar/interactive`,
  dataShape: "{ label, value }[]",
  encoding: { channel: "bar length, zero-anchored", precision: "high" },
  nodeBudget: "1 per bar (≤ 8 documented)",
  bestFor: ["per-row category mix in tables", "small comparisons in cards"],
  avoidFor: ["> 8 categories (full bar chart)", "time series (SparkBar)"],
  props: [
    {
      name: "data",
      type: "{ label; value }[]",
      required: true,
      description: "Categories in meaningful order.",
    },
    {
      name: "sort",
      type: '"none" | "desc" | "asc"',
      required: false,
      description: "Ranking read vs positional read — data-facing, not styling.",
    },
    {
      name: "highlight",
      type: "number | string",
      required: false,
      description: "Index or label to emphasize.",
    },
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      required: false,
      description: "Rows for wider, shorter cells.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Engages pos/neg tokens on signed data.",
    },
  ],
  demo: MIX.map((d) => d.value),
  example: {
    title: "Regional mix",
    code: `import { MiniBar } from "${PKG}/mini-bar";

const regions = [
  { label: "East", value: 940 },
  { label: "West", value: 410 },
  { label: "South", value: 620 },
  { label: "North", value: 120 },
];

<MiniBar data={regions} title="Sales by region" />`,
  },
};

export function Preview() {
  return <MiniBar data={MIX} summary={false} width={100} height={32} />;
}

export const showcase = {
  hint: "categories",
  Node: () => (
    <MiniBar data={MIX} highlight="East" title="Sales by region" width={100} height={32} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "sort",
      label: "sort",
      options: ["none", "desc", "asc"],
      init: "none",
    },
    { kind: "toggle", key: "highlight", label: "highlight East", init: false },
    {
      kind: "segmented",
      key: "orientation",
      label: "orientation",
      options: ["vertical", "horizontal"],
      init: "vertical",
    },
  ],
  render: (s) => (
    <MiniBar
      data={MIX}
      sort={s.sort as "none" | "desc" | "asc"}
      highlight={(s.highlight as boolean) ? "East" : undefined}
      orientation={s.orientation as "horizontal" | "vertical"}
      summary={false}
      width={160}
      height={s.orientation === "horizontal" ? 96 : 52}
    />
  ),
  code: (s) =>
    [
      "<MiniBar",
      "  data={regions}",
      s.sort !== "none" && `  sort="${s.sort}"`,
      (s.highlight as boolean) && '  highlight="East"',
      s.orientation === "horizontal" && '  orientation="horizontal"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<MiniBar data={row.mix} width={50} height={16} />`,
    node: <MiniBar data={MIX} summary={false} width={50} height={16} />,
  },
  {
    label: "signed with polarity",
    code: `<MiniBar
  data={[
    { label: "Mon", value: 4 },
    { label: "Tue", value: -2 },
    { label: "Wed", value: 6 },
    { label: "Thu", value: -1 },
  ]}
  positive="up"
/>`,
    node: (
      <MiniBar
        data={[
          { label: "Mon", value: 4 },
          { label: "Tue", value: -2 },
          { label: "Wed", value: 6 },
          { label: "Thu", value: -1 },
        ]}
        positive="up"
        summary={false}
        width={80}
        height={28}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <MiniBar
      data={props.data.slice(0, 6).map((v, i) => ({ label: `c${i + 1}`, value: v }))}
      summary={false}
      width={props.width ?? 50}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<MiniBar data={mix} />`;
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
