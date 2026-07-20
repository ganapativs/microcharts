import { ChangePoint } from "@microcharts/react/change-point";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// error rate that stepped up on the 14th, then held — a clean level shift
export const ERRORS: number[] = [
  ...Array(14)
    .fill(0)
    .map((_, i) => 30 + ((i * 7) % 5) - 2),
  ...Array(20)
    .fill(0)
    .map((_, i) => 48 + ((i * 5) % 5) - 2),
];
export const RAMP = Array.from({ length: 40 }, (_, i) => 20 + i * 1.2);

export const entry: ChartEntry = {
  name: "ChangePoint",
  slug: "change-point",
  status: "stable",
  collection: "decision",
  tagline: "When did the behavior change level?",
  staticImport: `${PKG}/change-point`,
  interactiveImport: `${PKG}/change-point/interactive`,
  dataShape: "number[]",
  encoding: { channel: "break marker position + regime shading", precision: "high" },
  nodeBudget: "≤ 6 + 3 per break",
  bestFor: [
    "context for an anomaly — a spike means nothing without the regime it broke",
    "error rate / latency / cost that stepped to a new level",
    "annotating a known deploy or incident (pass explicit `breaks`)",
  ],
  avoidFor: ["a gradual trend (Sparkline)", "a plain time series with no regime question"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "A single series.",
    },
    {
      name: "breaks",
      type: '"auto" | number[]',
      required: false,
      description: "Explicit indices override the heuristic entirely — the production path.",
    },
    {
      name: "maxItems",
      type: "number",
      required: false,
      description: "Max detected breaks (1–3). More regimes stop being glanceable.",
    },
    {
      name: "means",
      type: "boolean",
      required: false,
      description: "Per-regime mean hairlines (default true).",
    },
    {
      name: "label",
      type: '"delta" | "none"',
      required: false,
      description: "Signed % across the most recent break, in a gutter.",
    },
  ],
  demo: ERRORS,
  example: {
    title: "Error rate",
    code: `import { ChangePoint } from "${PKG}/change-point";\n\n<ChangePoint data={errors} label="delta" title="Error rate" />`,
  },
  sampleData: [
    {
      name: "errors",
      code: `// error rate that stepped up on the 14th, then held — a clean level shift
const errors = [
  ...Array(14).fill(0).map((_, i) => 30 + ((i * 7) % 5) - 2),
  ...Array(20).fill(0).map((_, i) => 48 + ((i * 5) % 5) - 2),
];`,
    },
    {
      name: "ramp",
      code: `const ramp = Array.from({ length: 40 }, (_, i) => 20 + i * 1.2);`,
    },
  ],
};

export function Preview() {
  return <ChangePoint data={ERRORS} summary={false} width={120} height={16} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "preset", label: "series", options: ["step", "ramp"], init: "step" },
    { kind: "range", key: "maxItems", label: "maxItems", min: 1, max: 3, step: 1, init: 2 },
    { kind: "toggle", key: "means", label: "means", init: true },
    { kind: "toggle", key: "delta", label: "delta label", init: true },
  ],
  render: (s) => (
    <ChangePoint
      data={s.preset === "ramp" ? RAMP : ERRORS}
      maxItems={s.maxItems as number}
      means={s.means as boolean}
      label={s.delta ? "delta" : "none"}
      title="Error rate"
      summary={false}
      width={280}
      height={28}
    />
  ),
  code: (s) =>
    [
      "<ChangePoint",
      "  data={errors}",
      s.maxItems !== 2 && `  maxItems={${s.maxItems}}`,
      s.means === false && "  means={false}",
      s.delta && '  label="delta"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the points — each announces its value and regime; Tab jumps between the breaks, announcing the mean shift.",
};

export const recipes: Recipe[] = [
  {
    label: "annotate a known deploy (explicit break)",
    code: `<ChangePoint data={errors} breaks={[14]} />`,
    node: <ChangePoint data={ERRORS} breaks={[14]} summary={false} width={200} height={22} />,
  },
  {
    label: "a gradual ramp has no level shift",
    code: `<ChangePoint data={ramp} />`,
    node: <ChangePoint data={RAMP} summary={false} width={200} height={22} />,
  },
];

const CTX_ROWS = [
  { name: "checkout", meta: "+0.8pp", data: [0.66, 0.68, 0.7, 0.72, 0.74, 0.76, 0.78, 0.8] },
  { name: "auth", meta: "stable", data: [0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.97, 1.0] },
  { name: "search", meta: "+0.3pp", data: [0.25, 0.25, 0.26, 0.27, 0.28, 0.28, 0.29, 0.3] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Error rate this week{" "}
        <span className="mc-inline">
          <ChangePoint data={ERRORS} label="delta" height={16} summary={false} />
        </span>{" "}
        — step-up on day 14, regime break at 2.1%.
      </p>
    ),
    code: "<p>\n  Error rate this week <ChangePoint data={errors} /> — step-up on day 14, regime break at 2.1%.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <ChangePoint data={row.data} label="delta" height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <ChangePoint data={errors} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Error rate</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">2.1%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">post-change regime</span>
          </div>
        </div>
        <ChangePoint data={CTX_ROWS[0]!.data} label="delta" height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">2.1%</span>\n  <span className="unit">post-change regime</span>\n  <ChangePoint data={errors} />\n</div>',
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
            <ChangePoint data={row.data} label="delta" height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  checkout <ChangePoint data={errors} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = [
    ...props.data.slice(0, 8).map((v) => 20 + (Math.abs(v) % 6)),
    ...props.data.slice(8, 16).map((v) => 45 + (Math.abs(v) % 6)),
  ];
  return (
    <ChangePoint
      data={data.length ? data : ERRORS}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<ChangePoint data={errors} />`;
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
