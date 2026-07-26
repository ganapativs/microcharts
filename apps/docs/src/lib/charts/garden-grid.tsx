import { GardenGrid } from "@microcharts/react/garden-grid";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// 12 weeks of activity, some quiet
export const WEEKS = [12, 20, 8, 0, 15, 28, 34, 5, 0, 22, 18, 9, 3, 0, 24, 30, 11, 6, 19, 0, 26];

export const entry: ChartEntry = {
  name: "GardenGrid",
  slug: "garden-grid",
  status: "stable",
  collection: "expressive",
  tagline: "The rhythm of activity over time: legible in grayscale and print.",
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
    {
      name: "unit",
      type: "string",
      required: false,
      description: 'Noun for the summary count (default "periods").',
    },
    {
      name: "cell",
      type: "number",
      required: false,
      description: "Cell edge length in viewBox units (default 10).",
    },
    {
      name: "gap",
      type: "number",
      required: false,
      description: "Gap between cells in viewBox units (default 2).",
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

const CTX_ROWS = [
  { name: "microcharts", meta: "34 peak", data: [12, 20, 8, 0, 15, 28, 34, 5, 0, 22, 18, 9] },
  { name: "docs", meta: "22 peak", data: [22, 18, 14, 10, 8, 6, 4, 2, 0, 0, 3, 5] },
  { name: "api", meta: "18 peak", data: [2, 0, 4, 0, 8, 18, 12, 0, 6, 0, 1, 0] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Contributions this quarter{" "}
        <span className="mc-inline">
          <GardenGrid
            data={WEEKS.slice(0, 12)}
            unit="weeks"
            rows={1}
            steps={3}
            cell={8}
            summary={false}
          />
        </span>{" "}
        — busy mid-month, quiet weeks 4 and 10.
      </p>
    ),
    code: '<p>\n  Contributions this quarter{" "}\n  <span className="mc-inline">\n    <GardenGrid data={weeks} rows={1} summary={false} />\n  </span>{" "}\n  — busy mid-month, quiet weeks 4 and 10.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <GardenGrid
                  data={row.data}
                  unit="weeks"
                  rows={1}
                  steps={3}
                  cell={8}
                  summary={false}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <GardenGrid data={weeks} rows={1} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Activity</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">34</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">peak week</span>
          </div>
        </div>
        <GardenGrid data={CTX_ROWS[0]!.data} unit="weeks" rows={3} cell={10} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">34</span>\n  <span className="unit">peak week</span>\n  <GardenGrid data={weeks} />\n</div>',
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
            <GardenGrid data={row.data} unit="weeks" rows={1} steps={3} cell={7} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  microcharts <GardenGrid data={weeks} rows={1} />\n</button>',
  },
  note: "Best at KPI/card scale — activity grids need room for cell area.",
};

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
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModuleStatic;
