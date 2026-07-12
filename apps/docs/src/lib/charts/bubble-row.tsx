import { BubbleRow } from "@microcharts/react/bubble-row";
import { BubbleRow as BubbleRowInteractive } from "@microcharts/react/bubble-row/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
type Row = { label: string; value: number }[];
const REGIONS: Row = [
  { label: "EMEA", value: 1240 },
  { label: "AMER", value: 890 },
  { label: "APAC", value: 560 },
  { label: "LATAM", value: 210 },
];

export const entry: ChartEntry = {
  name: "BubbleRow",
  slug: "bubble-row",
  status: "stable",
  collection: "expressive",
  tagline: "Roughly how a few magnitudes compare — for precise comparison, use MiniBar.",
  staticImport: `${PKG}/bubble-row`,
  interactiveImport: `${PKG}/bubble-row/interactive`,
  dataShape: "{ label: string; value: number }[]",
  encoding: {
    channel: "circle area (r ∝ √value)",
    precision: "low — for precise comparison, use MiniBar",
  },
  nodeBudget: "2 per bubble (n ≤ 8)",
  bestFor: [
    "a few magnitudes with physical presence in a sentence",
    "a market-size or segment impression in a KPI card",
    "an editorial callout where the number is printed too",
  ],
  avoidFor: ["precise comparison (MiniBar)", "trends (Sparkline)", "more than ~8 items"],
  props: [
    {
      name: "data",
      type: "{ label, value }[]",
      required: true,
      description: "A few non-negative magnitudes.",
    },
    {
      name: "align",
      type: '"center" | "baseline"',
      required: false,
      description: "center (specimen) or baseline (weights on a shelf).",
    },
    {
      name: "label",
      type: '"value" | "both" | "none"',
      required: false,
      description: "value (default), both, or none.",
    },
  ],
  demo: [1240, 890, 560, 210],
  example: {
    title: "Market size",
    code: `import { BubbleRow } from "${PKG}/bubble-row";\n\n<BubbleRow data={regions} title="Market size" />`,
  },
  sampleData: [
    {
      name: "regions",
      code: `const regions = [
  { label: "EMEA", value: 1240 },
  { label: "AMER", value: 890 },
  { label: "APAC", value: 560 },
  { label: "LATAM", value: 210 },
];`,
    },
  ],
};

export function Preview() {
  return <BubbleRow data={REGIONS} summary={false} height={30} />;
}

export const showcase = {
  hint: "presence, not precision",
  Node: () => <BubbleRow data={REGIONS} title="Market size" height={34} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "align",
      label: "align",
      options: ["center", "baseline"],
      init: "center",
    },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["value", "both", "none"],
      init: "value",
    },
  ],
  render: (s) => (
    <BubbleRow
      data={REGIONS}
      align={s.align as "center" | "baseline"}
      label={s.label as "value" | "both" | "none"}
      summary={false}
      height={44}
    />
  ),
  code: (s) =>
    [
      "<BubbleRow",
      "  data={regions}",
      s.align !== "center" && `  align="${s.align}"`,
      s.label !== "value" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <BubbleRowInteractive
      data={REGIONS}
      align={s.align as "center" | "baseline"}
      label={s.label as "value" | "both" | "none"}
      summary={false}
      animate={ui.animate}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<BubbleRow",
      "  data={regions}",
      s.align !== "center" && `  align="${s.align}"`,
      s.label !== "value" && `  label="${s.label}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow ←/→ across the bubbles — each announces its exact value, the number the low-precision area can't carry.",
};

export const recipes: Recipe[] = [
  {
    label: "the honesty comparison — same data as MiniBar",
    code: `<BubbleRow data={regions} />  // area: low precision\n// use MiniBar for a precise read`,
    node: <BubbleRow data={REGIONS} summary={false} height={34} />,
  },
  {
    label: "baseline align — weights on a shelf",
    code: `<BubbleRow data={regions} align="baseline" />`,
    node: <BubbleRow data={REGIONS} align="baseline" summary={false} height={36} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = (props.data.length ? props.data.slice(0, 4) : [1240, 890, 560, 210]).map((v, i) => ({
    label: `#${i}`,
    value: Math.abs(v),
  }));
  return <BubbleRow data={data} label="none" summary={false} height={props.height ?? 20} />;
}

export function markCode(): string {
  return `<BubbleRow data={regions} />`;
}

export default {
  entry,
  Preview,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
