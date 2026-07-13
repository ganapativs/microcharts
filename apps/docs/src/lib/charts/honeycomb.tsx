import { Honeycomb } from "@microcharts/react/honeycomb";
import { Honeycomb as HoneycombInteractive } from "@microcharts/react/honeycomb/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "Honeycomb",
  slug: "honeycomb",
  status: "stable",
  collection: "expressive",
  tagline: "How many of the available slots are taken.",
  staticImport: `${PKG}/honeycomb`,
  interactiveImport: `${PKG}/honeycomb/interactive`,
  dataShape: "{ value: number; total: number }",
  encoding: { channel: "filled-cell count in a hex grid (unit counting)", precision: "high" },
  nodeBudget: "2",
  bestFor: [
    "seats or licenses taken of a capacity",
    "an occupancy read in a KPI card",
    "a countable of-total in a cell (strip mode)",
  ],
  avoidFor: ["a capacity over ~60 (Progress)", "a magnitude with no total (MiniBar)", "trends"],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "Filled count (fractional rounds).",
    },
    {
      name: "total",
      type: "number",
      required: false,
      description: "Capacity = cell count (default 10).",
    },
    {
      name: "rows",
      type: 'number | "auto"',
      required: false,
      description: "auto (near-square) or a number; 1 = strip.",
    },
    {
      name: "empty",
      type: '"outline" | "blank"',
      required: false,
      description: "How empty cells render (default outline).",
    },
  ],
  demo: [34],
  example: {
    title: "Occupancy",
    code: `import { Honeycomb } from "${PKG}/honeycomb";\n\n<Honeycomb value={34} total={40} unit="seats" title="Occupancy" />`,
  },
};

export function Preview() {
  return <Honeycomb value={34} total={40} unit="seats" summary={false} cell={4} />;
}

export const showcase = {
  hint: "of capacity",
  Node: () => <Honeycomb value={34} total={40} unit="seats" title="Occupancy" cell={5} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "filled", min: 0, max: 40, step: 1, init: 28 },
    { kind: "range", key: "total", label: "total", min: 4, max: 40, step: 1, init: 40 },
    {
      kind: "segmented",
      key: "empty",
      label: "empty",
      options: ["outline", "blank"],
      init: "outline",
    },
  ],
  render: (s) => (
    <Honeycomb
      value={s.value as number}
      total={s.total as number}
      empty={s.empty as "outline" | "blank"}
      unit="seats"
      summary={false}
      cell={7}
    />
  ),
  code: (s) =>
    [
      "<Honeycomb",
      `  value={${s.value}}`,
      `  total={${s.total}}`,
      s.empty !== "outline" && `  empty="${s.empty}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <HoneycombInteractive
      value={s.value as number}
      total={s.total as number}
      empty={s.empty as "outline" | "blank"}
      unit="seats"
      summary={false}
      animate={ui.animate}
      cell={7}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Honeycomb",
      `  value={${s.value}}`,
      `  total={${s.total}}`,
      s.empty !== "outline" && `  empty="${s.empty}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Tap to take another seat — the new count fills a cell and is announced through a polite live region. Hover reveals the value / total. The cells are anonymous units, so there is no per-cell cursor.",
};

export const recipes: Recipe[] = [
  {
    label: "strip mode for a table cell",
    code: `<Honeycomb value={7} total={10} rows={1} />`,
    node: <Honeycomb value={7} total={10} rows={1} summary={false} cell={5} />,
  },
  {
    label: "blank empties for a quieter, uncluttered surface",
    code: `<Honeycomb value={28} total={40} empty="blank" />`,
    node: <Honeycomb value={28} total={40} empty="blank" summary={false} cell={4} />,
  },
];

const CTX_ROWS = [
  { name: "Room A", meta: "34/40", data: [24, 26, 27, 29, 30, 31, 33, 34] },
  { name: "Room B", meta: "28/40", data: [20, 21, 22, 24, 25, 26, 27, 28] },
  { name: "Room C", meta: "12/40", data: [9, 9, 10, 10, 11, 11, 12, 12] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Seat occupancy{" "}
        <span className="mc-inline">
          <Honeycomb value={34} total={40} unit="seats" cell={8} summary={false} />
        </span>{" "}
        — 34 of 40 taken, one row left.
      </p>
    ),
    code: "<p>\n  Seat occupancy <Honeycomb value={34} total={40} /> — 34 of 40 taken, one row left.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <Honeycomb value={34} total={40} unit="seats" cell={9} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <Honeycomb value={34} total={40} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Occupancy</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">34/40</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">seats taken</span>
          </div>
        </div>
        <Honeycomb value={34} total={40} unit="seats" cell={12} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">34/40</span>\n  <span className="unit">seats taken</span>\n  <Honeycomb value={34} total={40} />\n</div>',
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
            <Honeycomb value={34} total={40} unit="seats" cell={7} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Room A <Honeycomb value={34} total={40} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? Math.abs(Math.round(props.data[0]!)) % 40 : 28;
  return (
    <Honeycomb value={v} total={40} summary={false} cell={props.height ? props.height / 6 : 3} />
  );
}

export function markCode(): string {
  return `<Honeycomb value={34} total={40} />`;
}

export function PreviewLive() {
  return (
    <HoneycombInteractive value={34} total={40} unit="seats" summary={false} cell={4} animate />
  );
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
