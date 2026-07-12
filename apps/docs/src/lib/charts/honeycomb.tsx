import { Honeycomb } from "@microcharts/react/honeycomb";
import { Honeycomb as HoneycombInteractive } from "@microcharts/react/honeycomb/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

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
      ui.animate && "  animate",
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

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? Math.abs(Math.round(props.data[0]!)) % 40 : 28;
  return (
    <Honeycomb value={v} total={40} summary={false} cell={props.height ? props.height / 6 : 3} />
  );
}

export function markCode(): string {
  return `<Honeycomb value={34} total={40} />`;
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
