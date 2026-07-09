import { Thermometer } from "@microcharts/react/thermometer";
import { InteractiveDemo } from "./thermometer.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "Thermometer",
  slug: "thermometer",
  status: "stable",
  collection: "expressive",
  tagline: "Where a value sits on a calibrated range, and how close to the goal.",
  staticImport: `${PKG}/thermometer`,
  interactiveImport: `${PKG}/thermometer/interactive`,
  dataShape: "{ value: number; target?: number }",
  encoding: { channel: "column extent on a ticked calibrated scale", precision: "high" },
  nodeBudget: "≤ 6",
  bestFor: [
    "a fundraising or goal progress read",
    "a capacity or utilization gauge in a cell",
    "any value against a stated range",
  ],
  avoidFor: ["trends (Sparkline)", "proportions of a whole (SegmentedBar)", "many series"],
  props: [
    { name: "value", type: "number", required: true, description: "The reading." },
    {
      name: "target",
      type: "number",
      required: false,
      description: "A goal tick across the tube.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "The calibrated range (default [0, 100]).",
    },
    {
      name: "ticks",
      type: "number | number[]",
      required: false,
      description: "Tick count or explicit values.",
    },
    {
      name: "orientation",
      type: '"vertical" | "horizontal"',
      required: false,
      description: "Horizontal fits table cells.",
    },
    {
      name: "bulb",
      type: "boolean",
      required: false,
      description: "Draw the reservoir bulb (default true).",
    },
  ],
  demo: [72],
  example: {
    title: "Fundraiser",
    code: `import { Thermometer } from "${PKG}/thermometer";\n\n<Thermometer value={72} target={80} title="Fundraiser" />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-end gap-3">
      <Thermometer value={72} target={80} summary={false} />
      <Thermometer value={40} summary={false} />
      <Thermometer value={95} summary={false} />
    </span>
  );
}

export const showcase = {
  hint: "toward the goal",
  Node: () => <Thermometer value={72} target={80} title="Fundraiser" height={52} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value", min: 0, max: 100, step: 1, init: 72 },
    { kind: "range", key: "target", label: "target", min: 0, max: 100, step: 5, init: 80 },
    {
      kind: "segmented",
      key: "orientation",
      label: "orientation",
      options: ["vertical", "horizontal"],
      init: "vertical",
    },
    { kind: "toggle", key: "bulb", label: "bulb", init: true },
  ],
  render: (s) => (
    <Thermometer
      value={s.value as number}
      target={s.target as number}
      orientation={s.orientation as "vertical" | "horizontal"}
      bulb={s.bulb as boolean}
      summary={false}
      {...(s.orientation === "horizontal" ? { width: 120 } : { height: 72 })}
    />
  ),
  code: (s) =>
    [
      "<Thermometer",
      `  value={${s.value}}`,
      `  target={${s.target}}`,
      s.orientation !== "vertical" && `  orientation="${s.orientation}"`,
      s.bulb === false && "  bulb={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "horizontal, in a table cell",
    code: `<Thermometer value={62} orientation="horizontal" bulb={false} />`,
    node: (
      <Thermometer value={62} orientation="horizontal" bulb={false} summary={false} width={110} />
    ),
  },
  {
    label: "explicit calibration ticks",
    code: `<Thermometer value={72} domain={[32, 100]} ticks={[32, 50, 68, 86, 100]} />`,
    node: (
      <Thermometer
        value={72}
        domain={[32, 100]}
        ticks={[32, 50, 68, 86, 100]}
        summary={false}
        height={64}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? Math.abs(props.data[0]!) % 100 : 72;
  return <Thermometer value={v} target={80} summary={false} height={props.height ?? 40} />;
}

export function markCode(): string {
  return `<Thermometer value={72} target={80} />`;
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
