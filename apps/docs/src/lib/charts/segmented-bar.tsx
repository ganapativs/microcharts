import { SegmentedBar } from "@microcharts/react/segmented-bar";
import { InteractiveDemo } from "./segmented-bar.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 20 },
];

export const entry: ChartEntry = {
  name: "SegmentedBar",
  slug: "segmented-bar",
  status: "stable",
  collection: "core",
  tagline: "What is this made of, and in what proportions.",
  staticImport: `${PKG}/segmented-bar`,
  interactiveImport: `${PKG}/segmented-bar/interactive`,
  dataShape: "{ label, value }[] (parts of a whole)",
  encoding: { channel: "segment length in a fixed bar", precision: "medium-high" },
  nodeBudget: "≤ 6 + labels",
  bestFor: ["traffic mix per row", "composition in cards"],
  avoidFor: ["comparing across rows precisely (MiniBar)", "negative parts (Waterfall)"],
  props: [
    {
      name: "data",
      type: "{ label; value }[]",
      required: true,
      description: "Parts of the whole.",
    },
    {
      name: "maxSegments",
      type: "number",
      required: false,
      description: "Rollup threshold — the tail becomes a labeled Other.",
    },
    {
      name: "order",
      type: '"data" | "desc"',
      required: false,
      description: "Preserve inherent sequences or rank the composition.",
    },
    {
      name: "label",
      type: '"none" | "percent" | "value"',
      required: false,
      description: "Centered per segment (deterministic drop-out).",
    },
  ],
  demo: MIX.map((d) => d.value),
  example: {
    title: "Browser share",
    code: `import { SegmentedBar } from "${PKG}/segmented-bar";\n\n<SegmentedBar data={mix} title="Browser share" />`,
  },
};

export function Preview() {
  return <SegmentedBar data={MIX} summary={false} width={130} height={16} />;
}

export const showcase = {
  hint: "composition",
  Node: () => <SegmentedBar data={MIX} title="Browser share" width={130} height={16} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["none", "percent", "value"],
      init: "none",
    },
    { kind: "segmented", key: "order", label: "order", options: ["data", "desc"], init: "data" },
    { kind: "range", key: "maxSegments", label: "max segments", min: 2, max: 5, init: 5 },
  ],
  render: (s) => (
    <SegmentedBar
      data={MIX}
      label={s.label as "none" | "percent" | "value"}
      order={s.order as "data" | "desc"}
      maxSegments={s.maxSegments as number}
      summary={false}
      width={260}
      height={22}
    />
  ),
  code: (s) =>
    [
      "<SegmentedBar",
      "  data={mix}",
      s.label !== "none" && `  label="${s.label}"`,
      s.order !== "data" && `  order="${s.order}"`,
      s.maxSegments !== 5 && `  maxSegments={${s.maxSegments}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<SegmentedBar data={row.mix} width={60} height={10} />`,
    node: <SegmentedBar data={MIX} summary={false} width={60} height={10} />,
  },
  {
    label: "with percents",
    code: `<SegmentedBar data={mix} label="percent" style={{ width: 160 }} />`,
    node: <SegmentedBar data={MIX} label="percent" summary={false} width={160} height={14} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <SegmentedBar
      data={props.data.slice(0, 4).map((v, i) => ({ label: `c${i + 1}`, value: v }))}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 10}
    />
  );
}

export function markCode(): string {
  return `<SegmentedBar data={mix} />`;
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
