import { CometTrail } from "@microcharts/react/comet-trail";
import { InteractiveDemo } from "./comet-trail.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

const RISING = [40, 45, 50, 55, 60, 65, 70, 72, 75, 78, 80, 84, 87];

export const entry: ChartEntry = {
  name: "CometTrail",
  slug: "comet-trail",
  status: "stable",
  collection: "expressive",
  tagline: "Where the value is now, and where it has just been.",
  staticImport: `${PKG}/comet-trail`,
  interactiveImport: `${PKG}/comet-trail/interactive`,
  dataShape: "number[]",
  encoding: {
    channel: "head position (now) + opacity-fading positional trail",
    precision: "medium",
  },
  nodeBudget: "trail + 2",
  bestFor: [
    "a live price or metric with a little recency context",
    "a realtime KPI that should show momentum",
    "per-stream 'where is it now' in a table",
  ],
  avoidFor: [
    "the full history (Sparkline)",
    "an exact multi-point comparison (Sparkline / DotPlot)",
    "discrete events (HeartbeatBlip)",
  ],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "The rolling window, oldest → newest (last = now).",
    },
    {
      name: "trail",
      type: "number",
      required: false,
      description: "Points kept visible (default 12, cap 20).",
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Numeral after the head (default last).",
    },
  ],
  demo: RISING,
  example: {
    title: "Now",
    code: `import { CometTrail } from "${PKG}/comet-trail";\n\n<CometTrail data={rollingWindow} title="Latency" />`,
  },
};

export function Preview() {
  return <CometTrail data={RISING} summary={false} width={80} />;
}

export const showcase = {
  hint: "now, and just before",
  Node: () => <CometTrail data={RISING} title="Latency" width={90} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "trail", label: "trail", min: 2, max: 20, step: 1, init: 12 },
    { kind: "segmented", key: "label", label: "label", options: ["last", "none"], init: "last" },
  ],
  render: (s) => (
    <CometTrail
      data={RISING}
      trail={s.trail as number}
      label={s.label as "last" | "none"}
      summary={false}
      width={180}
    />
  ),
  code: (s) =>
    [
      "<CometTrail",
      "  data={rollingWindow}",
      s.trail !== 12 && `  trail={${s.trail}}`,
      s.label !== "last" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "shorter trail for a table cell",
    code: `<CometTrail data={window} trail={6} />`,
    node: <CometTrail data={RISING} trail={6} summary={false} width={100} />,
  },
  {
    label: "no label — the card prints the number",
    code: `<CometTrail data={window} label="none" />`,
    node: <CometTrail data={RISING} label="none" summary={false} width={100} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const vals = props.data.length ? props.data : RISING;
  return (
    <CometTrail
      data={vals}
      summary={false}
      label="none"
      width={props.width ?? 60}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<CometTrail data={rollingWindow} />`;
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
