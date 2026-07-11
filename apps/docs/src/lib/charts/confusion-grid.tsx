import { ConfusionGrid } from "@microcharts/react/confusion-grid";
import { ConfusionGrid as ConfusionGridInteractive } from "@microcharts/react/confusion-grid/interactive";
import { InteractiveDemo } from "./confusion-grid.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
export const CATDOG = {
  labels: ["cat", "dog"],
  counts: [
    [88, 12],
    [10, 59],
  ],
};
export const THREE = {
  labels: ["A", "B", "C"],
  counts: [
    [70, 8, 2],
    [6, 62, 12],
    [3, 9, 58],
  ],
};

export const entry: ChartEntry = {
  name: "ConfusionGrid",
  slug: "confusion-grid",
  status: "stable",
  collection: "frontier",
  tagline: "Where the errors go — the one thing accuracy-as-a-number hides.",
  staticImport: `${PKG}/confusion-grid`,
  interactiveImport: `${PKG}/confusion-grid/interactive`,
  dataShape: "{ labels: string[], counts: number[][] } (k×k, k ∈ [2,4])",
  encoding: { channel: "row-normalized cell ink; diagonal accented by shape", precision: "medium" },
  nodeBudget: "k² + k + 2k labels",
  bestFor: ["classifier evaluation dashboards", "any paired-classification agreement"],
  avoidFor: ["a single accuracy number (Delta)", "k > 4 classes (full heatmap)"],
  props: [
    {
      name: "data",
      type: "{ labels, counts }",
      required: true,
      description: "k×k matrix; rows actual, columns predicted.",
    },
    {
      name: "normalize",
      type: '"row" | "none"',
      required: false,
      description: "Row = recall view (default).",
    },
    {
      name: "accent",
      type: '"diagonal" | "errors"',
      required: false,
      description: "Agreement or the worst confusion.",
    },
    {
      name: "label",
      type: '"accuracy" | "none"',
      required: false,
      description: "Overall accuracy in the gutter (opt-in).",
    },
  ],
  demo: [87, 12],
  example: {
    title: "Classifier",
    code: `import { ConfusionGrid } from "${PKG}/confusion-grid";\n\n<ConfusionGrid data={counts} title="Classifier" />`,
  },
  sampleData: [
    {
      name: "counts",
      code: `const counts = {
  labels: ["cat", "dog"],
  counts: [
    [88, 12],
    [10, 59],
  ],
};`,
    },
  ],
};

export function Preview() {
  return <ConfusionGrid data={CATDOG} summary={false} size={48} />;
}

export const showcase = {
  hint: "errors",
  Node: () => <ConfusionGrid data={THREE} title="Classifier" size={52} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "normalize",
      label: "normalize",
      options: ["row", "none"],
      init: "row",
    },
    {
      kind: "segmented",
      key: "accent",
      label: "accent",
      options: ["diagonal", "errors"],
      init: "diagonal",
    },
    { kind: "toggle", key: "label", label: "accuracy", init: false },
    { kind: "toggle", key: "round", label: "round cells", init: false },
  ],
  render: (s) => (
    <ConfusionGrid
      data={THREE}
      normalize={s.normalize as "row" | "none"}
      accent={s.accent as "diagonal" | "errors"}
      label={s.label ? "accuracy" : "none"}
      shape={s.round ? "round" : "square"}
      summary={false}
      size={120}
    />
  ),
  code: (s) =>
    [
      "<ConfusionGrid",
      "  data={{ labels, counts }}",
      s.normalize !== "row" && `  normalize="${s.normalize}"`,
      s.accent !== "diagonal" && `  accent="${s.accent}"`,
      s.label === true && '  label="accuracy"',
      s.round === true && '  shape="round"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ConfusionGridInteractive
      data={THREE}
      normalize={s.normalize as "row" | "none"}
      accent={s.accent as "diagonal" | "errors"}
      label={s.label ? "accuracy" : "none"}
      shape={s.round ? "round" : "square"}
      summary={false}
      animate={ui.animate}
      size={120}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ConfusionGrid",
      "  data={{ labels, counts }}",
      s.normalize !== "row" && `  normalize="${s.normalize}"`,
      s.accent !== "diagonal" && `  accent="${s.accent}"`,
      s.label === true && '  label="accuracy"',
      s.round === true && '  shape="round"',
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or use the arrow keys across the grid — each cell announces actual vs predicted as a share of the actual class.",
};

export const recipes: Recipe[] = [
  {
    label: "KPI card",
    code: `<ConfusionGrid data={counts} label="accuracy" size={64} />`,
    node: <ConfusionGrid data={CATDOG} label="accuracy" summary={false} size={64} />,
  },
  {
    label: "worst-confusion accent",
    code: `<ConfusionGrid data={counts} accent="errors" />`,
    node: <ConfusionGrid data={THREE} accent="errors" summary={false} size={72} />,
  },
];

export function Mark() {
  return <ConfusionGrid data={CATDOG} summary={false} size={44} />;
}

export function markCode(): string {
  return `<ConfusionGrid data={{ labels, counts }} />`;
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
