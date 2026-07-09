import { MinimapStrip } from "@microcharts/react/minimap-strip";
import { InteractiveDemo } from "./minimap-strip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
export const CONTENT = Array.from(
  { length: 1200 },
  (_, i) => Math.abs(Math.sin(i / 40)) + Math.abs(Math.sin(i / 150)) * 0.6,
);
export const DATA = {
  content: CONTENT,
  window: [520, 660] as [number, number],
  marks: [100, 600, 1100],
  known: [[0, 1104]] as [number, number][],
};

export const entry: ChartEntry = {
  name: "MinimapStrip",
  slug: "minimap-strip",
  status: "stable",
  collection: "frontier",
  tagline: "Where am I in the whole — and where in the whole is everything else I care about.",
  staticImport: `${PKG}/minimap-strip`,
  interactiveImport: `${PKG}/minimap-strip/interactive`,
  dataShape: "{ content, window, marks?, known? }",
  encoding: { channel: "position (window + marks along the extent)", precision: "high / low" },
  nodeBudget: "≤ 5",
  bestFor: ["document / log position", "long-timeline navigation"],
  avoidFor: ["a single value (Progress)", "exact content values (Sparkline)"],
  props: [
    {
      name: "data",
      type: "{ content, window, marks?, known? }",
      required: true,
      description: "Density series, viewport, ticks, covered regions.",
    },
    {
      name: "variant",
      type: '"bars" | "heat"',
      required: false,
      description: "Heat is a calmer opacity strip.",
    },
    {
      name: "markLane",
      type: "boolean",
      required: false,
      description: "Dedicated tick lane vs overlaying ticks.",
    },
  ],
  demo: [12],
  example: {
    title: "Document position",
    code: `import { MinimapStrip } from "${PKG}/minimap-strip";\n\n<MinimapStrip data={{ content, window: [520, 660], marks, known }} title="Document position" />`,
  },
};

export function Preview() {
  return <MinimapStrip data={DATA} summary={false} width={130} height={16} />;
}

export const showcase = {
  hint: "position",
  Node: () => <MinimapStrip data={DATA} title="Document position" width={130} height={16} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "variant",
      label: "variant",
      options: ["bars", "heat"],
      init: "bars",
    },
    { kind: "toggle", key: "markLane", label: "mark lane", init: true },
    { kind: "range", key: "window", label: "window at", min: 0, max: 1060, step: 20, init: 520 },
  ],
  render: (s) => (
    <MinimapStrip
      data={{ ...DATA, window: [s.window as number, (s.window as number) + 140] }}
      variant={s.variant as "bars" | "heat"}
      markLane={s.markLane as boolean}
      summary={false}
      width={320}
      height={20}
    />
  ),
  code: (s) =>
    [
      "<MinimapStrip",
      `  data={{ content, window: [${s.window}, ${(s.window as number) + 140}], marks, known }}`,
      s.variant !== "bars" && `  variant="${s.variant}"`,
      s.markLane === false && "  markLane={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "log viewer cell",
    code: `<MinimapStrip data={{ content, window }} width={80} height={12} />`,
    node: <MinimapStrip data={DATA} summary={false} width={80} height={12} />,
  },
  {
    label: "heat",
    code: `<MinimapStrip data={data} variant="heat" />`,
    node: <MinimapStrip data={DATA} variant="heat" summary={false} width={220} height={16} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <MinimapStrip
      data={DATA}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 12}
    />
  );
}

export function markCode(): string {
  return `<MinimapStrip data={{ content, window, marks, known }} />`;
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
