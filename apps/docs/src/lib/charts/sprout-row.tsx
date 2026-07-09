import { SproutRow } from "@microcharts/react/sprout-row";
import { InteractiveDemo } from "./sprout-row.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
type Row = { label: string; value: number | null }[];
const ACCTS: Row = [
  { label: "Acme", value: 3 },
  { label: "Beta", value: 2 },
  { label: "Gamma", value: 3 },
  { label: "Delta", value: 1 },
  { label: "Echo", value: 0 },
  { label: "Foxtrot", value: 2 },
];

export const entry: ChartEntry = {
  name: "SproutRow",
  slug: "sprout-row",
  status: "stable",
  collection: "expressive",
  tagline: "How mature or healthy is each item in a small set.",
  staticImport: `${PKG}/sprout-row`,
  interactiveImport: `${PKG}/sprout-row/interactive`,
  dataShape: "{ label: string; value: 0 | 1 | 2 | 3 }[]",
  encoding: { channel: "ordinal growth-stage glyph (height monotonic)", precision: "high" },
  nodeBudget: "n + 1 (+ n labels)",
  bestFor: [
    "account or project maturity across a small set",
    "a health column in a portfolio table",
    "per-item lifecycle in a KPI card",
  ],
  avoidFor: ["continuous values (MiniBar)", "trends (Sparkline)", "more than ~12 items"],
  props: [
    { name: "data", type: "{ label, value }[]", required: true, description: "value = stage 0–3." },
    {
      name: "labels",
      type: "boolean",
      required: false,
      description: "Category labels under the slots.",
    },
    {
      name: "label",
      type: '"none" | "value"',
      required: false,
      description: "Print the stage number above each glyph.",
    },
  ],
  demo: [3, 2, 3, 1, 0, 2],
  example: {
    title: "Account health",
    code: `import { SproutRow } from "${PKG}/sprout-row";\n\n<SproutRow data={accounts} title="Account health" />`,
  },
};

export function Preview() {
  return <SproutRow data={ACCTS} summary={false} height={22} />;
}

export const showcase = {
  hint: "seed → bloom",
  Node: () => <SproutRow data={ACCTS} labels title="Account health" height={30} step={22} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "labels", label: "labels", init: false },
    { kind: "toggle", key: "value", label: "stage #", init: false },
  ],
  render: (s) => (
    <SproutRow
      data={ACCTS}
      labels={s.labels as boolean}
      label={s.value ? "value" : "none"}
      summary={false}
      height={s.labels ? 34 : 26}
      step={22}
    />
  ),
  code: (s) =>
    ["<SproutRow", "  data={accounts}", s.labels && "  labels", s.value && '  label="value"', "/>"]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "with category labels",
    code: `<SproutRow data={accounts} labels />`,
    node: <SproutRow data={ACCTS} labels summary={false} height={32} step={24} />,
  },
  {
    label: "missing ≠ seed (null draws a soil tick only)",
    code: `<SproutRow data={[{ label: "A", value: 2 }, { label: "B", value: null }, { label: "C", value: 0 }]} />`,
    node: (
      <SproutRow
        data={[
          { label: "A", value: 2 },
          { label: "B", value: null },
          { label: "C", value: 0 },
        ]}
        summary={false}
        height={24}
        step={22}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const stages = props.data.length
    ? props.data.slice(0, 6).map((v, i) => ({ label: `#${i}`, value: Math.abs(Math.round(v)) % 4 }))
    : ACCTS;
  return <SproutRow data={stages} summary={false} height={props.height ?? 20} step={14} />;
}

export function markCode(): string {
  return `<SproutRow data={accounts} />`;
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
