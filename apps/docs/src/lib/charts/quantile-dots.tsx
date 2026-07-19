import { QuantileDots } from "@microcharts/react/quantile-dots";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// bus-wait times (minutes): right-skewed, a long tail past the 15-min SLA
export const WAITS = Array.from({ length: 200 }, (_, i) =>
  Math.round(4 + (i % 30) * 0.35 + ((i * 7) % 13) * 1.1 + (i % 50 === 0 ? 20 : 0)),
);
export const MIN_FMT = (n: number) => `${n} min`;

export const entry: ChartEntry = {
  name: "QuantileDots",
  slug: "quantile-dots",
  status: "stable",
  collection: "decision",
  tagline: "What are the odds, in countable form?",
  staticImport: `${PKG}/quantile-dots`,
  interactiveImport: `${PKG}/quantile-dots/interactive`,
  dataShape: "number[], raw sample or posterior draws",
  encoding: {
    channel: "countable dot frequency past a threshold",
    precision: "high for the count, medium for shape",
  },
  nodeBudget: "1 per dot + 3",
  bestFor: [
    'a "will we miss the SLA?" read in a sentence',
    "odds you can count in a KPI card",
    "a posterior you want to communicate as frequency, not percent",
  ],
  avoidFor: [
    "a precise distribution shape (HistogramStrip)",
    "one estimate's interval (GradedBand)",
  ],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Raw sample or posterior draws — the component derives the quantile dots.",
    },
    {
      name: "count",
      type: "number",
      required: false,
      description: "Number of quantile dots (default 20; 15–20 recommended; capped at 25).",
    },
    {
      name: "threshold",
      type: "number",
      required: false,
      description: "The decision line — turns the plot from shape into odds.",
    },
    {
      name: "side",
      type: '"above" | "below"',
      required: false,
      description: "Which side of the threshold is the event being counted.",
    },
  ],
  demo: WAITS,
  example: {
    title: "Bus wait",
    code: `import { QuantileDots } from "${PKG}/quantile-dots";\n\n<QuantileDots data={waits} threshold={15} format={(n) => \`\${n} min\`} title="Bus wait" />`,
  },
  sampleData: [
    {
      name: "waits",
      code: `// bus-wait times (minutes): right-skewed, a long tail past the 15-min SLA
const waits = Array.from({ length: 200 }, (_, i) =>
  Math.round(4 + (i % 30) * 0.35 + ((i * 7) % 13) * 1.1 + (i % 50 === 0 ? 20 : 0)),
);`,
    },
  ],
};

export function Preview() {
  return (
    <QuantileDots
      data={WAITS}
      threshold={15}
      format={MIN_FMT}
      summary={false}
      width={150}
      height={24}
    />
  );
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "threshold", label: "threshold", min: 5, max: 30, step: 1, init: 15 },
    { kind: "segmented", key: "count", label: "count", options: ["15", "20", "25"], init: "20" },
    { kind: "segmented", key: "side", label: "side", options: ["above", "below"], init: "above" },
  ],
  render: (s) => (
    <QuantileDots
      data={WAITS}
      count={Number(s.count)}
      threshold={s.threshold as number}
      side={s.side as "above" | "below"}
      format={MIN_FMT}
      summary={false}
      width={280}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<QuantileDots",
      "  data={waits}",
      `  threshold={${s.threshold}}`,
      s.count !== "20" && `  count={${s.count}}`,
      s.side !== "above" && `  side="${s.side}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover to drag the threshold — the count of dots past the line recomputes as you move it.",
};

export const recipes: Recipe[] = [
  {
    label: "count the odds past a line",
    code: `<QuantileDots data={waits} threshold={15} side="above" />`,
    node: (
      <QuantileDots
        data={WAITS}
        threshold={15}
        format={MIN_FMT}
        summary={false}
        width={170}
        height={24}
      />
    ),
  },
  {
    label: "fewer dots — faster to count",
    code: `<QuantileDots data={waits} count={15} threshold={15} />`,
    node: (
      <QuantileDots
        data={WAITS}
        count={15}
        threshold={15}
        format={MIN_FMT}
        summary={false}
        width={170}
        height={24}
      />
    ),
  },
];

const CTX_ROWS = [
  { name: "Route 42", meta: "16%", data: [0.13, 0.14, 0.14, 0.14, 0.15, 0.15, 0.16, 0.16] },
  { name: "Route 18", meta: "8%", data: [0.07, 0.07, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08] },
  { name: "Route 7", meta: "22%", data: [0.18, 0.19, 0.19, 0.2, 0.2, 0.21, 0.21, 0.22] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Bus wait times{" "}
        <span className="mc-inline">
          <QuantileDots data={WAITS} threshold={15} format={MIN_FMT} height={16} summary={false} />
        </span>{" "}
        — 16% of waits exceed the 15 min SLA.
      </p>
    ),
    code: "<p>\n  Bus wait times <QuantileDots data={waits} threshold={15} /> — 16% of waits exceed the 15 min SLA.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <QuantileDots
                  data={row.data}
                  threshold={15}
                  format={MIN_FMT}
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
    code: "<td>\n  <QuantileDots data={waits} threshold={15} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">SLA risk</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">16%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">over 15 min</span>
          </div>
        </div>
        <QuantileDots
          data={CTX_ROWS[0]!.data}
          threshold={15}
          format={MIN_FMT}
          height={36}
          summary={false}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">16%</span>\n  <span className="unit">over 15 min</span>\n  <QuantileDots data={waits} threshold={15} />\n</div>',
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
            <QuantileDots
              data={row.data}
              threshold={15}
              format={MIN_FMT}
              height={14}
              summary={false}
            />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Route 42 <QuantileDots data={waits} threshold={15} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  if (!props.data.length) {
    return (
      <QuantileDots
        data={WAITS}
        threshold={15}
        count={11}
        label="none"
        summary={false}
        width={props.width ?? 70}
        height={props.height ?? 18}
      />
    );
  }
  return (
    <QuantileDots
      data={props.data.map((v) => 4 + (Math.abs(v) % 20))}
      threshold={14}
      count={11}
      label="none"
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<QuantileDots data={waits} threshold={15} />`;
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
