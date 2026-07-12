import { CoverageStrip } from "@microcharts/react/coverage-strip";
import { CoverageStrip as CoverageStripInteractive } from "@microcharts/react/coverage-strip/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a live window with real gaps: null = no measurement, 0 = a measured zero.
// Cast to number[] for the shared playground contract; CoverageStrip accepts nulls.
const COVERAGE = [3, 4, null, 5, 0, null, null, 6, 8, 7, null, 9, 11, 10] as unknown as number[];

export const entry: ChartEntry = {
  name: "CoverageStrip",
  slug: "coverage-strip",
  status: "stable",
  collection: "decision",
  tagline: "Can I trust this data — where was nothing measured?",
  staticImport: `${PKG}/coverage-strip`,
  interactiveImport: `${PKG}/coverage-strip/interactive`,
  dataShape: "(number | null)[]",
  encoding: {
    channel: "presence/absence as cell fill on a time strip",
    precision: "high — binary presence per slot",
  },
  nodeBudget: "1 per cell (≤ 120 documented)",
  bestFor: ["data-quality cells beside a metric", "sensor uptime rows", "trailing-gap detection"],
  avoidFor: ["magnitude over time (HeatStrip)", "exact values (Sparkline)"],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "Time-ordered slots; null = no measurement, 0 = a measured zero.",
    },
    {
      name: "expected",
      type: "number",
      required: false,
      description: "Slots the window should contain — lets trailing missingness count.",
    },
    {
      name: "mode",
      type: '"binary" | "intensity"',
      required: false,
      description: "Presence only (default), or shade measured cells by value.",
    },
    {
      name: "label",
      type: '"percent" | "none"',
      required: false,
      description: "State the coverage number in a right gutter.",
    },
  ],
  demo: [3, 4, 5, 5, 6, 8, 7, 9, 11, 10],
  example: {
    title: "Sensor uptime",
    code: `import { CoverageStrip } from "${PKG}/coverage-strip";\n\n<CoverageStrip data={readings} expected={18} label="percent" title="Sensor uptime" />`,
  },
  sampleData: [
    {
      name: "readings",
      code: `// null = no measurement, 0 = a measured zero\nconst readings = [3, 4, null, 5, 0, null, null, 6, 8, 7, null, 9, 11, 10];`,
    },
  ],
};

export function Preview() {
  return <CoverageStrip data={[...COVERAGE]} summary={false} width={130} height={12} />;
}

export const showcase = {
  hint: "presence strip",
  Node: () => (
    <CoverageStrip
      data={[...COVERAGE]}
      expected={18}
      label="percent"
      title="Coverage"
      width={150}
      height={14}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["binary", "intensity"],
      init: "binary",
    },
    {
      kind: "segmented",
      key: "shape",
      label: "shape",
      options: ["square", "round"],
      init: "square",
    },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["none", "percent"],
      init: "percent",
    },
  ],
  data: [...COVERAGE],
  shuffle: (seed) =>
    Array.from({ length: 14 }, (_, i) =>
      (i + seed) % 3 === 0 ? (null as unknown as number) : (i + seed) % 12,
    ),
  render: (s, data) => (
    <CoverageStrip
      data={data}
      expected={18}
      mode={s.mode as "binary" | "intensity"}
      shape={s.shape as "square" | "round"}
      label={s.label as "none" | "percent"}
      summary={false}
      width={260}
      height={16}
    />
  ),
  code: (s) =>
    [
      "<CoverageStrip",
      "  data={readings}",
      "  expected={18}",
      s.mode !== "binary" && `  mode="${s.mode}"`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, data, ui) => (
    <CoverageStripInteractive
      data={data}
      expected={18}
      mode={s.mode as "binary" | "intensity"}
      shape={s.shape as "square" | "round"}
      label={s.label as "none" | "percent"}
      summary={false}
      animate={ui.animate}
      width={260}
      height={16}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CoverageStrip",
      "  data={readings}",
      "  expected={18}",
      s.mode !== "binary" && `  mode="${s.mode}"`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow through the slots — each says whether it was measured, or missing.",
};

export const recipes: Recipe[] = [
  {
    label: "trailing gap counts",
    code: `// an array that simply stops is the worst gap of all\n<CoverageStrip data={[1, 1, 1]} expected={8} label="percent" />`,
    node: (
      <CoverageStrip
        data={[1, 1, 1]}
        expected={8}
        label="percent"
        summary={false}
        width={150}
        height={12}
      />
    ),
  },
  {
    label: "zero ≠ missing",
    code: `// a measured zero is filled; a gap is hollow\n<CoverageStrip data={[3, 0, null, 5]} />`,
    node: <CoverageStrip data={[3, 0, null, 5]} summary={false} width={90} height={12} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <CoverageStrip
      data={props.data}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 10}
    />
  );
}

export function markCode(): string {
  return `<CoverageStrip data={data} />`;
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
