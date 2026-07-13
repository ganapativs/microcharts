import { ConfusionGrid } from "@microcharts/react/confusion-grid";
import { ConfusionGrid as ConfusionGridInteractive } from "@microcharts/react/confusion-grid/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";
import { confusionMatrix } from "./contexts-helpers";

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
      ui.animate && " animate",
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

const CTX_ROWS = [
  { name: "cats", meta: "87%", data: confusionMatrix(0.87, ["cat", "other"]) },
  { name: "dogs", meta: "88%", data: confusionMatrix(0.88, ["dog", "other"]) },
  { name: "birds", meta: "91%", data: confusionMatrix(0.91, ["bir", "other"]) },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Classifier accuracy{" "}
        <span className="mc-inline">
          <ConfusionGrid data={CATDOG} summary={false} size={20} />
        </span>{" "}
        — 87% cats correct, 12% dogs misclassified.
      </p>
    ),
    code: "<p>\n  Classifier accuracy <ConfusionGrid data={{ labels, counts }} /> — 87% cats correct, 12% dogs misclassified.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <ConfusionGrid data={row.data} summary={false} size={22} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <ConfusionGrid data={{ labels, counts }} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Accuracy</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">87%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">cats correct</span>
          </div>
        </div>
        <ConfusionGrid data={CTX_ROWS[0]!.data} summary={false} size={48} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">87%</span>\n  <ConfusionGrid data={{ labels, counts }} />\n</div>',
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
            <ConfusionGrid data={row.data} summary={false} size={18} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  cats <ConfusionGrid data={{ labels, counts }} />\n</button>',
  },
};

export function Mark() {
  return <ConfusionGrid data={CATDOG} summary={false} size={44} />;
}

export function markCode(): string {
  return `<ConfusionGrid data={{ labels, counts }} />`;
}

export function PreviewLive() {
  return <ConfusionGridInteractive data={CATDOG} summary={false} size={48} animate />;
}

export default {
  entry,
  Preview,
  PreviewLive,
  showcase,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
