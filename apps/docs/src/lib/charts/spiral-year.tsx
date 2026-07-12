import { SpiralYear } from "@microcharts/react/spiral-year";
import { SpiralYear as SpiralYearInteractive } from "@microcharts/react/spiral-year/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

// A synthetic year with a summer peak and a winter dip.
const YEAR = Array.from({ length: 52 }, (_, i) => {
  const seasonal = Math.round(200 + 140 * Math.sin(((i - 8) / 52) * Math.PI * 2));
  return i === 29 ? 480 : seasonal;
});

export const entry: ChartEntry = {
  name: "SpiralYear",
  slug: "spiral-year",
  status: "stable",
  collection: "expressive",
  tagline: "How the year breathed — seasonality at a glance.",
  staticImport: `${PKG}/spiral-year`,
  interactiveImport: `${PKG}/spiral-year/interactive`,
  dataShape: "(number | null)[]",
  encoding: { channel: "5-step opacity of marks along a calendar spiral", precision: "low" },
  nodeBudget: "≤ 6 (merged month-tick path + ≤ 5 step paths)",
  bestFor: [
    "the seasonal shape of a year at a glance",
    "spotting a busy season or a quiet stretch",
    "a compact 'the year in one square'",
  ],
  avoidFor: [
    "reading an exact day's value (ActivityGrid / HeatStrip)",
    "a non-cyclic trend (Sparkline)",
    "more than about three years",
  ],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "One value per day or week (cadence inferred from length).",
    },
    {
      name: "steps",
      type: "3 | 5",
      required: false,
      description: "Opacity quantization (default 5).",
    },
    {
      name: "monthTicks",
      type: "boolean",
      required: false,
      description: "Faint radial month ticks (default true).",
    },
    {
      name: "mark",
      type: '"dot" | "arc"',
      required: false,
      description: "Dots (default) or short arc segments.",
    },
  ],
  demo: YEAR,
  example: {
    title: "Seasonality",
    code: `import { SpiralYear } from "${PKG}/spiral-year";\n\n<SpiralYear data={byWeek} title="Seasonality" />`,
  },
  sampleData: [
    {
      name: "byWeek",
      code: `// 52 weekly values, a summer peak in week 30
const byWeek = [
  85, 95, 107, 120, 135, 150, 166, 183, 200, 217, 234, 250, 265, 280, 293, 305, 315, 324, 331, 336,
  339, 340, 339, 336, 331, 324, 315, 305, 293, 480, 265, 250, 234, 217, 200, 183, 166, 150, 135,
  120, 107, 95, 85, 76, 69, 64, 61, 60, 61, 64, 69, 76,
];`,
    },
  ],
};

export function Preview() {
  return <SpiralYear data={YEAR} summary={false} size={40} />;
}

export const showcase = {
  hint: "the year's shape",
  Node: () => <SpiralYear data={YEAR} title="Seasonality" size={56} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "steps", label: "steps", options: ["5", "3"], init: "5" },
    { kind: "segmented", key: "mark", label: "mark", options: ["dot", "arc"], init: "dot" },
    { kind: "segmented", key: "monthTicks", label: "ticks", options: ["on", "off"], init: "on" },
  ],
  render: (s) => (
    <SpiralYear
      data={YEAR}
      steps={s.steps === "3" ? 3 : 5}
      mark={s.mark as "dot" | "arc"}
      monthTicks={s.monthTicks === "on"}
      summary={false}
      size={128}
    />
  ),
  code: (s) =>
    [
      "<SpiralYear",
      "  data={byWeek}",
      s.steps !== "5" && `  steps={${s.steps}}`,
      s.mark !== "dot" && `  mark="${s.mark}"`,
      s.monthTicks !== "on" && "  monthTicks={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <SpiralYearInteractive
      data={YEAR}
      steps={s.steps === "3" ? 3 : 5}
      mark={s.mark as "dot" | "arc"}
      monthTicks={s.monthTicks === "on"}
      animate={ui.animate}
      summary={false}
      size={128}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<SpiralYear",
      "  data={byWeek}",
      s.steps !== "5" && `  steps={${s.steps}}`,
      s.mark !== "dot" && `  mark="${s.mark}"`,
      s.monthTicks !== "on" && "  monthTicks={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover across the spiral or arrow along it week by week — each mark announces its period and value through a polite live region. Remember the channel is ordinal opacity: for an exact day, reach for ActivityGrid or HeatStrip.",
};

export const recipes: Recipe[] = [
  {
    label: "arc marks for a continuous-ribbon feel",
    code: `<SpiralYear data={byWeek} mark="arc" />`,
    node: <SpiralYear data={YEAR} mark="arc" summary={false} size={44} />,
  },
  {
    label: "three steps for the smallest sizes",
    code: `<SpiralYear data={byWeek} steps={3} />`,
    node: <SpiralYear data={YEAR} steps={3} summary={false} size={40} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const vals = props.data.length ? props.data.map((v) => Math.abs(v)) : YEAR;
  return <SpiralYear data={vals} summary={false} size={props.height ?? 20} />;
}

export function markCode(): string {
  return `<SpiralYear data={byWeek} />`;
}

export function PreviewLive() {
  return <SpiralYearInteractive data={YEAR} summary={false} size={40} animate />;
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
