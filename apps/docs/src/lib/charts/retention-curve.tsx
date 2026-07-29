import { RetentionCurve } from "@microcharts/react/retention-curve";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a weekly cohort that decays then plateaus around 38%
export const DEMO = [1, 0.72, 0.55, 0.47, 0.42, 0.4, 0.39, 0.385, 0.382, 0.38, 0.379, 0.378];
// a leakier peer/industry curve (the subordinate ghost)
export const BENCH = [1, 0.6, 0.44, 0.37, 0.33, 0.3, 0.29, 0.285, 0.282, 0.28, 0.279, 0.278];

export const entry: ChartEntry = {
  name: "RetentionCurve",
  slug: "retention-curve",
  status: "stable",
  collection: "decision",
  tagline: "Do they stay, and does the curve plateau?",
  staticImport: `${PKG}/retention-curve`,
  interactiveImport: `${PKG}/retention-curve/interactive`,
  dataShape: "number[], fraction retained per period (period 0 ≈ 1.0)",
  encoding: {
    channel: "step-line position on a locked [0,1] scale",
    precision: "high — the full range is the honest frame for a share",
  },
  nodeBudget: "≤ 6",
  bestFor: [
    "a cohort retention curve in a KPI card",
    "your decay vs an industry benchmark",
    "spotting whether retention plateaus (or keeps leaking)",
  ],
  avoidFor: ["a continuous signal (Sparkline)", "one-number retention (Progress / Delta)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Fraction retained per period (0–1 or 0–100); period 0 is typically 1.0.",
    },
    {
      name: "compare",
      type: "number[]",
      required: false,
      description:
        "Peer/industry curve, drawn as a subordinate dashed ghost. The catalog word for a second series to read the first against (DualSparkline, StarSpoke).",
    },
    {
      name: "benchmark",
      type: "number[]",
      required: false,
      description:
        "Deprecated alias for `compare`, still accepted and still winning when both are passed.",
    },
    {
      name: "plateau",
      type: "boolean",
      required: false,
      description: "Detect + mark a plateau (default true).",
    },
    {
      name: "curve",
      type: '"step" | "smooth"',
      required: false,
      description: "Step (default — cohorts are discrete) or smooth (editorial).",
    },
    {
      name: "unit",
      type: "string",
      required: false,
      description: "Period noun for the summary (default 'period').",
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Final retention in a right gutter.",
    },
  ],
  demo: DEMO,
  example: {
    title: "W12 cohort",
    code: `import { RetentionCurve } from "${PKG}/retention-curve";\n\n<RetentionCurve data={cohort} unit="week" title="W12 cohort" />`,
  },
  sampleData: [
    {
      name: "cohort",
      code: `// a weekly cohort that decays then plateaus around 38%
const cohort = [1, 0.72, 0.55, 0.47, 0.42, 0.4, 0.39, 0.385, 0.382, 0.38, 0.379, 0.378];`,
    },
    {
      name: "industry",
      code: `// a leakier peer/industry curve (the subordinate ghost)
const industry = [1, 0.6, 0.44, 0.37, 0.33, 0.3, 0.29, 0.285, 0.282, 0.28, 0.279, 0.278];`,
    },
  ],
};

export function Preview() {
  return <RetentionCurve data={DEMO} summary={false} width={150} height={26} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "compare", label: "compare", init: true },
    { kind: "toggle", key: "plateau", label: "plateau", init: true },
    { kind: "segmented", key: "curve", label: "curve", options: ["step", "smooth"], init: "step" },
  ],
  render: (s) => (
    <RetentionCurve
      data={DEMO}
      compare={s.compare ? BENCH : undefined}
      plateau={s.plateau as boolean}
      curve={s.curve as "step" | "smooth"}
      unit="week"
      summary={false}
      width={280}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<RetentionCurve",
      "  data={cohort}",
      s.compare && "  compare={industry}",
      s.plateau === false && "  plateau={false}",
      s.curve !== "step" && `  curve="${s.curve}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow across the weeks — each announces retention and the benchmark.",
};

export const recipes: Recipe[] = [
  {
    label: "vs industry benchmark",
    code: `<RetentionCurve data={cohort} compare={industry} />`,
    node: <RetentionCurve data={DEMO} compare={BENCH} summary={false} width={170} height={26} />,
  },
  {
    label: "smooth (editorial)",
    code: `// step is the honest default for cohort data\n<RetentionCurve data={cohort} curve="smooth" />`,
    node: <RetentionCurve data={DEMO} curve="smooth" summary={false} width={170} height={26} />,
  },
];

const CTX_ROWS = [
  { name: "Jan", meta: "38%", data: [0.31, 0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38] },
  { name: "Feb", meta: "41%", data: [0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.4, 0.41] },
  { name: "Mar", meta: "35%", data: [0.29, 0.3, 0.3, 0.31, 0.32, 0.33, 0.34, 0.35] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        W12 cohort retention{" "}
        <span className="mc-inline">
          <RetentionCurve data={DEMO} compare={BENCH} unit="week" height={16} summary={false} />
        </span>{" "}
        — 38% at week 12, above benchmark.
      </p>
    ),
    code: '<p>\n  W12 cohort retention{" "}\n  <span className="mc-inline">\n    <RetentionCurve data={cohort} summary={false} />\n  </span>{" "}\n  — 38% at week 12, above benchmark.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <RetentionCurve
                  data={row.data}
                  compare={BENCH}
                  unit="week"
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
    code: "<td>\n  <RetentionCurve data={cohort} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">W12 cohort</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">38%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">retained</span>
          </div>
        </div>
        <RetentionCurve
          data={CTX_ROWS[0]!.data}
          compare={BENCH}
          unit="week"
          height={36}
          summary={false}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">38%</span>\n  <span className="unit">retained</span>\n  <RetentionCurve data={cohort} />\n</div>',
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
            <RetentionCurve
              data={row.data}
              compare={BENCH}
              unit="week"
              height={14}
              summary={false}
            />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Jan <RetentionCurve data={cohort} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const norm = (props.data.length ? props.data : DEMO).map((v, j) =>
    Math.max(0.1, 1 - j * 0.12 - (Math.abs(v) % 3) * 0.02),
  );
  return (
    <RetentionCurve
      data={norm}
      label="none"
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<RetentionCurve data={cohort} />`;
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
