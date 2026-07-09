import { TreeRings } from "@microcharts/react/tree-rings";
import { InteractiveDemo } from "./tree-rings.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const YEARS = [8, 12, 10, 18, 22, 15, 20, 14];

export const entry: ChartEntry = {
  name: "TreeRings",
  slug: "tree-rings",
  status: "stable",
  collection: "expressive",
  tagline: "How growth accumulated, period over period, from the centre out.",
  staticImport: `${PKG}/tree-rings`,
  interactiveImport: `${PKG}/tree-rings/interactive`,
  dataShape: "number[] (oldest first)",
  encoding: { channel: "radial ring thickness ∝ per-period value", precision: "medium" },
  nodeBudget: "n + 1 (n ≤ 24)",
  bestFor: [
    "account or company age at a glance",
    "a cohort-age marker in a table cell",
    "a per-period growth story in a KPI card",
  ],
  avoidFor: ["exact per-period reads (SparkBar)", "many periods (> 24)", "non-cumulative series"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Per-period growth, oldest first.",
    },
    {
      name: "accent",
      type: '"last" | "none" | number',
      required: false,
      description: "Which boundary to emphasize.",
    },
    {
      name: "total",
      type: "number",
      required: false,
      description: "Expected lifetime Σ — the disc fills only Σdata/total.",
    },
    {
      name: "rings",
      type: '"stroke" | "fill"',
      required: false,
      description: "Boundary rings (default) or filled annuli.",
    },
  ],
  demo: YEARS,
  example: {
    title: "Account age",
    code: `import { TreeRings } from "${PKG}/tree-rings";\n\n<TreeRings data={years} unit="years" periodWord="year" title="Account age" />`,
  },
};

export function Preview() {
  return <TreeRings data={YEARS} summary={false} size={28} />;
}

export const showcase = {
  hint: "growth, ringed",
  Node: () => (
    <TreeRings
      data={YEARS}
      label="last"
      unit="years"
      periodWord="year"
      title="Account age"
      size={32}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "rings",
      label: "rings",
      options: ["stroke", "fill"],
      init: "stroke",
    },
    { kind: "segmented", key: "accent", label: "accent", options: ["last", "none"], init: "last" },
    { kind: "toggle", key: "label", label: "last value", init: false },
  ],
  render: (s) => (
    <TreeRings
      data={YEARS}
      rings={s.rings as "stroke" | "fill"}
      accent={s.accent as "last" | "none"}
      label={s.label ? "last" : "none"}
      unit="years"
      periodWord="year"
      summary={false}
      size={56}
    />
  ),
  code: (s) =>
    [
      "<TreeRings",
      "  data={years}",
      s.rings !== "stroke" && `  rings="${s.rings}"`,
      s.accent !== "last" && `  accent="${s.accent}"`,
      s.label && '  label="last"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "filled annuli for print / e-ink",
    code: `<TreeRings data={years} rings="fill" />`,
    node: <TreeRings data={YEARS} rings="fill" summary={false} size={40} />,
  },
  {
    label: "cohort age — total sets the expected lifetime",
    code: `<TreeRings data={years} total={200} />  // this account is part-grown`,
    node: <TreeRings data={YEARS} total={200} summary={false} size={40} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = props.data.length ? props.data.slice(0, 10).map((v) => Math.abs(v)) : YEARS;
  return <TreeRings data={data} summary={false} size={props.height ?? 20} />;
}

export function markCode(): string {
  return `<TreeRings data={years} />`;
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
