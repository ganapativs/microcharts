import { RateVolume } from "@microcharts/react/rate-volume";
import { RateVolume as RateVolumeInteractive } from "@microcharts/react/rate-volume/interactive";
import { InteractiveDemo } from "./rate-volume.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
// a conversion rate climbing as reach drains away — the last reading is a big
// rate on a thin denominator (the exact case this type keeps honest)
export const DEMO = [
  { rate: 2.3, volume: 220 },
  { rate: 2.5, volume: 190 },
  { rate: 2.8, volume: 160 },
  { rate: 2.9, volume: 130 },
  { rate: 3.1, volume: 110 },
  { rate: 3.4, volume: 90 },
  { rate: 3.6, volume: 66 },
  { rate: 4.1, volume: 38 },
];
const PCT = { style: "percent", maximumFractionDigits: 1 } as const;
// the rates as fractions so percent formatting reads them (2.3% → 0.023)
const FRAC = DEMO.map((d) => ({ rate: d.rate / 100, volume: d.volume }));

export const entry: ChartEntry = {
  name: "RateVolume",
  slug: "rate-volume",
  status: "stable",
  collection: "decision",
  tagline: "The rate moved — on what volume?",
  staticImport: `${PKG}/rate-volume`,
  interactiveImport: `${PKG}/rate-volume/interactive`,
  dataShape: "{ rate, volume }[] per period, oldest first",
  encoding: {
    channel: "line position (rate) over zero-anchored ghost bars (volume)",
    precision: "high for rate, low-deliberate for volume",
  },
  nodeBudget: "1 per bar + ≤ 5",
  bestFor: [
    "a conversion / error rate with its denominator",
    "a KPI card where the rate is the headline",
    "spotting a big rate move on thin volume",
  ],
  avoidFor: [
    "volume itself needing a precise read (pair a SparkBar)",
    "a plain series (Sparkline)",
  ],
  props: [
    {
      name: "data",
      type: "{ rate; volume }[]",
      required: true,
      description: "Periods, oldest first — each a rate and the volume it was measured on.",
    },
    {
      name: "minVolume",
      type: "number",
      required: false,
      description: "Below it, the rate mark renders hollow — 'insufficient denominator'.",
    },
    {
      name: "curve",
      type: '"linear" | "step"',
      required: false,
      description: "Step suits per-period aggregate rates.",
    },
    {
      name: "volumeFormat",
      type: "Intl.NumberFormatOptions | (n) => string",
      required: false,
      description: "Volume has different units than rate; formatted separately.",
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Endpoint rate in a right gutter.",
    },
  ],
  demo: DEMO.map((d) => d.rate),
  example: {
    title: "Conversion rate",
    code: `import { RateVolume } from "${PKG}/rate-volume";\n\n<RateVolume data={periods} minVolume={50} title="Conversion rate" />`,
  },
  sampleData: [
    {
      name: "periods",
      code: `const periods = [
  { rate: 0.023, volume: 220 }, { rate: 0.025, volume: 190 }, { rate: 0.028, volume: 160 },
  { rate: 0.029, volume: 130 }, { rate: 0.031, volume: 110 }, { rate: 0.034, volume: 90 },
  { rate: 0.036, volume: 66 }, { rate: 0.041, volume: 38 },
];`,
    },
  ],
};

export function Preview() {
  return <RateVolume data={FRAC} format={PCT} summary={false} width={150} height={26} />;
}

export const showcase = {
  hint: "rate on volume",
  Node: () => (
    <RateVolume
      data={FRAC}
      format={PCT}
      minVolume={50}
      title="Conversion rate"
      width={150}
      height={26}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "minVolume", label: "flag low volume", init: true },
    {
      kind: "segmented",
      key: "curve",
      label: "curve",
      options: ["linear", "step"],
      init: "linear",
    },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["none", "last"],
      init: "last",
    },
  ],
  render: (s) => (
    <RateVolume
      data={FRAC}
      format={PCT}
      minVolume={s.minVolume ? 50 : undefined}
      curve={s.curve as "linear" | "step"}
      label={s.label as "last" | "none"}
      summary={false}
      width={280}
      height={28}
    />
  ),
  code: (s) =>
    [
      "<RateVolume",
      "  data={periods}",
      s.minVolume && "  minVolume={50}",
      s.curve !== "linear" && `  curve="${s.curve}"`,
      s.label !== "last" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <RateVolumeInteractive
      data={FRAC}
      format={PCT}
      minVolume={s.minVolume ? 50 : undefined}
      curve={s.curve as "linear" | "step"}
      label={s.label as "last" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<RateVolume",
      "  data={periods}",
      s.minVolume && "  minVolume={50}",
      s.curve !== "linear" && `  curve="${s.curve}"`,
      s.label !== "last" && `  label="${s.label}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the periods — each announces the rate and the volume it stands on.",
};

export const recipes: Recipe[] = [
  {
    label: "flag thin denominators",
    code: `// a 4.1% rate on 38 events renders hollow — read it with caution
const periods = [
  { rate: 0.023, volume: 220 }, { rate: 0.025, volume: 190 }, { rate: 0.028, volume: 160 },
  { rate: 0.029, volume: 130 }, { rate: 0.031, volume: 110 }, { rate: 0.034, volume: 90 },
  { rate: 0.036, volume: 66 }, { rate: 0.041, volume: 38 },
];

<RateVolume data={periods} minVolume={50} />`,
    node: (
      <RateVolume data={FRAC} format={PCT} minVolume={50} summary={false} width={170} height={24} />
    ),
  },
  {
    label: "per-period step rates",
    code: `const periods = [
  { rate: 0.023, volume: 220 }, { rate: 0.025, volume: 190 }, { rate: 0.028, volume: 160 },
  { rate: 0.029, volume: 130 }, { rate: 0.031, volume: 110 }, { rate: 0.034, volume: 90 },
  { rate: 0.036, volume: 66 }, { rate: 0.041, volume: 38 },
];

<RateVolume data={periods} curve="step" />`,
    node: (
      <RateVolume data={FRAC} format={PCT} curve="step" summary={false} width={170} height={24} />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <RateVolume
      data={props.data.map((v, j) => ({ rate: v, volume: 40 + ((j * 13) % 160) }))}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<RateVolume data={periods} minVolume={50} />`;
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
