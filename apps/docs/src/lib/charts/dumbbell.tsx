import { Dumbbell } from "@microcharts/react/dumbbell";
import { InteractiveDemo } from "./dumbbell.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const BANDS = [
  { label: "Paris", from: 52, to: 61 },
  { label: "Berlin", from: 48, to: 68 },
  { label: "Oslo", from: 66, to: 60 },
  { label: "Rome", from: 44, to: 50 },
];

export const entry: ChartEntry = {
  name: "Dumbbell",
  slug: "dumbbell",
  status: "stable",
  collection: "core",
  tagline: "Where each row started and ended — hollow to filled, no legend.",
  staticImport: `${PKG}/dumbbell`,
  interactiveImport: `${PKG}/dumbbell/interactive`,
  dataShape: "{ label?, from, to }[]",
  encoding: { channel: "two dot positions + connecting span", precision: "high" },
  nodeBudget: "≤ 3 per row (rows ≤ 5)",
  bestFor: ["salary bands", "before/after per row", "ranges in tables"],
  avoidFor: ["many rows (Slope for crossings)", "the path between (Sparkline)"],
  props: [
    {
      name: "data",
      type: "{ label?; from; to }[]",
      required: true,
      description: "Start/end pairs.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Direction valence for CHANGES; drop it for ranges (no valence).",
    },
    {
      name: "label",
      type: '"value" | "none"',
      required: false,
      description: "From/to values outside the dots (drop when the span is tight).",
    },
    { name: "highlight", type: "number | string", required: false, description: "Accent one row." },
  ],
  demo: [48, 68],
  example: {
    title: "Salary band move",
    code: `import { Dumbbell } from "${PKG}/dumbbell";\n\n<Dumbbell data={[{ from: 62000, to: 84000 }]} title="Band move" />`,
  },
};

export function Preview() {
  return <Dumbbell data={BANDS} summary={false} width={130} height={52} />;
}

export const showcase = {
  hint: "before → after",
  Node: () => <Dumbbell data={BANDS} title="Band moves" width={130} height={52} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "positive", label: "valence", init: false },
    { kind: "toggle", key: "values", label: "value labels", init: false },
    { kind: "toggle", key: "highlight", label: "highlight Berlin", init: false },
  ],
  render: (s) => (
    <Dumbbell
      data={BANDS}
      positive={(s.positive as boolean) ? "up" : undefined}
      label={(s.values as boolean) ? "value" : "none"}
      highlight={(s.highlight as boolean) ? "Berlin" : undefined}
      summary={false}
      width={240}
      height={96}
    />
  ),
  code: (s) =>
    [
      "<Dumbbell",
      "  data={bands}",
      (s.positive as boolean) && '  positive="up"',
      (s.values as boolean) && '  label="value"',
      (s.highlight as boolean) && '  highlight="Berlin"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<Dumbbell data={[row.band]} width={60} height={12} />`,
    node: <Dumbbell data={[{ from: 48, to: 68 }]} summary={false} width={60} height={12} />,
  },
  {
    label: "a range, not a change",
    code: `// no positive prop — a min→max range has no valence to color\n<Dumbbell data={[{ from: p5, to: p95 }]} />`,
    node: <Dumbbell data={[{ from: 12, to: 96 }]} summary={false} width={60} height={12} />,
  },
];

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <Dumbbell data={[{ from: 48, to: 68 }]} summary={false} width={60} height={12} />;
}

export function markCode(): string {
  return `<Dumbbell data={[{ from: 48, to: 68 }]} />`;
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
