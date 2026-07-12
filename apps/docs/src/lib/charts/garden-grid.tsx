import { GardenGrid } from "@microcharts/react/garden-grid";
import { GardenGrid as GardenGridInteractive } from "@microcharts/react/garden-grid/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// 12 weeks of activity, some quiet
const WEEKS = [12, 20, 8, 0, 15, 28, 34, 5, 0, 22, 18, 9, 3, 0, 24, 30, 11, 6, 19, 0, 26];

export const entry: ChartEntry = {
  name: "GardenGrid",
  slug: "garden-grid",
  status: "stable",
  collection: "expressive",
  tagline: "The rhythm of activity over time — legible in grayscale and print.",
  staticImport: `${PKG}/garden-grid`,
  interactiveImport: `${PKG}/garden-grid/interactive`,
  dataShape: "(number | null)[]",
  encoding: { channel: "dot area, quantized to 5 ordinal steps", precision: "medium" },
  nodeBudget: "1 per cell (cap 400)",
  bestFor: [
    "a contribution or activity rhythm you print or read in grayscale",
    "a per-repo or per-team activity strip",
    "any calendar-shaped intensity where color isn't available",
  ],
  avoidFor: ["exact per-cell values (ActivityGrid + hover / HeatStrip)", "trends (Sparkline)"],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "Binned values; null = missing.",
    },
    {
      name: "rows",
      type: "number",
      required: false,
      description: "Grid rows (default 7); 1 = strip.",
    },
    {
      name: "steps",
      type: "3 | 5",
      required: false,
      description: "Radius quantization steps (default 5).",
    },
    {
      name: "empty",
      type: '"outline" | "blank"',
      required: false,
      description: "How zero cells render (default outline).",
    },
  ],
  demo: WEEKS,
  example: {
    title: "Activity",
    code: `import { GardenGrid } from "${PKG}/garden-grid";\n\n<GardenGrid data={weeks} title="Activity" unit="weeks" />`,
  },
  sampleData: [
    {
      name: "weeks",
      code: `// 12 weeks of activity, some quiet
const weeks = [12, 20, 8, 0, 15, 28, 34, 5, 0, 22, 18, 9, 3, 0, 24, 30, 11, 6, 19, 0, 26];`,
    },
  ],
};

export function Preview() {
  return <GardenGrid data={WEEKS} summary={false} cell={9} />;
}

export const showcase = {
  hint: "rhythm in grayscale",
  Node: () => <GardenGrid data={WEEKS} unit="weeks" title="Activity" cell={10} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "rows", label: "rows", min: 1, max: 7, step: 1, init: 7 },
    { kind: "segmented", key: "steps", label: "steps", options: ["5", "3"], init: "5" },
    {
      kind: "segmented",
      key: "empty",
      label: "empty",
      options: ["outline", "blank"],
      init: "outline",
    },
  ],
  data: WEEKS,
  render: (_s, data) => (
    <GardenGrid
      data={data}
      rows={_s.rows as number}
      steps={Number(_s.steps) as 3 | 5}
      empty={_s.empty as "outline" | "blank"}
      summary={false}
      cell={12}
    />
  ),
  code: (s) =>
    [
      "<GardenGrid",
      "  data={weeks}",
      s.rows !== 7 && `  rows={${s.rows}}`,
      s.steps !== "5" && `  steps={${s.steps}}`,
      s.empty !== "outline" && `  empty="${s.empty}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, data, ui) => (
    <GardenGridInteractive
      data={data}
      rows={s.rows as number}
      steps={Number(s.steps) as 3 | 5}
      empty={s.empty as "outline" | "blank"}
      summary={false}
      animate={ui.animate}
      cell={12}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<GardenGrid",
      "  data={weeks}",
      s.rows !== 7 && `  rows={${s.rows}}`,
      s.steps !== "5" && `  steps={${s.steps}}`,
      s.empty !== "outline" && `  empty="${s.empty}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover a dot, or focus the grid and walk it in 2-D with the arrow keys — each cell announces its ordinal step (1–5), not a false-precise value, since dot area reads to a step not a number.",
};

export const recipes: Recipe[] = [
  {
    label: "strip mode for a table cell",
    code: `const weeks = [12, 20, 8, 0, 15, 28, 34, 5, 0, 22, 18, 9];

<GardenGrid data={weeks} rows={1} />`,
    node: <GardenGrid data={WEEKS.slice(0, 12)} rows={1} summary={false} cell={9} />,
  },
  {
    label: "empty='blank' for sparse data",
    code: `const weeks = ${JSON.stringify(WEEKS)};

<GardenGrid data={weeks} empty="blank" />`,
    node: <GardenGrid data={WEEKS} empty="blank" summary={false} cell={9} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = props.data.length ? props.data : WEEKS;
  return <GardenGrid data={data} summary={false} cell={props.height ? props.height / 3 : 6} />;
}

export function markCode(): string {
  return `<GardenGrid data={weeks} />`;
}

export default {
  entry,
  Preview,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
