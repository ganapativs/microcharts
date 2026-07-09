import { WindBarb } from "@microcharts/react/wind-barb";
import { InteractiveDemo } from "./wind-barb.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "WindBarb",
  slug: "wind-barb",
  status: "stable",
  collection: "frontier",
  tagline: "Which way it's flowing and roughly how hard — in one character.",
  staticImport: `${PKG}/wind-barb`,
  dataShape: "{ direction, magnitude }",
  encoding: { channel: "shaft angle + quantized barb count", precision: "medium" },
  nodeBudget: "≤ 3",
  bestFor: ["wind / current direction + strength", "traffic flow, net migration, request routing"],
  avoidFor: ["exact magnitude (label it)", "a time series (Sparkline)"],
  props: [
    {
      name: "direction",
      type: "number",
      required: true,
      description: "Degrees; 0 = up/north, clockwise.",
    },
    {
      name: "magnitude",
      type: "number",
      required: true,
      description: "Any unit; quantized into barbs.",
    },
    {
      name: "step",
      type: "number",
      required: false,
      description: "Full-barb quantum (each barb = step).",
    },
    {
      name: "label",
      type: "boolean",
      required: false,
      description: "Numeric magnitude beside the glyph.",
    },
  ],
  demo: [32],
  example: {
    title: "Wind",
    code: `import { WindBarb } from "${PKG}/wind-barb";\n\n<WindBarb direction={225} magnitude={32} step={10} title="Wind" />`,
  },
};

export function Preview() {
  return <WindBarb direction={225} magnitude={32} summary={false} size={28} />;
}

export const showcase = {
  hint: "flow",
  Node: () => <WindBarb direction={225} magnitude={32} label title="Wind" size={28} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "range",
      key: "direction",
      label: "direction °",
      min: 0,
      max: 359,
      step: 15,
      init: 225,
    },
    { kind: "range", key: "magnitude", label: "magnitude", min: 0, max: 90, init: 32 },
    { kind: "range", key: "step", label: "each barb =", min: 5, max: 20, step: 5, init: 10 },
    { kind: "toggle", key: "label", label: "label", init: false },
  ],
  render: (s) => (
    <WindBarb
      direction={s.direction as number}
      magnitude={s.magnitude as number}
      step={s.step as number}
      label={s.label as boolean}
      summary={false}
      size={64}
    />
  ),
  code: (s) =>
    [
      "<WindBarb",
      `  direction={${s.direction}}`,
      `  magnitude={${s.magnitude}}`,
      s.step !== 10 && `  step={${s.step}}`,
      s.label === true && "  label",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<WindBarb direction={row.dir} magnitude={row.speed} size={18} />`,
    node: <WindBarb direction={225} magnitude={32} summary={false} size={18} />,
  },
  {
    label: "with label",
    code: `<WindBarb direction={45} magnitude={25} label />`,
    node: <WindBarb direction={45} magnitude={25} label summary={false} size={28} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <WindBarb
      direction={225}
      magnitude={Math.abs(props.data[0] ?? 32) || 32}
      summary={false}
      size={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<WindBarb direction={225} magnitude={32} />`;
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
