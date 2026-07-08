import { DualSparkline } from "@microcharts/react/dual-sparkline";
import { InteractiveDemo } from "./dual-sparkline.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const US = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4, 19, 21];
const BENCH = [12, 12.4, 12.8, 13.1, 13.6, 14, 14.2, 14.8, 15, 15.4, 15.8, 16];

export const entry: ChartEntry = {
  name: "DualSparkline",
  slug: "dual-sparkline",
  status: "stable",
  collection: "core",
  tagline: "How is this series doing against its benchmark.",
  staticImport: `${PKG}/dual-sparkline`,
  interactiveImport: `${PKG}/dual-sparkline/interactive`,
  dataShape: "data: (number | null)[] + compare: (number | null)[] — exactly two series",
  encoding: {
    channel: "two line positions on ONE shared scale",
    precision: "medium — the gap between the lines is the read; hover for exact pairs",
  },
  nodeBudget: "≤ 8 (2 paths + band + endpoint dots + label)",
  bestFor: ["metric-vs-benchmark in table cells", "actual-vs-plan in KPI cards"],
  avoidFor: ["3+ series (SparkGroup)", "different units per series (never dual axes)"],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "The series being judged.",
    },
    {
      name: "compare",
      type: "(number | null)[]",
      required: true,
      description: "The benchmark — dashed, thinner, neutral.",
    },
    {
      name: "band",
      type: "[number, number]",
      required: false,
      description: "Normal-range band behind both (shared grammar).",
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Endpoint value label for the primary series.",
    },
  ],
  demo: US,
  example: {
    title: "Conversion vs market",
    code: `import { DualSparkline } from "${PKG}/dual-sparkline";\n\n<DualSparkline data={ours} compare={market} title="Conversion vs market" />`,
  },
};

export function Preview() {
  return (
    <DualSparkline data={US} compare={BENCH} summary={false} style={{ width: 130, height: 22 }} />
  );
}

export const showcase = {
  hint: "vs benchmark",
  Node: () => (
    <DualSparkline
      data={US}
      compare={BENCH}
      title="Conversion vs market"
      style={{ width: 130, height: 22 }}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["none", "last"],
      init: "none",
    },
    { kind: "toggle", key: "band", label: "band", init: false },
  ],
  render: (s) => (
    <DualSparkline
      data={US}
      compare={BENCH}
      label={s.label as "last" | "none"}
      band={s.band ? [13, 16] : undefined}
      summary={false}
      style={{ width: 260, height: 30 }}
    />
  ),
  code: (s) =>
    [
      "<DualSparkline",
      "  data={ours}",
      "  compare={market}",
      s.label !== "none" && `  label="${s.label}"`,
      s.band && "  band={[13, 16]}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "channel rows vs market",
    code: `{channels.map((c) => (\n  <DualSparkline key={c.id} data={c.series} compare={market} title={c.name} />\n))}`,
    node: (
      <DualSparkline data={US} compare={BENCH} summary={false} style={{ width: 160, height: 16 }} />
    ),
  },
  {
    label: "actual vs plan with endpoint",
    code: `<DualSparkline data={actual} compare={plan} label="last" />`,
    node: (
      <DualSparkline
        data={US}
        compare={BENCH}
        label="last"
        summary={false}
        style={{ width: 160, height: 18 }}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <DualSparkline
      data={props.data}
      compare={props.data.map((v, i) => v * 0.85 + i * 0.1)}
      summary={false}
      style={{ width: props.width ?? 60, height: props.height ?? 14 }}
    />
  );
}

export function markCode(): string {
  return `<DualSparkline data={ours} compare={market} />`;
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
