import { PictogramRow } from "@microcharts/react/pictogram-row";
import { InteractiveDemo } from "./pictogram-row.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "PictogramRow",
  slug: "pictogram-row",
  status: "stable",
  collection: "core",
  tagline: "Counts a human can verify by counting — ●●●○○.",
  staticImport: `${PKG}/pictogram-row`,
  interactiveImport: `${PKG}/pictogram-row/interactive`,
  dataShape: "value of total (units)",
  encoding: { channel: "filled-unit count", precision: "high — it is the number" },
  nodeBudget: "1 per unit (total ≤ 20 documented)",
  bestFor: ["seats and slots in a sentence", "ratings", "capacity rows"],
  avoidFor: ["> 20 units (Progress)", "continuous ratios (Progress)"],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "Filled units (may be fractional).",
    },
    { name: "total", type: "number", required: true, description: "Unit count." },
    {
      name: "shape",
      type: '"dot" | "square"',
      required: false,
      description: "Squares pack tighter in table cells.",
    },
    {
      name: "fractional",
      type: '"clip" | "round"',
      required: false,
      description: "Clip shows the true partial unit; round for seat-like units.",
    },
    {
      name: "renderPoint",
      type: "(unit) => ReactNode",
      required: false,
      description: "Custom unit glyph (star ratings) — the one sanctioned customization.",
    },
  ],
  demo: [5],
  example: {
    title: "Committee seats",
    code: `import { PictogramRow } from "${PKG}/pictogram-row";\n\n<PictogramRow value={5} total={8} title="Committee seats held" />`,
  },
};

export function Preview() {
  return <PictogramRow value={5} total={8} summary={false} style={{ width: 110, height: 16 }} />;
}

export const showcase = {
  hint: "count",
  Node: () => (
    <PictogramRow value={6.5} total={8} title="Capacity used" style={{ width: 110, height: 16 }} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value", min: 0, max: 8, step: 0.5, init: 5 },
    { kind: "range", key: "total", label: "total", min: 2, max: 12, init: 8 },
    { kind: "segmented", key: "shape", label: "shape", options: ["dot", "square"], init: "dot" },
    {
      kind: "segmented",
      key: "fractional",
      label: "fractional",
      options: ["clip", "round"],
      init: "clip",
    },
  ],
  render: (s) => (
    <PictogramRow
      value={s.value as number}
      total={s.total as number}
      shape={s.shape as "dot" | "square"}
      fractional={s.fractional as "clip" | "round"}
      summary={false}
      style={{ width: 240, height: 28 }}
    />
  ),
  code: (s) =>
    [
      "<PictogramRow",
      `  value={${s.value}}`,
      `  total={${s.total}}`,
      s.shape !== "dot" && `  shape="${s.shape}"`,
      s.fractional !== "clip" && `  fractional="${s.fractional}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "inline in a sentence",
    code: `holds <PictogramRow value={5} total={8}\n  style={{ width: "4.5em", height: "0.8em" }} /> of the seats`,
    node: (
      <span>
        holds{" "}
        <PictogramRow
          value={5}
          total={8}
          summary={false}
          style={{ width: "4.5em", height: "0.8em" }}
        />{" "}
        of the seats
      </span>
    ),
  },
  {
    label: "star rating via renderPoint",
    code: `<PictogramRow value={3.5} total={5}\n  renderPoint={(u) => <path key={u.index} d={starPath(u)} … />} />`,
    node: <PictogramRow value={3.5} total={5} summary={false} style={{ width: 90, height: 16 }} />,
  },
];

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <PictogramRow value={3} total={5} summary={false} style={{ width: 56, height: 12 }} />;
}

export function markCode(): string {
  return `<PictogramRow value={3} total={5} />`;
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
