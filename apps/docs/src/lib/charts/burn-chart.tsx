import { BurnChart } from "@microcharts/react/burn-chart";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";
import { burnFromStatus } from "./contexts-helpers";

const PKG = "@microcharts/react";
// an 11-day sprint burning down; 6 days in, slightly behind → projected 2 days late
export const PLAN = [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0];
export const ACTUAL = [40, 35, 31, 27, 24, 21];

export const entry: ChartEntry = {
  name: "BurnChart",
  slug: "burn-chart",
  status: "stable",
  collection: "decision",
  tagline: "Will we finish on time?",
  staticImport: `${PKG}/burn-chart`,
  interactiveImport: `${PKG}/burn-chart/interactive`,
  dataShape: "{ plan: number[]; actual: number[] }, remaining work per period",
  encoding: {
    channel: "actual line vs the plan line + projected landing gap",
    precision: "high for history, low-deliberate for the dotted projection",
  },
  nodeBudget: "≤ 7",
  bestFor: [
    "a sprint burndown in a tab header",
    "will-we-finish in a KPI card",
    "plan vs actual with a projected landing",
  ],
  avoidFor: ["a single progress number (Progress)", "a plain series (Sparkline)"],
  props: [
    {
      name: "data",
      type: "{ plan: number[]; actual: number[] }",
      required: true,
      description: "Remaining work per period (mode='down') or completed (mode='up').",
    },
    {
      name: "mode",
      type: '"down" | "up"',
      required: false,
      description: "Burn-down (remaining → 0, default) or burn-up (done → scope).",
    },
    {
      name: "projection",
      type: "boolean",
      required: false,
      description: "The dotted extrapolation to the deadline (default true).",
    },
    {
      name: "work",
      type: "string",
      required: false,
      description: "Work-unit noun for the summary (default 'points').",
    },
    {
      name: "unit",
      type: "string",
      required: false,
      description: "Period noun for the summary and gap label (default 'day').",
    },
    {
      name: "label",
      type: '"gap" | "none"',
      required: false,
      description: "Signed schedule landing vs the deadline in a right gutter.",
    },
  ],
  demo: ACTUAL,
  example: {
    title: "Sprint 12",
    code: `import { BurnChart } from "${PKG}/burn-chart";\n\n<BurnChart data={{ plan, actual }} title="Sprint 12" />`,
  },
  sampleData: [
    {
      name: "plan",
      code: `// an 11-day sprint burning down; 6 days in, slightly behind → projected 2 days late
const plan = [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0];`,
    },
    {
      name: "actual",
      code: `const actual = [40, 35, 31, 27, 24, 21];`,
    },
  ],
};

export function Preview() {
  return (
    <BurnChart data={{ plan: PLAN, actual: ACTUAL }} summary={false} width={150} height={26} />
  );
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "mode", label: "mode", options: ["down", "up"], init: "down" },
    { kind: "toggle", key: "projection", label: "projection", init: true },
    { kind: "segmented", key: "label", label: "label", options: ["none", "gap"], init: "gap" },
  ],
  render: (s) => {
    const up = s.mode === "up";
    const plan = up ? PLAN.map((v) => 40 - v) : PLAN;
    const actual = up ? ACTUAL.map((v) => 40 - v) : ACTUAL;
    return (
      <BurnChart
        data={{ plan, actual }}
        mode={s.mode as "down" | "up"}
        projection={s.projection as boolean}
        label={s.label as "gap" | "none"}
        summary={false}
        width={280}
        height={30}
      />
    );
  },
  code: (s) =>
    [
      "<BurnChart",
      "  data={{ plan, actual }}",
      s.mode !== "down" && `  mode="${s.mode}"`,
      s.projection === false && "  projection={false}",
      s.label !== "gap" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the days — history announces actual vs plan, the dotted region announces the projection.",
};

export const recipes: Recipe[] = [
  {
    label: "plan vs actual only (retrospective)",
    code: `<BurnChart data={{ plan, actual }} projection={false} />`,
    node: (
      <BurnChart
        data={{ plan: PLAN, actual: ACTUAL }}
        projection={false}
        summary={false}
        width={170}
        height={26}
      />
    ),
  },
  {
    label: "burn-up toward scope",
    code: `<BurnChart data={{ plan, actual }} mode="up" />`,
    node: (
      <BurnChart
        data={{ plan: PLAN.map((v) => 40 - v), actual: ACTUAL.map((v) => 40 - v) }}
        mode="up"
        summary={false}
        width={170}
        height={26}
      />
    ),
  },
];

const CTX_ROWS = [
  { name: "Sprint 12", meta: "on track", data: burnFromStatus("on track") },
  { name: "Sprint 11", meta: "slipped", data: burnFromStatus("slipped") },
  { name: "Sprint 10", meta: "early", data: burnFromStatus("early") },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Sprint 12 burndown{" "}
        <span className="mc-inline">
          <BurnChart data={{ plan: PLAN, actual: ACTUAL }} height={16} summary={false} />
        </span>{" "}
        — on track, 18 points left with 4 days to go.
      </p>
    ),
    code: "<p>\n  Sprint 12 burndown <BurnChart data={{ plan, actual }} /> — on track, 18 points left with 4 days to go.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <BurnChart data={row.data} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <BurnChart data={{ plan, actual }} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Sprint 12</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">18</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">points remaining</span>
          </div>
        </div>
        <BurnChart data={{ plan: PLAN, actual: ACTUAL }} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">18</span>\n  <span className="unit">points remaining</span>\n  <BurnChart data={{ plan, actual }} />\n</div>',
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
            <BurnChart data={row.data} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Sprint 12 <BurnChart data={{ plan, actual }} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const total = Math.max(6, props.data.length);
  const plan = Array.from({ length: total }, (_, k) => Math.max(0, total - k) * 4);
  const actual = props.data
    .slice(0, Math.ceil(total / 2))
    .map((v, k) => Math.max(0, (total - k * 0.7) * 4 + (Math.abs(v) % 3)));
  return (
    <BurnChart
      data={{ plan, actual }}
      label="none"
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<BurnChart data={{ plan, actual }} />`;
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
