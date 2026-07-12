import { QueueDepth } from "@microcharts/react/queue-depth";
import { QueueDepth as QueueDepthInteractive } from "@microcharts/react/queue-depth/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a support backlog growing through capacity (100) to 2.14× at the end
export const DATA = [42, 55, 70, 88, 96, 120, 150, 182, 214];
export const CAP = 100;

export const entry: ChartEntry = {
  name: "QueueDepth",
  slug: "queue-depth",
  status: "stable",
  collection: "decision",
  tagline: "Is the backlog draining or growing?",
  staticImport: `${PKG}/queue-depth`,
  interactiveImport: `${PKG}/queue-depth/interactive`,
  dataShape: "number[] — backlog depth per period (≥ 0)",
  encoding: {
    channel: "zero-anchored area (stock) + above-capacity spans re-stroked negative",
    precision: "high for the depth; the trend glyph is a low-precision direction cue",
  },
  nodeBudget: "≤ 7",
  bestFor: [
    "a support-queue backlog in a KPI card",
    "a work-in-progress stock vs its WIP limit",
    "will-it-drain in a tab header",
  ],
  avoidFor: ["a rate rather than a stock (Sparkline)", "a single count (Delta)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Backlog depth per period (≥ 0). null / NaN / ±Infinity are gaps.",
    },
    {
      name: "capacity",
      type: "number",
      required: false,
      description: "Steady-state capacity: a dashed hairline; spans above it re-stroke negative.",
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Endpoint value + trend glyph (▴/▾), default 'last', or nothing.",
    },
  ],
  demo: DATA,
  example: {
    title: "Support queue",
    code: `import { QueueDepth } from "${PKG}/queue-depth";\n\n<QueueDepth\n  data={[42, 55, 70, 88, 96, 120, 150, 182, 214]}\n  capacity={100}\n  title="Support queue"\n/>`,
  },
};

export function Preview() {
  return <QueueDepth data={DATA} capacity={CAP} summary={false} width={150} height={26} />;
}

export const showcase = {
  hint: "backlog vs capacity",
  Node: () => (
    <QueueDepth data={DATA} capacity={CAP} title="Support queue" width={150} height={26} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "capacity", label: "capacity", init: true },
    { kind: "segmented", key: "label", label: "label", options: ["none", "last"], init: "last" },
  ],
  render: (s) => (
    <QueueDepth
      data={DATA}
      capacity={s.capacity ? CAP : undefined}
      label={s.label as "last" | "none"}
      summary={false}
      width={280}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<QueueDepth",
      "  data={data}",
      s.capacity && "  capacity={100}",
      s.label !== "last" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <QueueDepthInteractive
      data={DATA}
      capacity={s.capacity ? CAP : undefined}
      label={s.label as "last" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<QueueDepth",
      "  data={data}",
      s.capacity && "  capacity={100}",
      s.label !== "last" && `  label="${s.label}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the periods — each announces the depth and whether it's above capacity.",
};

export const recipes: Recipe[] = [
  {
    label: "draining below capacity",
    code: `<QueueDepth data={[214, 190, 150, 120, 96, 70, 48]} capacity={100} />`,
    node: (
      <QueueDepth
        data={[214, 190, 150, 120, 96, 70, 48]}
        capacity={CAP}
        summary={false}
        width={170}
        height={26}
      />
    ),
  },
  {
    label: "no capacity reference",
    code: `<QueueDepth data={[42, 55, 70, 88, 96, 120, 150, 182, 214]} />`,
    node: <QueueDepth data={DATA} summary={false} width={170} height={26} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const depth = props.data.map((v, k) => Math.max(0, 40 + k * 12 + (Math.abs(v) % 20)));
  return (
    <QueueDepth
      data={depth}
      capacity={110}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<QueueDepth data={data} capacity={100} />`;
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
