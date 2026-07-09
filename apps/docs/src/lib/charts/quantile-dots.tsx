import { QuantileDots } from "@microcharts/react/quantile-dots";
import { InteractiveDemo } from "./quantile-dots.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

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
  tagline: "What are the odds — in countable form?",
  staticImport: `${PKG}/quantile-dots`,
  interactiveImport: `${PKG}/quantile-dots/interactive`,
  dataShape: "number[] — raw sample or posterior draws",
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

export const showcase = {
  hint: "odds you can count",
  Node: () => (
    <QuantileDots
      data={WAITS}
      threshold={15}
      format={MIN_FMT}
      title="Bus wait"
      width={150}
      height={24}
    />
  ),
};

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

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <QuantileDots
      data={props.data.map((v) => 4 + (Math.abs(v) % 20))}
      threshold={14}
      count={16}
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
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
