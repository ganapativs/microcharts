import { CoverageStrip } from "@microcharts/react/coverage-strip";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a live window with real gaps: null = no measurement, 0 = a measured zero.
// Cast to number[] for the shared playground contract; CoverageStrip accepts nulls.
export const COVERAGE = [
  3,
  4,
  null,
  5,
  0,
  null,
  null,
  6,
  8,
  7,
  null,
  9,
  11,
  10,
] as unknown as number[];

export const entry: ChartEntry = {
  name: "CoverageStrip",
  slug: "coverage-strip",
  status: "stable",
  collection: "decision",
  tagline: "Can I trust this data, and where was nothing measured?",
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
      name: "steps",
      type: "number",
      required: false,
      description: "Intensity granularity (default 5).",
    },
    {
      name: "shape",
      type: '"square" | "round" | "dot"',
      required: false,
      description: "Cell shape from the shared vocabulary (default 'square').",
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

const CTX_ROWS = [
  {
    name: "North",
    meta: "92%",
    data: [3, 4, null, 5, 0, null, null, 6, 8, 7, null, 9, 11, 10] as unknown as number[],
  },
  {
    name: "South",
    meta: "86%",
    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as unknown as number[],
  },
  {
    name: "East",
    meta: "78%",
    data: [8, null, null, null, 9, 10, null, 11, 12, null, 13, 14] as unknown as number[],
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Sensor uptime this week{" "}
        <span className="mc-inline">
          <CoverageStrip
            data={[...COVERAGE]}
            expected={18}
            label="none"
            height={16}
            summary={false}
          />
        </span>{" "}
        — 86% coverage, two gaps on Tuesday.
      </p>
    ),
    code: "<p>\n  Sensor uptime this week <CoverageStrip data={readings} /> — 86% coverage, two gaps on Tuesday.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <CoverageStrip
                  data={row.data}
                  expected={18}
                  label="none"
                  height={18}
                  summary={false}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <CoverageStrip data={readings} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Coverage</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">86%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">sensor uptime</span>
          </div>
        </div>
        <CoverageStrip
          data={[...COVERAGE]}
          expected={18}
          label="percent"
          height={36}
          summary={false}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">86%</span>\n  <span className="unit">sensor uptime</span>\n  <CoverageStrip data={readings} />\n</div>',
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
            <CoverageStrip data={row.data} expected={18} label="none" height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  North <CoverageStrip data={readings} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <CoverageStrip
      data={props.data.length ? props.data : COVERAGE}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 10}
    />
  );
}

export function markCode(): string {
  return `<CoverageStrip data={readings} />`;
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
