import { PercentileTrace } from "@microcharts/react/percentile-trace";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a weekly standing that drifts up from the middle half into the top band
export const DEMO = [40, 46, 52, 58, 63, 68, 72, 76, 79, 81];
// a standing sliding the other way
export const FALL = [78, 72, 64, 55, 47, 40, 34, 29, 26, 24];

export const entry: ChartEntry = {
  name: "PercentileTrace",
  slug: "percentile-trace",
  status: "stable",
  collection: "decision",
  tagline: "Is this entity's standing rising or slipping inside the pack?",
  staticImport: `${PKG}/percentile-trace`,
  interactiveImport: `${PKG}/percentile-trace/interactive`,
  dataShape: "number[], percentile ranks 0–100, one per reading",
  encoding: {
    channel: "line position on a locked 0–100 percentile scale",
    precision: "high — rank is the axis, so the population bands are exact by definition",
  },
  nodeBudget: "≤ 6",
  bestFor: [
    "one player's or product's rank drifting over time",
    "whether a standing has crossed into the top or bottom of the pack",
    "a percentile KPI where the population context matters",
  ],
  avoidFor: [
    "a raw value over time (Sparkline)",
    "one absolute number vs a target (Bullet / Delta)",
  ],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Percentile ranks 0–100, one per reading; out-of-range values are clamped.",
    },
    {
      name: "showBands",
      type: "boolean",
      required: false,
      description: "Draw the fixed p25–75 and p5–95 population fields (default true).",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which direction is good — colors the endpoint dot (default up).",
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Final percentile in a right gutter.",
    },
    {
      name: "unit",
      type: "string",
      required: false,
      description: "Reading noun for the interactive announcement (default 'step').",
      interactive: true,
    },
  ],
  demo: DEMO,
  example: {
    title: "Standing",
    code: `import { PercentileTrace } from "${PKG}/percentile-trace";\n\n<PercentileTrace data={ranks} title="Standing" />`,
  },
  sampleData: [
    {
      name: "ranks",
      code: `// a weekly standing that drifts up from the middle half into the top band
const ranks = [40, 46, 52, 58, 63, 68, 72, 76, 79, 81];`,
    },
  ],
};

export function Preview() {
  return <PercentileTrace data={DEMO} summary={false} width={150} height={26} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "showBands", label: "show bands", init: true },
    { kind: "segmented", key: "positive", label: "good is", options: ["up", "down"], init: "up" },
  ],
  render: (s) => (
    <PercentileTrace
      data={DEMO}
      showBands={s.showBands as boolean}
      positive={s.positive as "up" | "down"}
      summary={false}
      width={280}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<PercentileTrace",
      "  data={ranks}",
      s.showBands === false && "  showBands={false}",
      s.positive !== "up" && `  positive="${s.positive}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the weeks — each announces the percentile at that reading.",
};

export const recipes: Recipe[] = [
  {
    label: "without population bands",
    code: `<PercentileTrace data={ranks} showBands={false} />`,
    node: <PercentileTrace data={DEMO} showBands={false} summary={false} width={170} height={26} />,
  },
  {
    label: "a slipping standing (down is good)",
    code: `<PercentileTrace data={ranks} positive="down" />`,
    node: <PercentileTrace data={FALL} positive="down" summary={false} width={170} height={26} />,
  },
];

const CTX_ROWS = [
  { name: "Team A", meta: "81st", data: [58, 62, 65, 68, 71, 75, 78, 81] },
  { name: "Team B", meta: "62nd", data: [45, 47, 50, 52, 55, 57, 60, 62] },
  { name: "Team C", meta: "44th", data: [32, 33, 35, 37, 39, 40, 42, 44] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Standing over the season{" "}
        <span className="mc-inline">
          <PercentileTrace data={DEMO} height={16} summary={false} />
        </span>{" "}
        — climbed from 40th to 81st percentile.
      </p>
    ),
    code: "<p>\n  Standing over the season <PercentileTrace data={ranks} /> — climbed from 40th to 81st percentile.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <PercentileTrace data={row.data} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <PercentileTrace data={ranks} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Standing</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">81st</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">percentile now</span>
          </div>
        </div>
        <PercentileTrace data={CTX_ROWS[0]!.data} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">81st</span>\n  <span className="unit">percentile now</span>\n  <PercentileTrace data={ranks} />\n</div>',
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
            <PercentileTrace data={row.data} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Team A <PercentileTrace data={ranks} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const norm = (props.data.length ? props.data : DEMO).map((v, j) =>
    Math.min(94, 22 + j * 6 + (Math.abs(v) % 5) * 2),
  );
  return (
    <PercentileTrace
      data={norm}
      label="none"
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<PercentileTrace data={ranks} />`;
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
