import { RubricStrip } from "@microcharts/react/rubric-strip";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const RUBRIC = [
  { label: "Correctness", score: 0.92, weight: 3 },
  { label: "Coverage", score: 0.78, weight: 2 },
  { label: "Clarity", score: 0.65, weight: 1 },
  { label: "Style", score: 0.41, weight: 1 },
];

export const entry: ChartEntry = {
  name: "RubricStrip",
  slug: "rubric-strip",
  status: "stable",
  collection: "frontier",
  tagline: "How a thing scored per criterion, with each criterion's weight visible, no fake total.",
  staticImport: `${PKG}/rubric-strip`,
  interactiveImport: `${PKG}/rubric-strip/interactive`,
  dataShape: "{ label, score, weight? }[]",
  encoding: { channel: "bar length = score, bar thickness = weight", precision: "high / medium" },
  nodeBudget: "≤ 2 per row, cap 8",
  bestFor: ["model / code-review scorecards", "weighted vendor comparison"],
  avoidFor: ["one criterion (Bullet)", "parts of a whole (SegmentedBar)"],
  props: [
    {
      name: "data",
      type: "{ label, score, weight? }[]",
      required: true,
      description: "Criteria; weights default equal.",
    },
    {
      name: "target",
      type: "number",
      required: false,
      description: "Pass target — one tick across all rows.",
    },
    {
      name: "labels",
      type: "boolean",
      required: false,
      description: "Criterion names in the left gutter.",
    },
  ],
  demo: [92, 78, 65, 41],
  example: {
    title: "Model eval",
    code: `import { RubricStrip } from "${PKG}/rubric-strip";

<RubricStrip
  data={[
    { label: "Correctness", score: 0.92, weight: 3 },
    { label: "Coverage", score: 0.78, weight: 2 },
    { label: "Clarity", score: 0.65, weight: 1 },
    { label: "Style", score: 0.41, weight: 1 },
  ]}
  title="Model eval"
/>`,
  },
};

export function Preview() {
  return <RubricStrip data={RUBRIC} summary={false} width={120} height={30} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "labels", label: "labels", init: true },
    { kind: "range", key: "target", label: "target ×100", min: 0, max: 100, init: 70 },
    { kind: "toggle", key: "showTarget", label: "show target", init: true },
  ],
  render: (s) => (
    <RubricStrip
      data={RUBRIC}
      labels={s.labels as boolean}
      target={s.showTarget ? (s.target as number) / 100 : undefined}
      summary={false}
      width={260}
      height={40}
    />
  ),
  code: (s) =>
    [
      "<RubricStrip",
      "  data={criteria}",
      s.labels === false && "  labels={false}",
      s.showTarget && `  target={${((s.target as number) / 100).toFixed(2)}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or use ↑/↓ across the criteria — each announces its score and weight share.",
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<RubricStrip data={row.criteria} labels={false} width={60} height={24} />`,
    node: <RubricStrip data={RUBRIC} labels={false} summary={false} width={60} height={24} />,
  },
  {
    label: "with target",
    code: `<RubricStrip data={criteria} target={0.7} />`,
    node: <RubricStrip data={RUBRIC} target={0.7} summary={false} width={200} height={32} />,
  },
];

const CTX_ROWS = [
  {
    name: "GPT-4",
    meta: "78%",
    data: [
      { label: "Correctness", score: 0.85, weight: 3 },
      { label: "Coverage", score: 0.72, weight: 2 },
      { label: "Clarity", score: 0.68, weight: 1 },
      { label: "Style", score: 0.55, weight: 1 },
    ] as typeof RUBRIC,
  },
  {
    name: "Claude",
    meta: "82%",
    data: [
      { label: "Correctness", score: 0.9, weight: 3 },
      { label: "Coverage", score: 0.8, weight: 2 },
      { label: "Clarity", score: 0.78, weight: 1 },
      { label: "Style", score: 0.72, weight: 1 },
    ] as typeof RUBRIC,
  },
  {
    name: "Gemini",
    meta: "74%",
    data: [
      { label: "Correctness", score: 0.78, weight: 3 },
      { label: "Coverage", score: 0.7, weight: 2 },
      { label: "Clarity", score: 0.65, weight: 1 },
      { label: "Style", score: 0.58, weight: 1 },
    ] as typeof RUBRIC,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Model eval scorecard{" "}
        <span className="mc-inline">
          <RubricStrip data={RUBRIC} target={0.7} height={16} summary={false} />
        </span>{" "}
        — 78% weighted, accuracy weakest.
      </p>
    ),
    code: "<p>\n  Model eval scorecard <RubricStrip data={criteria} /> — 78% weighted, accuracy weakest.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <RubricStrip data={row.data} target={0.7} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <RubricStrip data={criteria} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Overall</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">78%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">weighted score</span>
          </div>
        </div>
        <RubricStrip data={CTX_ROWS[0]!.data} target={0.7} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">78%</span>\n  <span className="unit">weighted score</span>\n  <RubricStrip data={criteria} />\n</div>',
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
            <RubricStrip data={row.data} target={0.7} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  GPT-4 <RubricStrip data={criteria} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = props.data.slice(0, 4).map((v, i) => ({
    label: `c${i + 1}`,
    score: Math.min(1, Math.abs(v) / 100 || 0.5),
    weight: 4 - i,
  }));
  return (
    <RubricStrip
      data={data.length ? data : RUBRIC}
      labels={false}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 24}
    />
  );
}

export function markCode(): string {
  return `<RubricStrip data={criteria} />`;
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
