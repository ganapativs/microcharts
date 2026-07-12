import { BurnChart } from "@microcharts/react/burn-chart";
import { BurnChart as BurnChartInteractive } from "@microcharts/react/burn-chart/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

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
  dataShape: "{ plan: number[]; actual: number[] } — remaining work per period",
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

export const showcase = {
  hint: "plan vs actual",
  Node: () => (
    <BurnChart data={{ plan: PLAN, actual: ACTUAL }} title="Sprint 12" width={150} height={26} />
  ),
};

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
  renderInteractive: (s, _data, ui) => {
    const up = s.mode === "up";
    const plan = up ? PLAN.map((v) => 40 - v) : PLAN;
    const actual = up ? ACTUAL.map((v) => 40 - v) : ACTUAL;
    return (
      <BurnChartInteractive
        data={{ plan, actual }}
        mode={s.mode as "down" | "up"}
        projection={s.projection as boolean}
        label={s.label as "gap" | "none"}
        animate={ui.animate}
        summary={false}
        width={280}
        height={30}
      />
    );
  },
  codeInteractive: (s, _data, ui) =>
    [
      "<BurnChart",
      "  data={{ plan, actual }}",
      s.mode !== "down" && `  mode="${s.mode}"`,
      s.projection === false && "  projection={false}",
      s.label !== "gap" && `  label="${s.label}"`,
      ui.animate && " animate",
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

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const total = Math.max(6, props.data.length);
  const plan = Array.from({ length: total }, (_, k) => Math.max(0, total - k) * 4);
  const actual = props.data
    .slice(0, Math.ceil(total / 2))
    .map((v, k) => Math.max(0, (total - k * 0.7) * 4 + (Math.abs(v) % 3)));
  return (
    <BurnChart
      data={{ plan, actual }}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<BurnChart data={{ plan, actual }} />`;
}

export function PreviewLive() {
  return (
    <BurnChartInteractive
      data={{ plan: PLAN, actual: ACTUAL }}
      summary={false}
      width={150}
      height={26}
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
  Mark,
  markCode,
} satisfies ChartModule;
