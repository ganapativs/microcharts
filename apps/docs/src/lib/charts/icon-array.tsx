import { IconArray } from "@microcharts/react/icon-array";
import { IconArray as IconArrayInteractive } from "@microcharts/react/icon-array/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "IconArray",
  slug: "icon-array",
  status: "stable",
  collection: "decision",
  tagline: "How likely is this, really? — one rate, made countable.",
  staticImport: `${PKG}/icon-array`,
  interactiveImport: `${PKG}/icon-array/interactive`,
  dataShape: "value (0–1)",
  encoding: {
    channel: "count of filled units in a fixed N-unit grid",
    precision: "high — unit-countable",
  },
  nodeBudget: "1 per unit + label",
  bestFor: ["risk in a sentence", "uptake / adoption rates", "lay-audience probabilities"],
  avoidFor: ["a trend (Sparkline)", "a distribution (QuantileDots)"],
  props: [
    { name: "value", type: "number", required: true, description: "The rate, 0–1." },
    {
      name: "total",
      type: "10 | 20 | 100",
      required: false,
      description: "Denominator / grid size (default 20).",
    },
    {
      name: "label",
      type: '"ratio" | "percent" | "none"',
      required: false,
      description: '"3 in 20" (default) reads better than "15%" for lay audiences.',
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Polarity — down (fewer is better) flips the fill to the risk tone.",
    },
  ],
  demo: [3],
  example: {
    title: "Adverse events",
    code: `import { IconArray } from "${PKG}/icon-array";\n\n<IconArray value={0.15} total={20} title="Adverse events" />`,
  },
};

export function Preview() {
  return <IconArray value={0.15} total={20} summary={false} width={110} height={26} />;
}

export const showcase = {
  hint: "countable rate",
  Node: () => <IconArray value={0.15} total={20} title="Adverse events" width={120} height={28} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "pct", label: "rate %", min: 0, max: 100, step: 1, init: 15 },
    { kind: "segmented", key: "total", label: "total", options: ["10", "20", "100"], init: "20" },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["ratio", "percent", "none"],
      init: "ratio",
    },
    {
      kind: "segmented",
      key: "shape",
      label: "shape",
      options: ["square", "round", "dot"],
      init: "square",
    },
  ],
  render: (s) => {
    const total = Number(s.total) as 10 | 20 | 100;
    const tall = total === 100;
    return (
      <IconArray
        value={(s.pct as number) / 100}
        total={total}
        label={s.label as "ratio" | "percent" | "none"}
        shape={s.shape as "square" | "round" | "dot"}
        summary={false}
        width={tall ? 200 : 220}
        height={tall ? 100 : 30}
      />
    );
  },
  code: (s) =>
    [
      "<IconArray",
      `  value={${((s.pct as number) / 100).toFixed(2)}}`,
      s.total !== "20" && `  total={${s.total}}`,
      s.label !== "ratio" && `  label="${s.label}"`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => {
    const total = Number(s.total) as 10 | 20 | 100;
    const tall = total === 100;
    return (
      <IconArrayInteractive
        value={(s.pct as number) / 100}
        total={total}
        label={s.label as "ratio" | "percent" | "none"}
        shape={s.shape as "square" | "round" | "dot"}
        summary={false}
        animate={ui.animate}
        width={tall ? 200 : 220}
        height={tall ? 100 : 30}
      />
    );
  },
  codeInteractive: (s, _data, ui) =>
    [
      "<IconArray",
      `  value={${((s.pct as number) / 100).toFixed(2)}}`,
      s.total !== "20" && `  total={${s.total}}`,
      s.label !== "ratio" && `  label="${s.label}"`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow through the units — each announces the running count.",
};

export const recipes: Recipe[] = [
  {
    label: "1 in 10 framing",
    code: `<IconArray value={0.1} total={10} />`,
    node: <IconArray value={0.1} total={10} summary={false} width={110} height={26} />,
  },
  {
    label: "risk polarity",
    code: `// fewer is better → filled units read as the risk\n<IconArray value={0.15} total={20} positive="down" />`,
    node: (
      <IconArray value={0.15} total={20} positive="down" summary={false} width={110} height={26} />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <IconArray
      value={(props.data[0] ?? 3) / 20}
      total={20}
      summary={false}
      width={props.width ?? 100}
      height={props.height ?? 24}
    />
  );
}

export function markCode(): string {
  return `<IconArray value={0.15} total={20} />`;
}

export function PreviewLive() {
  return (
    <IconArrayInteractive value={0.15} total={20} summary={false} width={110} height={26} animate />
  );
}

export default {
  entry,
  Preview,
  PreviewLive,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
