import { FoldedDayBand } from "@microcharts/react/folded-day-band";
import { FoldedDayBand as FoldedDayBandInteractive } from "@microcharts/react/folded-day-band/interactive";
import { InteractiveDemo } from "./folded-day-band.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const curve = (h: number) => 40 + 42 * Math.max(0, 1 - Math.abs(h - 14) / 10);
export const DATA = Array.from({ length: 14 }, (_d, d) =>
  Array.from({ length: 24 }, (_h, h) => ({
    t: d * 24 + h,
    value: Math.round(curve(h) + Math.sin(d + h) * 8),
  })),
).flat();
export const TODAY = Array.from({ length: 24 }, (_h, h) => ({
  t: h,
  value: Math.round(curve(h) + 14),
}));

export const entry: ChartEntry = {
  name: "FoldedDayBand",
  slug: "folded-day-band",
  status: "stable",
  collection: "frontier",
  tagline: "What a typical period looks like — and whether the current one is typical.",
  staticImport: `${PKG}/folded-day-band`,
  interactiveImport: `${PKG}/folded-day-band/interactive`,
  dataShape: "{ t, value }[] (raw observations folded by t mod period)",
  encoding: { channel: "median line + percentile envelopes", precision: "medium" },
  nodeBudget: "≤ 5",
  bestFor: ["typical-day traffic / load profiles", "on-call or energy capacity"],
  avoidFor: ["a raw time series (Sparkline)", "a single period (no folding)"],
  props: [
    {
      name: "data",
      type: "{ t, value }[]",
      required: true,
      description: "Raw observations across many periods.",
    },
    {
      name: "period",
      type: "number",
      required: false,
      description: "Fold length (168 folds a week).",
    },
    {
      name: "today",
      type: "{ t, value }[]",
      required: false,
      description: "The current period overlaid.",
    },
    {
      name: "bands",
      type: "[number, number][]",
      required: false,
      description: "Percentile pairs, outermost last.",
    },
  ],
  demo: [82],
  example: {
    title: "Typical day",
    code: `import { FoldedDayBand } from "${PKG}/folded-day-band";\n\n<FoldedDayBand data={observations} today={today} title="Typical day" />`,
  },
  sampleData: [
    {
      name: "observations",
      code: `const observations = Array.from({ length: 14 }, (_d, d) =>
  Array.from({ length: 24 }, (_h, h) => ({
    t: d * 24 + h,
    value: Math.round(40 + 42 * Math.max(0, 1 - Math.abs(h - 14) / 10) + Math.sin(d + h) * 8),
  })),
).flat();`,
    },
    {
      name: "today",
      code: `const today = Array.from({ length: 24 }, (_h, h) => ({
  t: h,
  value: Math.round(40 + 42 * Math.max(0, 1 - Math.abs(h - 14) / 10) + 14),
}));`,
    },
  ],
};

export function Preview() {
  return <FoldedDayBand data={DATA} summary={false} width={140} height={32} />;
}

export const showcase = {
  hint: "typical",
  Node: () => (
    <FoldedDayBand data={DATA} today={TODAY} title="Typical day" width={140} height={32} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "today", label: "today overlay", init: true },
    { kind: "toggle", key: "single", label: "one band", init: false },
    { kind: "range", key: "bins", label: "resolution", min: 12, max: 48, step: 6, init: 24 },
  ],
  render: (s) => (
    <FoldedDayBand
      data={DATA}
      today={s.today ? TODAY : undefined}
      bands={
        s.single
          ? [[25, 75]]
          : [
              [25, 75],
              [5, 95],
            ]
      }
      bins={s.bins as number}
      summary={false}
      width={320}
      height={40}
    />
  ),
  code: (s) =>
    [
      "<FoldedDayBand",
      "  data={observations}",
      s.today === true && "  today={today}",
      s.single === true && "  bands={[[25, 75]]}",
      s.bins !== 24 && `  bins={${s.bins}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <FoldedDayBandInteractive
      data={DATA}
      today={s.today ? TODAY : undefined}
      bands={
        s.single
          ? [[25, 75]]
          : [
              [25, 75],
              [5, 95],
            ]
      }
      bins={s.bins as number}
      animate={ui.animate}
      summary={false}
      width={320}
      height={40}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<FoldedDayBand",
      "  data={observations}",
      s.today === true && "  today={today}",
      s.single === true && "  bands={[[25, 75]]}",
      s.bins !== 24 && `  bins={${s.bins}}`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or use ←/→ across the folded axis — each position announces the median and middle half.",
};

export const recipes: Recipe[] = [
  {
    label: "on-call cell",
    code: `<FoldedDayBand data={observations} width={80} height={20} />`,
    node: <FoldedDayBand data={DATA} summary={false} width={80} height={20} />,
  },
  {
    label: "now vs typical",
    code: `<FoldedDayBand data={observations} today={today} />`,
    node: <FoldedDayBand data={DATA} today={TODAY} summary={false} width={220} height={32} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <FoldedDayBand
      data={DATA}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<FoldedDayBand data={observations} />`;
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
