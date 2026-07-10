import { TapeGauge } from "@microcharts/react/tape-gauge";
import { InteractiveDemo } from "./tape-gauge.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
export const ZONES = [
  { from: 100, to: 130, tone: "pos" as const },
  { from: 130, to: 150, tone: "warn" as const },
  { from: 150, to: 200, tone: "neg" as const },
];

export const entry: ChartEntry = {
  name: "TapeGauge",
  slug: "tape-gauge",
  status: "stable",
  collection: "frontier",
  tagline:
    "The level now, the zone it's in, and how fast it's moving — with the eye parked in one place.",
  staticImport: `${PKG}/tape-gauge`,
  interactiveImport: `${PKG}/tape-gauge/interactive`,
  dataShape: "value: number, rate?: number, zones?: { from, to, tone }[]",
  encoding: {
    channel: "position on a moving scale = level; chevron count = rate (a separate channel)",
    precision: "high",
  },
  nodeBudget: "1 pointer + 1 tick path + ≤4 zone rects",
  bestFor: [
    "a live changing reading (airspeed, throughput, temp)",
    "value + trend + safe/caution band at a glance",
  ],
  avoidFor: ["a history you want to scan (Sparkline)", "a single static number (Delta)"],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "The current level; parked at the pointer.",
    },
    {
      name: "rate",
      type: "number",
      required: false,
      description: "Signed units/tick; drives the chevrons.",
    },
    {
      name: "zones",
      type: "{ from, to, tone }[]",
      required: false,
      description: "Semantic bands on the scale.",
    },
    {
      name: "span",
      type: "number",
      required: false,
      description: "Visible scale extent; fixed while live.",
    },
    {
      name: "orientation",
      type: '"vertical" | "horizontal"',
      required: false,
      description: "Tape direction (default vertical).",
    },
  ],
  demo: [142],
  example: {
    title: "Airspeed",
    code: `import { TapeGauge } from "${PKG}/tape-gauge";\n\n<TapeGauge value={142} rate={1} zones={zones} title="Airspeed" />`,
  },
};

export function Preview() {
  return <TapeGauge value={142} rate={1} zones={ZONES} summary={false} width={46} height={60} />;
}

export const showcase = {
  hint: "rising into caution",
  Node: () => (
    <TapeGauge value={142} rate={1} zones={ZONES} title="Airspeed" width={46} height={60} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value", min: 100, max: 200, step: 1, init: 142 },
    { kind: "range", key: "rate", label: "rate", min: -3, max: 3, step: 1, init: 1 },
    {
      kind: "segmented",
      key: "orientation",
      label: "orientation",
      options: ["vertical", "horizontal"],
      init: "vertical",
    },
  ],
  render: (s) => {
    const vertical = s.orientation !== "horizontal";
    return (
      <TapeGauge
        value={s.value as number}
        rate={s.rate as number}
        zones={ZONES}
        span={60}
        orientation={s.orientation as "vertical" | "horizontal"}
        summary={false}
        width={vertical ? 28 : 160}
        height={vertical ? 72 : 32}
      />
    );
  },
  code: (s) =>
    [
      "<TapeGauge",
      `  value={${s.value}}`,
      s.rate !== 0 && `  rate={${s.rate}}`,
      "  zones={zones}",
      s.orientation !== "vertical" && `  orientation="${s.orientation}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "KPI card",
    code: `<TapeGauge value={142} rate={1} zones={zones} title="Airspeed" />`,
    node: <TapeGauge value={142} rate={1} zones={ZONES} summary={false} width={46} height={68} />,
  },
  {
    label: "horizontal cell",
    code: `<TapeGauge value={142} rate={-1} zones={zones} orientation="horizontal" />`,
    node: (
      <TapeGauge
        value={142}
        rate={-1}
        zones={ZONES}
        orientation="horizontal"
        summary={false}
        width={140}
        height={28}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <TapeGauge
      value={props.data[0] ?? 142}
      rate={1}
      zones={ZONES}
      summary={false}
      width={props.width ?? 28}
      height={props.height ?? 48}
    />
  );
}

export function markCode(): string {
  return `<TapeGauge value={142} rate={1} zones={zones} />`;
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
