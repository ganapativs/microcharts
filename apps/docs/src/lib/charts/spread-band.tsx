import { SpreadBand } from "@microcharts/react/spread-band";
import { InteractiveDemo } from "./spread-band.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const ORG = [8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24];
const PAID = [12, 12, 13, 13, 13, 14, 14, 14, 15, 15, 16, 16];
const PAIRS = ORG.map((a, i) => ({ a, b: PAID[i]! }));
const LABELS: [string, string] = ["Organic", "Paid"];

export const entry: ChartEntry = {
  name: "SpreadBand",
  slug: "spread-band",
  status: "stable",
  collection: "decision",
  tagline: "Which of two series leads, by how much, and since when.",
  staticImport: `${PKG}/spread-band`,
  interactiveImport: `${PKG}/spread-band/interactive`,
  dataShape: "data: { a, b }[] — a = subject, b = reference (null in either = gap in both)",
  encoding: {
    channel: "signed area between two lines on ONE shared scale, split at crossings",
    precision: "medium — the filled gap is the read; hover for the exact lead",
  },
  nodeBudget: "≤ 8 (2 band fills + 2 lines + crossing/endpoint dots + label)",
  bestFor: ["lead-vs-reference in KPI cards", "actual-vs-plan where the flip matters"],
  avoidFor: ["3+ series (SparkGroup)", "unpaired series or different units (never dual axes)"],
  props: [
    {
      name: "data",
      type: "{ a: number | null; b: number | null }[]",
      required: true,
      description: "Paired readings — a is the subject, b the reference.",
    },
    {
      name: "labels",
      type: "[string, string]",
      required: false,
      description: "Names the two series in the summary and label.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which lead is the good valence; down flips the fill colors.",
    },
    {
      name: "label",
      type: '"gap" | "none"',
      required: false,
      description: "Current signed gap in a right gutter (default gap).",
    },
  ],
  demo: ORG,
  example: {
    title: "Organic vs paid",
    code: `import { SpreadBand } from "${PKG}/spread-band";

const data = [
  { a: 8, b: 12 }, { a: 9, b: 12 }, { a: 11, b: 13 }, { a: 12, b: 13 },
  { a: 14, b: 13 }, { a: 15, b: 14 }, { a: 17, b: 14 }, { a: 18, b: 14 },
  { a: 20, b: 15 }, { a: 21, b: 15 }, { a: 23, b: 16 }, { a: 24, b: 16 },
];

<SpreadBand data={data} labels={["Organic", "Paid"]} title="Organic vs paid" />`,
  },
};

export function Preview() {
  return <SpreadBand data={PAIRS} labels={LABELS} summary={false} width={140} height={26} />;
}

export const showcase = {
  hint: "lead + flip",
  Node: () => (
    <SpreadBand data={PAIRS} labels={LABELS} title="Organic vs paid" width={140} height={26} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "label", label: "label", options: ["gap", "none"], init: "gap" },
    {
      kind: "segmented",
      key: "positive",
      label: "good lead",
      options: ["up", "down"],
      init: "up",
    },
  ],
  render: (s) => (
    <SpreadBand
      data={PAIRS}
      labels={LABELS}
      label={s.label as "gap" | "none"}
      positive={s.positive as "up" | "down"}
      summary={false}
      width={260}
      height={34}
    />
  ),
  code: (s) =>
    [
      "<SpreadBand",
      "  data={data}",
      '  labels={["Organic", "Paid"]}',
      s.label !== "gap" && `  label="${s.label}"`,
      s.positive !== "up" && `  positive="${s.positive}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "lead vs reference in a cell",
    code: `{rows.map((r) => (\n  <SpreadBand key={r.id} data={r.pairs} labels={["Us", "Market"]} title={r.name} />\n))}`,
    node: <SpreadBand data={PAIRS} labels={LABELS} summary={false} width={160} height={16} />,
  },
  {
    label: "actual vs plan with the gap",
    code: `<SpreadBand data={pairs} labels={["Actual", "Plan"]} label="gap" />`,
    node: (
      <SpreadBand
        data={PAIRS}
        labels={LABELS}
        label="gap"
        summary={false}
        width={170}
        height={22}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <SpreadBand
      data={props.data.map((v, i) => ({ a: v, b: v * 0.82 + i * 0.4 }))}
      labels={LABELS}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 14}
    />
  );
}

export function markCode(): string {
  return `<SpreadBand data={pairs} labels={["Organic", "Paid"]} />`;
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
