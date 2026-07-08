import { Slope } from "@microcharts/react/slope";
import { InteractiveDemo } from "./slope.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const RANKS = [
  { label: "East", from: 40, to: 47 },
  { label: "West", from: 55, to: 41 },
  { label: "South", from: 30, to: 33 },
  { label: "North", from: 50, to: 44 },
  { label: "Mid", from: 20, to: 35 },
];

export const entry: ChartEntry = {
  name: "Slope",
  slug: "slope",
  status: "stable",
  collection: "core",
  tagline: "Who rose and who fell between two moments — crossings read instantly.",
  staticImport: `${PKG}/slope`,
  interactiveImport: `${PKG}/slope/interactive`,
  dataShape: "{ label, from, to }[]",
  encoding: { channel: "line slope between two aligned columns", precision: "medium-high" },
  nodeBudget: "≤ 3 per category (≤ 7)",
  bestFor: ["before/after experiments", "rank shuffles", "two-moment comparisons"],
  avoidFor: ["the path between (Sparkline)", "> 7 categories"],
  props: [
    {
      name: "data",
      type: "{ label; from; to }[]",
      required: true,
      description: "Two aligned moments per category.",
    },
    {
      name: "label",
      type: '"none" | "value" | "label" | "both"',
      required: false,
      description: "End labels; dropped deterministically when rows collide.",
    },
    {
      name: "highlight",
      type: "number | string",
      required: false,
      description: "The one-vs-field editorial read.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Direction valence; unset = neutral ink.",
    },
  ],
  demo: [40, 47],
  example: {
    title: "Before vs after",
    code: `import { Slope } from "${PKG}/slope";\n\n<Slope data={cohorts} title="Before vs after" />`,
  },
};

export function Preview() {
  return <Slope data={RANKS} summary={false} width={90} height={70} />;
}

export const showcase = {
  hint: "two moments",
  Node: () => <Slope data={RANKS} title="Before vs after" width={90} height={70} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["none", "value", "label", "both"],
      init: "none",
    },
    { kind: "toggle", key: "positive", label: "valence", init: false },
    { kind: "toggle", key: "highlight", label: "highlight West", init: false },
  ],
  render: (s) => (
    <Slope
      data={RANKS}
      label={s.label as "none" | "value" | "label" | "both"}
      positive={(s.positive as boolean) ? "up" : undefined}
      highlight={(s.highlight as boolean) ? "West" : undefined}
      summary={false}
      width={200}
      height={130}
    />
  ),
  code: (s) =>
    [
      "<Slope",
      "  data={cohorts}",
      s.label !== "none" && `  label="${s.label}"`,
      (s.positive as boolean) && '  positive="up"',
      (s.highlight as boolean) && '  highlight="West"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "KPI before/after",
    code: `<Slope data={cohorts} label="both"\n  width={140} height={96} />`,
    node: <Slope data={RANKS} label="both" summary={false} width={140} height={96} />,
  },
  {
    label: "one vs the field",
    code: `<Slope data={cohorts} highlight="West" />`,
    node: <Slope data={RANKS} highlight="West" summary={false} width={90} height={60} />,
  },
];

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <Slope data={RANKS.slice(0, 3)} summary={false} width={40} height={26} />;
}

export function markCode(): string {
  return `<Slope data={cohorts} />`;
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
