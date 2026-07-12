import { CohortTriangle } from "@microcharts/react/cohort-triangle";
import { CohortTriangle as CohortTriangleInteractive } from "@microcharts/react/cohort-triangle/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

// Five monthly vintages, decaying then flattening — ragged because newer
// cohorts have been observed for fewer months. March leaks worst by month 1.
export const COHORTS = [
  { label: "Jan", values: [1, 0.62, 0.48, 0.41, 0.38, 0.37] },
  { label: "Feb", values: [1, 0.58, 0.44, 0.38, 0.35] },
  { label: "Mar", values: [1, 0.47, 0.36, 0.31] },
  { label: "Apr", values: [1, 0.55, 0.42] },
  { label: "May", values: [1, 0.52] },
];

export const entry: ChartEntry = {
  name: "CohortTriangle",
  slug: "cohort-triangle",
  status: "stable",
  collection: "decision",
  tagline: "Which vintage retains worst, compared at equal maturity.",
  staticImport: `${PKG}/cohort-triangle`,
  interactiveImport: `${PKG}/cohort-triangle/interactive`,
  dataShape: "{ label, values }[] — retention per age (ragged rows)",
  encoding: {
    channel: "color intensity (discrete levels) over an age × cohort grid",
    precision: "low — steer to a table when exact per-cell values matter",
  },
  nodeBudget: "1 per cell",
  bestFor: [
    "monthly/weekly cohorts side by side",
    "spotting which vintage decays worst",
    "equal-maturity retention in a KPI card",
  ],
  avoidFor: ["exact per-cell values", "a single cohort curve (RetentionCurve)"],
  props: [
    {
      name: "data",
      type: "{ label, values }[]",
      required: true,
      description: "One row per cohort; values[i] = retention at age i (0–1 or 0–100, ragged).",
    },
    {
      name: "labels",
      type: "boolean",
      required: false,
      description: "Cohort labels in a left gutter (default true; drops at tiny cell sizes).",
    },
    {
      name: "highlight",
      type: "string",
      required: false,
      description: "Ring the cohort with this label — the comparison focus.",
    },
    {
      name: "unit",
      type: "string",
      required: false,
      description: 'Age-column noun for the summary (default "period").',
    },
    {
      name: "cell",
      type: "number",
      required: false,
      description: "Cell edge length in viewBox units.",
    },
    {
      name: "title",
      type: "string",
      required: false,
      description: "Accessible name; joins the auto summary.",
    },
    {
      name: "summary",
      type: "string | false",
      required: false,
      description: "Override or disable the auto summary.",
    },
  ],
  demo: [100, 62, 48, 41, 38, 37],
  example: {
    title: "Monthly retention cohorts",
    code: `import { CohortTriangle } from "${PKG}/cohort-triangle";\n\n<CohortTriangle data={cohorts} unit="month" title="Monthly retention" />`,
  },
  sampleData: [
    {
      name: "cohorts",
      code: `// Five monthly vintages, decaying then flattening — ragged because newer
// cohorts have been observed for fewer months. March leaks worst by month 1.
const cohorts = [
  { label: "Jan", values: [1, 0.62, 0.48, 0.41, 0.38, 0.37] },
  { label: "Feb", values: [1, 0.58, 0.44, 0.38, 0.35] },
  { label: "Mar", values: [1, 0.47, 0.36, 0.31] },
  { label: "Apr", values: [1, 0.55, 0.42] },
  { label: "May", values: [1, 0.52] },
];`,
    },
  ],
};

export function Preview() {
  return <CohortTriangle data={COHORTS} cell={10} labels={false} summary={false} />;
}

export const showcase = {
  hint: "equal maturity",
  Node: () => <CohortTriangle data={COHORTS} cell={12} unit="month" title="Retention cohorts" />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "labels", label: "labels", init: true },
    {
      kind: "segmented",
      key: "highlight",
      label: "ring",
      options: ["none", "Mar", "May"],
      init: "none",
    },
    { kind: "segmented", key: "cell", label: "cell", options: ["9", "12", "15"], init: "12" },
  ],
  render: (s) => (
    <CohortTriangle
      data={COHORTS}
      labels={s.labels as boolean}
      highlight={s.highlight === "none" ? undefined : (s.highlight as string)}
      cell={Number(s.cell)}
      unit="month"
      title="Playground"
    />
  ),
  code: (s) =>
    [
      "<CohortTriangle",
      "  data={cohorts}",
      s.labels === false && "  labels={false}",
      s.highlight !== "none" && `  highlight="${s.highlight}"`,
      `  cell={${s.cell}}`,
      '  unit="month"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <CohortTriangleInteractive
      data={COHORTS}
      labels={s.labels as boolean}
      highlight={s.highlight === "none" ? undefined : (s.highlight as string)}
      cell={Number(s.cell)}
      unit="month"
      animate={ui.animate}
      title="Playground"
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CohortTriangle",
      "  data={cohorts}",
      s.labels === false && "  labels={false}",
      s.highlight !== "none" && `  highlight="${s.highlight}"`,
      `  cell={${s.cell}}`,
      '  unit="month"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover a cell, or focus and move in 2-D with the arrow keys — each cell announces its cohort, age, and retention.",
};

export const recipes: Recipe[] = [
  {
    label: "labelled grid",
    code: `<CohortTriangle data={cohorts} unit="month" />`,
    node: <CohortTriangle data={COHORTS} cell={12} unit="month" summary={false} />,
  },
  {
    label: "highlight a vintage",
    code: `// ring one cohort to anchor the equal-maturity comparison\n<CohortTriangle data={cohorts} highlight="Mar" />`,
    node: <CohortTriangle data={COHORTS} cell={12} highlight="Mar" summary={false} />,
  },
  {
    label: "dense (no labels)",
    code: `<CohortTriangle data={cohorts} labels={false} cell={8} />`,
    node: <CohortTriangle data={COHORTS} cell={8} labels={false} summary={false} />,
  },
];

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <CohortTriangle data={COHORTS} cell={7} labels={false} summary={false} />;
}

export function markCode(): string {
  return `<CohortTriangle data={cohorts} labels={false} cell={7} />`;
}

export function PreviewLive() {
  return (
    <CohortTriangleInteractive data={COHORTS} cell={10} labels={false} summary={false} animate />
  );
}

export default {
  entry,
  Preview,
  PreviewLive,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
