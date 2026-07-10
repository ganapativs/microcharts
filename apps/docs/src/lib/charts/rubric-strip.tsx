import { RubricStrip } from "@microcharts/react/rubric-strip";
import { InteractiveDemo } from "./rubric-strip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

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
  tagline:
    "How a thing scored per criterion, with each criterion's weight visible — no fake total.",
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
      description: "Pass-threshold tick across all rows.",
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
    code: `import { RubricStrip } from "${PKG}/rubric-strip";\n\n<RubricStrip data={criteria} title="Model eval" />`,
  },
};

export function Preview() {
  return <RubricStrip data={RUBRIC} summary={false} width={120} height={30} />;
}

export const showcase = {
  hint: "scorecard",
  Node: () => <RubricStrip data={RUBRIC} target={0.7} title="Model eval" width={120} height={30} />,
};

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
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
