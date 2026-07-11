import { PartitionStrip } from "@microcharts/react/partition-strip";
import { PartitionStrip as PartitionStripInteractive } from "@microcharts/react/partition-strip/interactive";
import { InteractiveDemo } from "./partition-strip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
export const TREE = [
  {
    label: "JS",
    children: [
      { label: "react", value: 28 },
      { label: "vendor", value: 12 },
      { label: "app", value: 8 },
    ],
  },
  {
    label: "CSS",
    children: [
      { label: "tailwind", value: 16 },
      { label: "custom", value: 8 },
    ],
  },
  { label: "img", value: 18 },
  { label: "font", value: 10 },
];

export const entry: ChartEntry = {
  name: "PartitionStrip",
  slug: "partition-strip",
  status: "stable",
  collection: "frontier",
  tagline:
    "What the whole is made of — and what the big parts are made of — with parentage visible.",
  staticImport: `${PKG}/partition-strip`,
  interactiveImport: `${PKG}/partition-strip/interactive`,
  dataShape: "{ label, value?, children? }[] (two levels)",
  encoding: {
    channel: "width = share of whole, children aligned under parents",
    precision: "high / medium",
  },
  nodeBudget: "1 per segment, cap 24",
  bestFor: ["bundle / storage / budget composition", "two-level breakdowns"],
  avoidFor: ["deep hierarchies (unreadable)", "flat parts (SegmentedBar)"],
  props: [
    {
      name: "data",
      type: "{ label, value?, children? }[]",
      required: true,
      description: "Two-level hierarchy.",
    },
    {
      name: "emphasis",
      type: "string",
      required: false,
      description: "Accents one node and its lineage.",
    },
    {
      name: "labels",
      type: "boolean",
      required: false,
      description: "Parent-row labels with size drop-out.",
    },
  ],
  demo: [44, 24, 18, 10],
  example: {
    title: "Bundle composition",
    code: `import { PartitionStrip } from "${PKG}/partition-strip";\n\n<PartitionStrip data={bundle} title="Bundle composition" />`,
  },
};

export function Preview() {
  return <PartitionStrip data={TREE} summary={false} width={140} height={24} />;
}

export const showcase = {
  hint: "hierarchy",
  Node: () => <PartitionStrip data={TREE} title="Bundle composition" width={140} height={24} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "labels", label: "labels", init: true },
    {
      kind: "segmented",
      key: "emphasis",
      label: "emphasis",
      options: ["none", "JS", "react", "CSS"],
      init: "none",
    },
  ],
  render: (s) => (
    <PartitionStrip
      data={TREE}
      labels={s.labels as boolean}
      emphasis={s.emphasis === "none" ? undefined : (s.emphasis as string)}
      summary={false}
      width={320}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<PartitionStrip",
      "  data={bundle}",
      s.labels === false && "  labels={false}",
      s.emphasis !== "none" && `  emphasis="${s.emphasis}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <PartitionStripInteractive
      data={TREE}
      labels={s.labels as boolean}
      emphasis={s.emphasis === "none" ? undefined : (s.emphasis as string)}
      summary={false}
      animate={ui.animate}
      width={320}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<PartitionStrip",
      "  data={bundle}",
      s.labels === false && "  labels={false}",
      s.emphasis !== "none" && `  emphasis="${s.emphasis}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover, or use ←/→ within a row and ↑/↓ between a parent and its children — each announces its share.",
};

export const recipes: Recipe[] = [
  {
    label: "storage cell",
    code: `<PartitionStrip data={usage} labels={false} width={80} height={16} />`,
    node: <PartitionStrip data={TREE} labels={false} summary={false} width={80} height={16} />,
  },
  {
    label: "emphasis",
    code: `<PartitionStrip data={bundle} emphasis="react" />`,
    node: <PartitionStrip data={TREE} emphasis="react" summary={false} width={220} height={26} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <PartitionStrip
      data={TREE}
      labels={false}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<PartitionStrip data={bundle} />`;
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
