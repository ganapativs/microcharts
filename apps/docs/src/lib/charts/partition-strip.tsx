import { PartitionStrip } from "@microcharts/react/partition-strip";
import { PartitionStrip as PartitionStripInteractive } from "@microcharts/react/partition-strip/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

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
  sampleData: [
    {
      name: "bundle",
      code: `const bundle = [
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
];`,
    },
  ],
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
      ui.animate && " animate",
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
    code: `<PartitionStrip data={bundle} labels={false} width={80} height={16} />`,
    node: <PartitionStrip data={TREE} labels={false} summary={false} width={80} height={16} />,
  },
  {
    label: "emphasis",
    code: `<PartitionStrip data={bundle} emphasis="react" />`,
    node: <PartitionStrip data={TREE} emphasis="react" summary={false} width={220} height={26} />,
  },
];

const CTX_ROWS = [
  { name: "JS", meta: "44%" },
  { name: "CSS", meta: "24%" },
  { name: "img", meta: "18%" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Bundle composition{" "}
        <span className="mc-inline">
          <PartitionStrip data={TREE} height={16} summary={false} />
        </span>{" "}
        — JS is 44% of the payload.
      </p>
    ),
    code: "<p>\n  Bundle composition <PartitionStrip data={bundle} /> — JS is 44% of the payload.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <PartitionStrip data={TREE} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <PartitionStrip data={bundle} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">JS bundle</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">44%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">of total size</span>
          </div>
        </div>
        <PartitionStrip data={TREE} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">44%</span>\n  <span className="unit">of total size</span>\n  <PartitionStrip data={bundle} />\n</div>',
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {CTX_ROWS.map((row, i) => (
          <span
            key={row.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${i === 0 ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground" : "border-fd-border text-fd-muted-foreground"}`}
          >
            {row.name}
            <PartitionStrip data={TREE} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  JS <PartitionStrip data={bundle} />\n</button>',
  },
};

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

export function PreviewLive() {
  return <PartitionStripInteractive data={TREE} summary={false} width={140} height={24} animate />;
}

export default {
  entry,
  Preview,
  PreviewLive,
  showcase,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
