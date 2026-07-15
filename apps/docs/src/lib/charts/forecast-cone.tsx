import { ForecastCone } from "@microcharts/react/forecast-cone";
import { ForecastCone as ForecastConeInteractive } from "@microcharts/react/forecast-cone/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// weekly revenue ($M): 7 weeks of history, a 4-week widening forecast
export const HIST = [30, 32, 31, 34, 36, 35, 38];
export const FORE = {
  mid: [39, 40, 41, 42],
  p80: [
    [36, 42],
    [35, 45],
    [34, 50],
    [33, 55],
  ] as [number, number][],
  p50: [
    [37, 41],
    [37, 43],
    [36, 46],
    [35, 49],
  ] as [number, number][],
};

export const entry: ChartEntry = {
  name: "ForecastCone",
  slug: "forecast-cone",
  status: "stable",
  collection: "decision",
  tagline: "Will we land where we need to?",
  staticImport: `${PKG}/forecast-cone`,
  interactiveImport: `${PKG}/forecast-cone/interactive`,
  dataShape: "number[] history + { mid, p80, p50? } forecast",
  encoding: {
    channel: "prediction-band extent widening over the horizon",
    precision: "medium — the widening itself is the message",
  },
  nodeBudget: "≤ 8",
  bestFor: [
    'a "will we hit Q4?" forecast in a KPI card',
    "a projection with honest uncertainty in a sentence",
    "band-vs-target landing reads",
  ],
  avoidFor: ["a forecast with no uncertainty (Sparkline)", "one estimate's spread (GradedBand)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Historical actuals.",
    },
    {
      name: "forecast",
      type: "{ mid: number[]; p80: [lo,hi][]; p50?: [lo,hi][] }",
      required: true,
      description: "Median + prediction bands (at most 2: 50/80).",
    },
    {
      name: "target",
      type: "number",
      required: false,
      description: "The landing reference the cone must clear (adds a clearance clause).",
    },
    {
      name: "unit",
      type: "string",
      required: false,
      description: 'Period noun for the summary (default "week").',
    },
    {
      name: "label",
      type: '"landing" | "none"',
      required: false,
      description: "Median endpoint value in a right gutter.",
    },
  ],
  demo: [...HIST, ...FORE.mid],
  example: {
    title: "Q4 revenue",
    code: `import { ForecastCone } from "${PKG}/forecast-cone";\n\n<ForecastCone data={history} forecast={forecast} target={45} title="Q4 revenue" />`,
  },
  sampleData: [
    {
      name: "history",
      code: `// weekly revenue ($M): 7 weeks of history, a 4-week widening forecast
const history = [30, 32, 31, 34, 36, 35, 38];`,
    },
    {
      name: "forecast",
      code: `const forecast = {
  mid: [39, 40, 41, 42],
  p80: [[36, 42], [35, 45], [34, 50], [33, 55]],
  p50: [[37, 41], [37, 43], [36, 46], [35, 49]],
};`,
    },
  ],
};

export function Preview() {
  return <ForecastCone data={HIST} forecast={FORE} summary={false} width={150} height={24} />;
}

export const showcase = {
  hint: "widening forecast",
  Node: () => (
    <ForecastCone
      data={HIST}
      forecast={FORE}
      target={45}
      title="Q4 revenue"
      width={150}
      height={24}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "p50", label: "inner band", init: true },
    { kind: "toggle", key: "target", label: "target", init: true },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["none", "landing"],
      init: "landing",
    },
  ],
  render: (s) => (
    <ForecastCone
      data={HIST}
      forecast={s.p50 ? FORE : { mid: FORE.mid, p80: FORE.p80 }}
      target={s.target ? 45 : undefined}
      label={s.label as "landing" | "none"}
      summary={false}
      width={280}
      height={28}
    />
  ),
  code: (s) =>
    [
      "<ForecastCone",
      "  data={history}",
      "  forecast={forecast}",
      s.target && "  target={45}",
      s.label !== "landing" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ForecastConeInteractive
      data={HIST}
      forecast={s.p50 ? FORE : { mid: FORE.mid, p80: FORE.p80 }}
      target={s.target ? 45 : undefined}
      label={s.label as "landing" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ForecastCone",
      "  data={history}",
      "  forecast={forecast}",
      s.target && "  target={45}",
      s.label !== "landing" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the weeks — history announces a value, the forecast region announces the median and 80% interval.",
};

export const recipes: Recipe[] = [
  {
    label: "band vs target",
    code: `<ForecastCone data={history} forecast={forecast} target={45} />`,
    node: (
      <ForecastCone
        data={HIST}
        forecast={FORE}
        target={45}
        summary={false}
        width={180}
        height={24}
      />
    ),
  },
  {
    label: "single band (tightest form)",
    code: `<ForecastCone data={history} forecast={{ mid, p80 }} />`,
    node: (
      <ForecastCone
        data={HIST}
        forecast={{ mid: FORE.mid, p80: FORE.p80 }}
        summary={false}
        width={180}
        height={24}
      />
    ),
  },
];

const CTX_ROWS = [
  { name: "Q4", meta: "112%", data: [1, 1, 1, 1, 1, 1, 1, 1] },
  { name: "Q3", meta: "98%", data: [0.8, 0.83, 0.85, 0.88, 0.9, 0.93, 0.95, 0.98] },
  { name: "Q2", meta: "104%", data: [1, 1, 1, 1, 1, 1, 1, 1] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Q4 revenue forecast{" "}
        <span className="mc-inline">
          <ForecastCone data={HIST} forecast={FORE} target={45} height={16} summary={false} />
        </span>{" "}
        — median path clears target by week 3.
      </p>
    ),
    code: "<p>\n  Q4 revenue forecast <ForecastCone data={history} forecast={forecast} /> — median path clears target by week 3.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <ForecastCone
                  data={row.data}
                  forecast={FORE}
                  target={45}
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
    code: "<td>\n  <ForecastCone data={history} forecast={forecast} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Q4 revenue</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">112%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">of target (median)</span>
          </div>
        </div>
        <ForecastCone
          data={CTX_ROWS[0]!.data}
          forecast={FORE}
          target={45}
          height={36}
          summary={false}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">112%</span>\n  <span className="unit">of target (median)</span>\n  <ForecastCone data={history} forecast={forecast} />\n</div>',
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
            <ForecastCone data={row.data} forecast={FORE} target={45} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Q4 <ForecastCone data={history} forecast={forecast} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const hist = (props.data.length ? props.data : HIST)
    .slice(0, 5)
    .map((v) => 30 + (Math.abs(v) % 10));
  const mid = [38, 40, 42];
  const p80 = mid.map((v, j) => [v - 3 - j * 2, v + 3 + j * 2] as [number, number]);
  return (
    <ForecastCone
      data={hist}
      forecast={{ mid, p80 }}
      label="none"
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<ForecastCone data={history} forecast={forecast} />`;
}

export function PreviewLive() {
  return (
    <ForecastConeInteractive
      data={HIST}
      forecast={FORE}
      summary={false}
      width={150}
      height={24}
      animate
    />
  );
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
