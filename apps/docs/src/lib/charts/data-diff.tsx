import { DataDiff } from "@microcharts/react/data-diff";
import { DataDiff as DataDiffInteractive } from "@microcharts/react/data-diff/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a schema migration diff — rows added/removed per table
export const DIFF = [
  { key: "users", added: 340, removed: 120 },
  { key: "orders", added: 88, removed: 30 },
  { key: "items", added: 40, removed: 20 },
  { key: "tags", added: 24, removed: 8 },
  { key: "notes", added: 12, removed: 6 },
  { key: "flags", added: 8, removed: 3 },
];

export const entry: ChartEntry = {
  name: "DataDiff",
  slug: "data-diff",
  status: "stable",
  collection: "decision",
  tagline: "What changed between two versions?",
  staticImport: `${PKG}/data-diff`,
  interactiveImport: `${PKG}/data-diff/interactive`,
  dataShape: "{ key: string; added: number; removed: number }[]",
  encoding: {
    channel: "diverging bar length per key — removed left, added right, one symmetric scale",
    precision: "high",
  },
  nodeBudget: "2 per row + 2",
  bestFor: [
    "a table cell per dataset version",
    "a KPI card for a sync or import job",
    "any per-key added/removed audit where churn matters",
  ],
  avoidFor: ["a plain ranking (MiniBar)", "parts of a single whole (SegmentedBar)"],
  props: [
    {
      name: "data",
      type: "{ key; added; removed }[]",
      required: true,
      description: "Per-key change counts — added and removed are non-negative magnitudes.",
    },
    {
      name: "labels",
      type: "boolean",
      required: false,
      description: "In-chart key tags for standalone use (host tables carry keys by default).",
    },
    {
      name: "net",
      type: "boolean",
      required: false,
      description: "A tick at added−removed per row — a summary mark, never the two bars.",
    },
    {
      name: "sort",
      type: '"none" | "net" | "magnitude"',
      required: false,
      description: "Default 'none' keeps input order (schema order is often meaningful).",
    },
    {
      name: "label",
      type: '"totals" | "none"',
      required: false,
      description: "'totals' prints a +added / −removed footer.",
    },
  ],
  demo: DIFF.map((d) => d.added - d.removed),
  example: {
    title: "Schema diff",
    code: `import { DataDiff } from "${PKG}/data-diff";\n\n<DataDiff data={diff} title="Schema diff" />`,
  },
  sampleData: [
    {
      name: "diff",
      code: `// a schema migration diff — rows added/removed per table
const diff = [
  { key: "users", added: 340, removed: 120 },
  { key: "orders", added: 88, removed: 30 },
  { key: "items", added: 40, removed: 20 },
  { key: "tags", added: 24, removed: 8 },
  { key: "notes", added: 12, removed: 6 },
  { key: "flags", added: 8, removed: 3 },
];`,
    },
  ],
};

export function Preview() {
  return <DataDiff data={DIFF} summary={false} width={120} height={40} />;
}

export const showcase = {
  hint: "added vs removed, per key",
  Node: () => <DataDiff data={DIFF} labels title="Schema diff" width={160} height={64} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "labels", label: "labels", init: false },
    { kind: "toggle", key: "net", label: "net tick", init: false },
    {
      kind: "segmented",
      key: "sort",
      label: "sort",
      options: ["none", "net", "magnitude"],
      init: "none",
    },
    { kind: "segmented", key: "label", label: "totals", options: ["none", "totals"], init: "none" },
  ],
  render: (s) => (
    <DataDiff
      data={DIFF}
      labels={s.labels as boolean}
      net={s.net as boolean}
      sort={s.sort as "none" | "net" | "magnitude"}
      label={s.label as "totals" | "none"}
      summary={false}
      width={220}
      height={80}
    />
  ),
  code: (s) =>
    [
      "<DataDiff",
      "  data={diff}",
      s.labels && "  labels",
      s.net && "  net",
      s.sort !== "none" && `  sort="${s.sort}"`,
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <DataDiffInteractive
      data={DIFF}
      labels={s.labels as boolean}
      net={s.net as boolean}
      sort={s.sort as "none" | "net" | "magnitude"}
      label={s.label as "totals" | "none"}
      summary={false}
      animate={ui.animate}
      width={220}
      height={80}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<DataDiff",
      "  data={diff}",
      s.labels && "  labels",
      s.net && "  net",
      s.sort !== "none" && `  sort="${s.sort}"`,
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow down the rows — each announces its added, removed, and net change.",
};

export const recipes: Recipe[] = [
  {
    label: "key tags for standalone use",
    code: `<DataDiff data={diff} labels />`,
    node: <DataDiff data={DIFF} labels summary={false} width={160} height={72} />,
  },
  {
    label: "net tick + totals footer",
    code: `<DataDiff data={diff} net label="totals" />`,
    node: <DataDiff data={DIFF} net label="totals" summary={false} width={180} height={80} />,
  },
];

const CTX_ROWS = [
  { name: "users", meta: "+2 cols" },
  { name: "orders", meta: "+1 table" },
  { name: "events", meta: "−1 col" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Schema migration diff{" "}
        <span className="mc-inline">
          <DataDiff data={DIFF} labels height={16} summary={false} />
        </span>{" "}
        — 3 tables added, 1 column removed.
      </p>
    ),
    code: "<p>\n  Schema migration diff <DataDiff data={diff} /> — 3 tables added, 1 column removed.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <DataDiff data={DIFF} labels height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <DataDiff data={diff} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Schema v3</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">+3</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">tables added</span>
          </div>
        </div>
        <DataDiff data={DIFF} labels height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">+3</span>\n  <span className="unit">tables added</span>\n  <DataDiff data={diff} />\n</div>',
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
            <DataDiff data={DIFF} labels height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  users <DataDiff data={diff} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = (props.data.length ? props.data : DIFF.map((d) => d.added - d.removed))
    .slice(0, 4)
    .map((v, i) => ({ key: `k${i}`, added: 40 - i * 6, removed: Math.abs(v) % 20 }));
  return (
    <DataDiff data={data} summary={false} width={props.width ?? 70} height={props.height ?? 24} />
  );
}

export function markCode(): string {
  return `<DataDiff data={diff} />`;
}

export function PreviewLive() {
  return <DataDiffInteractive data={DIFF} summary={false} width={120} height={40} animate />;
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
