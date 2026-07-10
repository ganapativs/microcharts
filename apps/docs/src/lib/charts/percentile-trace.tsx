import { PercentileTrace } from "@microcharts/react/percentile-trace";
import { InteractiveDemo } from "./percentile-trace.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

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
  dataShape: "number[] — percentile ranks 0–100, one per reading",
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
      name: "bands",
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
  ],
  demo: DEMO,
  example: {
    title: "Standing",
    code: `import { PercentileTrace } from "${PKG}/percentile-trace";\n\n<PercentileTrace data={ranks} unit="week" title="Standing" />`,
  },
};

export function Preview() {
  return <PercentileTrace data={DEMO} summary={false} width={150} height={26} />;
}

export const showcase = {
  hint: "rank drift",
  Node: () => <PercentileTrace data={DEMO} unit="week" title="Standing" width={150} height={26} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "bands", label: "bands", init: true },
    { kind: "segmented", key: "positive", label: "good is", options: ["up", "down"], init: "up" },
  ],
  render: (s) => (
    <PercentileTrace
      data={DEMO}
      bands={s.bands as boolean}
      positive={s.positive as "up" | "down"}
      unit="week"
      summary={false}
      width={280}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<PercentileTrace",
      "  data={ranks}",
      s.bands === false && "  bands={false}",
      s.positive !== "up" && `  positive="${s.positive}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "without population bands",
    code: `<PercentileTrace data={ranks} bands={false} />`,
    node: <PercentileTrace data={DEMO} bands={false} summary={false} width={170} height={26} />,
  },
  {
    label: "a slipping standing (down is good)",
    code: `<PercentileTrace data={ranks} positive="down" />`,
    node: <PercentileTrace data={FALL} positive="down" summary={false} width={170} height={26} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const norm = props.data.map((v, j) => Math.min(94, 22 + j * 6 + (Math.abs(v) % 5) * 2));
  return (
    <PercentileTrace
      data={norm}
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
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
