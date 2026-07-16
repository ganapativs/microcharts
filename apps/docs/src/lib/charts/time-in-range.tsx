import { TimeInRange } from "@microcharts/react/time-in-range";
import { TimeInRange as TimeInRangeInteractive } from "@microcharts/react/time-in-range/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const GLUCOSE = { severeBelow: 2, below: 7, in: 72, above: 15, severeAbove: 4 };

export const entry: ChartEntry = {
  name: "TimeInRange",
  slug: "time-in-range",
  status: "stable",
  collection: "frontier",
  tagline: "How much of the period stayed inside the corridor, and which side it missed on.",
  staticImport: `${PKG}/time-in-range`,
  interactiveImport: `${PKG}/time-in-range/interactive`,
  dataShape: "{ severeBelow?, below, in, above, severeAbove? } (counts or fractions)",
  encoding: { channel: "stacked share length in fixed semantic order", precision: "high" },
  nodeBudget: "≤ 5 rects + ≤ 3 labels",
  bestFor: ["SLO / uptime corridors", "glucose-style time-in-range KPI"],
  avoidFor: ["ranking parts (SegmentedBar)", "a single ratio (Progress)"],
  props: [
    {
      name: "data",
      type: "TimeInRangeDatum",
      required: true,
      description: "Counts or fractions; normalized to 1.",
    },
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      required: false,
      description: "Vertical suits clinical columns and KPI cards.",
    },
    {
      name: "label",
      type: '"in" | "all" | "none"',
      required: false,
      description: "The in-range headline, a full audit, or clean.",
    },
  ],
  demo: [72, 9, 19],
  example: {
    title: "Glucose time-in-range",
    code: `import { TimeInRange } from "${PKG}/time-in-range";\n\n<TimeInRange data={{ below: 9, in: 72, above: 19 }} title="Time in range" />`,
  },
};

export function Preview() {
  return <TimeInRange data={GLUCOSE} summary={false} width={130} height={16} />;
}

export const showcase = {
  hint: "corridor",
  Node: () => <TimeInRange data={GLUCOSE} title="Time in range" width={130} height={16} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["in", "all", "none"],
      init: "in",
    },
    {
      kind: "segmented",
      key: "orientation",
      label: "orientation",
      options: ["horizontal", "vertical"],
      init: "horizontal",
    },
    { kind: "range", key: "in", label: "in-range", min: 20, max: 95, init: 72 },
  ],
  render: (s) => {
    const inV = s.in as number;
    const rest = 100 - inV;
    const data = {
      severeBelow: 2,
      below: Math.round(rest * 0.35),
      in: inV,
      above: Math.round(rest * 0.5),
      severeAbove: 2,
    };
    return s.orientation === "vertical" ? (
      <TimeInRange
        data={data}
        label={s.label as "in" | "all" | "none"}
        orientation="vertical"
        summary={false}
        width={26}
        height={120}
      />
    ) : (
      <TimeInRange
        data={data}
        label={s.label as "in" | "all" | "none"}
        summary={false}
        width={280}
        height={22}
      />
    );
  },
  code: (s) =>
    [
      "<TimeInRange",
      `  data={{ below: 9, in: ${s.in}, above: 19 }}`,
      s.label !== "in" && `  label="${s.label}"`,
      s.orientation !== "horizontal" && `  orientation="${s.orientation}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => {
    const inV = s.in as number;
    const rest = 100 - inV;
    const data = {
      severeBelow: 2,
      below: Math.round(rest * 0.35),
      in: inV,
      above: Math.round(rest * 0.5),
      severeAbove: 2,
    };
    return s.orientation === "vertical" ? (
      <TimeInRangeInteractive
        data={data}
        label={s.label as "in" | "all" | "none"}
        orientation="vertical"
        animate={ui.animate}
        summary={false}
        width={26}
        height={120}
      />
    ) : (
      <TimeInRangeInteractive
        data={data}
        label={s.label as "in" | "all" | "none"}
        animate={ui.animate}
        summary={false}
        width={280}
        height={22}
      />
    );
  },
  codeInteractive: (s, _data, ui) =>
    [
      "<TimeInRange",
      `  data={{ below: 9, in: ${s.in}, above: 19 }}`,
      s.label !== "in" && `  label="${s.label}"`,
      s.orientation !== "horizontal" && `  orientation="${s.orientation}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow across the zones — each announces its share of the period.",
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<TimeInRange data={row.tir} width={60} height={10} />`,
    node: <TimeInRange data={GLUCOSE} summary={false} width={60} height={10} />,
  },
  {
    label: "clinical column",
    code: `<TimeInRange data={tir} orientation="vertical" label="all" />`,
    node: (
      <TimeInRange
        data={GLUCOSE}
        orientation="vertical"
        label="all"
        summary={false}
        width={26}
        height={110}
      />
    ),
  },
];

const CTX_ROWS = [
  {
    name: "Patient A",
    meta: "72%",
    data: { severeBelow: 2, below: 10, in: 72, above: 12, severeAbove: 4 } as typeof GLUCOSE,
  },
  {
    name: "Patient B",
    meta: "68%",
    data: { severeBelow: 3, below: 12, in: 68, above: 13, severeAbove: 4 } as typeof GLUCOSE,
  },
  {
    name: "Patient C",
    meta: "81%",
    data: { severeBelow: 1, below: 7, in: 81, above: 8, severeAbove: 3 } as typeof GLUCOSE,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Glucose time-in-range{" "}
        <span className="mc-inline">
          <TimeInRange data={GLUCOSE} height={16} summary={false} />
        </span>{" "}
        — 72% in range, 9% below.
      </p>
    ),
    code: "<p>\n  Glucose time-in-range <TimeInRange data={{ below: 9, in: 72, above: 19 }} /> — 72% in range, 9% below.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <TimeInRange data={row.data} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <TimeInRange data={{ below: 9, in: 72, above: 19 }} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">In range</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">72%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">glucose TIR</span>
          </div>
        </div>
        <TimeInRange data={CTX_ROWS[0]!.data} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">72%</span>\n  <span className="unit">glucose TIR</span>\n  <TimeInRange data={{ below: 9, in: 72, above: 19 }} />\n</div>',
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
            <TimeInRange data={row.data} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Patient A <TimeInRange data={{ below: 9, in: 72, above: 19 }} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const [a = 9, b = 72, c = 19] = props.data;
  return (
    <TimeInRange
      data={{ below: Math.abs(a) || 9, in: Math.abs(b) || 72, above: Math.abs(c) || 19 }}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 10}
    />
  );
}

export function markCode(): string {
  return `<TimeInRange data={{ below: 9, in: 72, above: 19 }} />`;
}

export function PreviewLive() {
  return <TimeInRangeInteractive data={GLUCOSE} summary={false} width={130} height={16} animate />;
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
