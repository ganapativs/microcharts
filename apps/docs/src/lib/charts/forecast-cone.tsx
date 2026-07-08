import { ForecastCone } from "@microcharts/react/forecast-cone";
import { InteractiveDemo } from "./forecast-cone.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

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

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const hist = props.data.slice(0, 5).map((v) => 30 + (Math.abs(v) % 10));
  const mid = [38, 40, 42];
  const p80 = mid.map((v, j) => [v - 3 - j * 2, v + 3 + j * 2] as [number, number]);
  return (
    <ForecastCone
      data={hist}
      forecast={{ mid, p80 }}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<ForecastCone data={history} forecast={forecast} />`;
}

export default {
  entry,
  Preview,
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
