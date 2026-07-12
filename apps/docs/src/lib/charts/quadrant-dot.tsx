import { QuadrantDot } from "@microcharts/react/quadrant-dot";
import { QuadrantDot as QuadrantDotInteractive } from "@microcharts/react/quadrant-dot/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a prioritization backlog — effort (x) vs impact (y)
export const FOCAL = { x: 3, y: 9 };
export const FIELD = [
  { x: 2, y: 8 },
  { x: 8, y: 9 },
  { x: 3, y: 7 },
  { x: 9, y: 2 },
  { x: 7, y: 3 },
  { x: 1, y: 1 },
  { x: 5, y: 6 },
  { x: 6, y: 8 },
  { x: 4, y: 3 },
  { x: 8, y: 5 },
  { x: 2, y: 4 },
  { x: 7, y: 7 },
  { x: 3, y: 2 },
  { x: 6, y: 1 },
];
const AXES = {
  xLabel: "effort",
  yLabel: "impact",
  xDomain: [0, 10] as const,
  domain: [0, 10] as const,
};

export const entry: ChartEntry = {
  name: "QuadrantDot",
  slug: "quadrant-dot",
  status: "stable",
  collection: "decision",
  tagline: "Where does it sit in the 2×2?",
  staticImport: `${PKG}/quadrant-dot`,
  interactiveImport: `${PKG}/quadrant-dot/interactive`,
  dataShape: "{ x: number; y: number } + field?: { x; y }[]",
  encoding: { channel: "2-D position vs a quadrant split", precision: "medium" },
  nodeBudget: "≤ 5 + 1 per ghost (cap 30)",
  bestFor: [
    "a table cell per initiative — the classic prioritization 2×2",
    "an effort vs impact read in a KPI card",
    "any 'which quadrant, against the field' decision",
  ],
  avoidFor: ["a full scatter plot (MicroScatter)", "a single ranked list (MiniBar)"],
  props: [
    {
      name: "data",
      type: "{ x; y }",
      required: true,
      description: "The focal item's 2-D position.",
    },
    {
      name: "field",
      type: "{ x; y }[]",
      required: false,
      description: "The peer set — omit for a lone glyph.",
    },
    {
      name: "split",
      type: "[number, number]",
      required: false,
      description: "The quadrant boundary (default domain midpoints) — never hidden.",
    },
    {
      name: "quadrants",
      type: "[TL, TR, BL, BR]",
      required: false,
      description: "Names in reading order — summaries only, never rendered.",
    },
    {
      name: "xLabel / yLabel",
      type: "string",
      required: false,
      description: "Axis nouns for the summary — pass them, the axes are unlabeled at glyph size.",
    },
  ],
  demo: FIELD.map((p) => p.y - p.x),
  example: {
    title: "Effort vs impact",
    code: `import { QuadrantDot } from "${PKG}/quadrant-dot";\n\n<QuadrantDot data={item} field={backlog} xLabel="effort" yLabel="impact" title="Effort vs impact" />`,
  },
  sampleData: [
    {
      name: "item",
      code: `// a prioritization backlog — effort (x) vs impact (y)
const item = { x: 3, y: 9 };`,
    },
    {
      name: "backlog",
      code: `const backlog = [
  { x: 2, y: 8 },
  { x: 8, y: 9 },
  { x: 3, y: 7 },
  { x: 9, y: 2 },
  { x: 7, y: 3 },
  { x: 1, y: 1 },
  { x: 5, y: 6 },
  { x: 6, y: 8 },
  { x: 4, y: 3 },
  { x: 8, y: 5 },
  { x: 2, y: 4 },
  { x: 7, y: 7 },
  { x: 3, y: 2 },
  { x: 6, y: 1 },
];`,
    },
  ],
};

export function Preview() {
  return (
    <QuadrantDot data={FOCAL} field={FIELD} {...AXES} summary={false} width={48} height={48} />
  );
}

export const showcase = {
  hint: "the focal, against the field",
  Node: () => (
    <QuadrantDot
      data={FOCAL}
      field={FIELD}
      {...AXES}
      title="Effort vs impact"
      width={72}
      height={72}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "splitX", label: "split x", min: 2, max: 8, step: 1, init: 5 },
    { kind: "range", key: "splitY", label: "split y", min: 2, max: 8, step: 1, init: 5 },
    { kind: "toggle", key: "region", label: "tint", init: true },
    { kind: "toggle", key: "named", label: "named quadrants", init: false },
  ],
  render: (s) => (
    <QuadrantDot
      data={FOCAL}
      field={FIELD}
      {...AXES}
      split={[s.splitX as number, s.splitY as number]}
      region={s.region as boolean}
      quadrants={s.named ? ["quick win", "big bet", "skip", "time sink"] : undefined}
      title="Effort vs impact"
      summary={false}
      width={120}
      height={120}
    />
  ),
  code: (s) =>
    [
      "<QuadrantDot",
      "  data={item}",
      "  field={backlog}",
      `  split={[${s.splitX}, ${s.splitY}]}`,
      s.region === false && "  region={false}",
      s.named && `  quadrants={["quick win", "big bet", "skip", "time sink"]}`,
      '  xLabel="effort" yLabel="impact"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <QuadrantDotInteractive
      data={FOCAL}
      field={FIELD}
      {...AXES}
      split={[s.splitX as number, s.splitY as number]}
      region={s.region as boolean}
      quadrants={s.named ? ["quick win", "big bet", "skip", "time sink"] : undefined}
      title="Effort vs impact"
      summary={false}
      animate={ui.animate}
      width={120}
      height={120}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<QuadrantDot",
      "  data={item}",
      "  field={backlog}",
      `  split={[${s.splitX}, ${s.splitY}]}`,
      s.region === false && "  region={false}",
      s.named && `  quadrants={["quick win", "big bet", "skip", "time sink"]}`,
      '  xLabel="effort" yLabel="impact"',
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the peers — each announces its coords and quadrant, nearest-first from the focal dot.",
};

export const recipes: Recipe[] = [
  {
    label: "lone glyph (no field)",
    code: `<QuadrantDot data={item} xLabel="effort" yLabel="impact" />`,
    node: <QuadrantDot data={FOCAL} {...AXES} summary={false} width={64} height={64} />,
  },
  {
    label: "named quadrants",
    code: `<QuadrantDot data={item} field={backlog} quadrants={["quick win", "big bet", "skip", "time sink"]} />`,
    node: (
      <QuadrantDot
        data={FOCAL}
        field={FIELD}
        {...AXES}
        quadrants={["quick win", "big bet", "skip", "time sink"]}
        summary={false}
        width={72}
        height={72}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const field = props.data
    .slice(0, 8)
    .map((v, i) => ({ x: (i * 3) % 10, y: (Math.abs(v) + i) % 10 }));
  return (
    <QuadrantDot
      data={{ x: 3, y: 8 }}
      field={field}
      xDomain={[0, 10]}
      domain={[0, 10]}
      summary={false}
      width={props.width ?? 40}
      height={props.height ?? 40}
    />
  );
}

export function markCode(): string {
  return `<QuadrantDot data={item} field={backlog} />`;
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
