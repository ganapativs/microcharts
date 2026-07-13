import { GradedBand } from "@microcharts/react/graded-band";
import { GradedBand as GradedBandInteractive } from "@microcharts/react/graded-band/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// posterior draws for one estimate (deterministic pseudo-sample)
const DRAWS = Array.from(
  { length: 160 },
  (_, i) => 21 + Math.round(9 * Math.sin(i) + 6 * Math.sin(i * 2.3)),
);

export const entry: ChartEntry = {
  name: "GradedBand",
  slug: "graded-band",
  status: "stable",
  collection: "decision",
  tagline: "How sure are we about this one number?",
  staticImport: `${PKG}/graded-band`,
  interactiveImport: `${PKG}/graded-band/interactive`,
  dataShape: "number[]",
  encoding: {
    channel: "nested interval extent, graded by opacity",
    precision: "medium — interval read",
  },
  nodeBudget: "≤ 6",
  bestFor: [
    "a forecast with its uncertainty",
    "estimate-vs-actual in a KPI card",
    "posterior summaries",
  ],
  avoidFor: ["countable odds (QuantileDots)", "a forecast over time (ForecastCone)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Sample / posterior draws; the component derives the intervals.",
    },
    {
      name: "levels",
      type: "number[]",
      required: false,
      description: "1–3 nested central intervals (default [50, 80, 95]).",
    },
    {
      name: "value",
      type: "number",
      required: false,
      description: "Observed value overlaid as a dot.",
    },
    {
      name: "softEdge",
      type: "boolean",
      required: false,
      description: "Fade past the outer band — 'this is approximate'.",
    },
  ],
  demo: [12, 17, 21, 21, 26, 38],
  example: {
    title: "Forecast estimate",
    code: `import { GradedBand } from "${PKG}/graded-band";\n\n<GradedBand data={posterior} label="median" title="Forecast estimate" />`,
  },
  sampleData: [
    {
      name: "posterior",
      code: `// posterior draws for one estimate (deterministic pseudo-sample)
const posterior = Array.from(
  { length: 160 },
  (_, i) => 21 + Math.round(9 * Math.sin(i) + 6 * Math.sin(i * 2.3)),
);`,
    },
  ],
};

export function Preview() {
  return <GradedBand data={DRAWS} summary={false} width={140} height={14} />;
}

export const showcase = {
  hint: "uncertainty band",
  Node: () => (
    <GradedBand data={DRAWS} label="median" title="Forecast estimate" width={150} height={14} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "levels",
      label: "levels",
      options: ["50/80/95", "50/90"],
      init: "50/80/95",
    },
    { kind: "toggle", key: "softEdge", label: "soft edge", init: false },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["none", "median"],
      init: "median",
    },
  ],
  data: DRAWS,
  render: (s, data) => (
    <GradedBand
      data={data}
      levels={s.levels === "50/90" ? [50, 90] : [50, 80, 95]}
      softEdge={s.softEdge as boolean}
      label={s.label as "none" | "median"}
      summary={false}
      width={280}
      height={16}
    />
  ),
  code: (s) =>
    [
      "<GradedBand",
      "  data={posterior}",
      s.levels === "50/90" && "  levels={[50, 90]}",
      s.softEdge && "  softEdge",
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, data, ui) => (
    <GradedBandInteractive
      data={data}
      levels={s.levels === "50/90" ? [50, 90] : [50, 80, 95]}
      softEdge={s.softEdge as boolean}
      label={s.label as "none" | "median"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={16}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<GradedBand",
      "  data={posterior}",
      s.levels === "50/90" && "  levels={[50, 90]}",
      s.softEdge && "  softEdge",
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow outward from the median — each level announces its interval.",
};

export const recipes: Recipe[] = [
  {
    label: "estimate vs actual",
    code: `// the dot is a distinct shape from the median tick\n<GradedBand data={posterior} value={28} />`,
    node: <GradedBand data={DRAWS} value={28} summary={false} width={150} height={14} />,
  },
  {
    label: "soft edge = approximate",
    code: `<GradedBand data={posterior} softEdge />`,
    node: <GradedBand data={DRAWS} softEdge summary={false} width={150} height={14} />,
  },
];

const CTX_ROWS = [
  { name: "Revenue", meta: "19" },
  { name: "Users", meta: "42K" },
  { name: "Churn", meta: "2.1%" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Forecast estimate{" "}
        <span className="mc-inline">
          <GradedBand data={DRAWS} label="median" height={16} summary={false} />
        </span>{" "}
        — 50% band spans 17–21, point at 19.
      </p>
    ),
    code: "<p>\n  Forecast estimate <GradedBand data={posterior} /> — 50% band spans 17–21, point at 19.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <GradedBand data={DRAWS} label="median" height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <GradedBand data={posterior} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Forecast</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">19</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">median estimate</span>
          </div>
        </div>
        <GradedBand data={DRAWS} label="median" height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">19</span>\n  <span className="unit">median estimate</span>\n  <GradedBand data={posterior} />\n</div>',
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
            <GradedBand data={DRAWS} label="median" height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Revenue <GradedBand data={posterior} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <GradedBand
      data={props.data.length ? props.data : DRAWS}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 12}
    />
  );
}

export function markCode(): string {
  return `<GradedBand data={posterior} />`;
}

export function PreviewLive() {
  return <GradedBandInteractive data={DRAWS} summary={false} width={140} height={14} animate />;
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
