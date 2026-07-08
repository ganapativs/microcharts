import { HeatCell } from "@microcharts/react/heat-cell";
import { InteractiveDemo } from "./heat-cell.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const D = [0, 100] as const;

export const entry: ChartEntry = {
  name: "HeatCell",
  slug: "heat-cell",
  status: "stable",
  collection: "core",
  tagline: "One calibrated color step — the building block for host-owned grids.",
  staticImport: `${PKG}/heat-cell`,
  interactiveImport: `${PKG}/heat-cell/interactive`,
  dataShape: "number (+ shared domain)",
  encoding: {
    channel: "discrete color step",
    precision: "low — use MiniBar/DotPlot for precise comparison",
  },
  nodeBudget: "≤ 2 (cell + optional value label)",
  bestFor: ["table-cell matrices", "calendar-like grids you lay out yourself", "intensity chips"],
  avoidFor: ["precise value comparison", "per-cell auto-scaling (share one domain!)"],
  props: [
    { name: "value", type: "number", required: true, description: "The value to calibrate." },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Calibration scale — defaults to [0, 1]; every cell in a grid must share one.",
    },
    {
      name: "steps",
      type: "number",
      required: false,
      description: "Discrete perceptual steps (default 5, shared with ActivityGrid).",
    },
    {
      name: "shape",
      type: '"square" | "round" | "dot"',
      required: false,
      description: "Shared cell vocabulary.",
    },
    {
      name: "label",
      type: '"value" | "none"',
      required: false,
      description: "Centered number when the cell doubles as a chip.",
    },
  ],
  demo: [42],
  example: {
    title: "Load cell",
    code: `import { HeatCell } from "${PKG}/heat-cell";\n\n<HeatCell value={42} domain={[0, 100]} title="Load" />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-center gap-1.5">
      {[12, 35, 58, 79, 96].map((v) => (
        <HeatCell key={v} value={v} domain={D} summary={false} style={{ width: 16, height: 16 }} />
      ))}
    </span>
  );
}

export const showcase = {
  hint: "intensity",
  Node: () => <HeatCell value={72} domain={D} title="Load" style={{ width: 20, height: 20 }} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value", min: 0, max: 100, init: 42 },
    { kind: "range", key: "steps", label: "steps", min: 2, max: 9, init: 5 },
    {
      kind: "segmented",
      key: "shape",
      label: "shape",
      options: ["square", "round", "dot"],
      init: "square",
    },
    { kind: "toggle", key: "label", label: "value label", init: false },
  ],
  render: (s) => (
    <HeatCell
      value={s.value as number}
      domain={D}
      steps={s.steps as number}
      shape={s.shape as "square" | "round" | "dot"}
      label={(s.label as boolean) ? "value" : "none"}
      summary={false}
      style={{ width: 48, height: 48 }}
    />
  ),
  code: (s) =>
    [
      "<HeatCell",
      `  value={${s.value}}`,
      "  domain={[0, 100]}",
      s.steps !== 5 && `  steps={${s.steps}}`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      (s.label as boolean) && '  label="value"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "a shared-domain row",
    code: `// every cell calibrates against ONE domain — never per-cell auto-scale\n{[12, 40, 62, 88].map((v) => (\n  <HeatCell key={v} value={v} domain={[0, 100]} />\n))}`,
    node: (
      <span className="inline-flex items-center gap-1">
        {[12, 40, 62, 88].map((v) => (
          <HeatCell
            key={v}
            value={v}
            domain={D}
            summary={false}
            style={{ width: 14, height: 14 }}
          />
        ))}
      </span>
    ),
  },
  {
    label: "value chip",
    code: `// wider cells can carry their number\n<HeatCell value={8} domain={[0, 9]} label="value" style={{ width: 28, height: 28 }} />`,
    node: (
      <HeatCell
        value={8}
        domain={[0, 9]}
        label="value"
        summary={false}
        style={{ width: 28, height: 28 }}
      />
    ),
  },
];

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <HeatCell value={72} domain={D} summary={false} style={{ width: 12, height: 12 }} />;
}

export function markCode(): string {
  return `<HeatCell value={72} domain={[0, 100]} />`;
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
