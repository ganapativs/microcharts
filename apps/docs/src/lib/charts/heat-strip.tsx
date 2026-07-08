import { HeatStrip } from "@microcharts/react/heat-strip";
import { InteractiveDemo } from "./heat-strip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const LOAD = Array.from({ length: 30 }, (_, i) => Math.round(Math.sin(i / 4) * 40 + 50));
const D: [number, number] = [0, 100];

export const entry: ChartEntry = {
  name: "HeatStrip",
  slug: "heat-strip",
  status: "stable",
  collection: "core",
  tagline: "How intensity evolved, glanceably — the 1×N sibling of ActivityGrid.",
  staticImport: `${PKG}/heat-strip`,
  interactiveImport: `${PKG}/heat-strip/interactive`,
  dataShape: "(number | null)[]",
  encoding: {
    channel: "discrete color step per time cell",
    precision: "low — Sparkline when shape matters",
  },
  nodeBudget: "1 per cell (≤ 60 documented)",
  bestFor: ["per-tenant load rows", "intensity ribbons in tables", "dense time context"],
  avoidFor: ["exact shape (Sparkline)", "calendar rhythm (ActivityGrid)"],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "Time-ordered values; null = no record (≠ zero).",
    },
    {
      name: "steps",
      type: "number",
      required: false,
      description: "Shared step-scale granularity (default 5).",
    },
    {
      name: "shape",
      type: '"square" | "round" | "dot"',
      required: false,
      description: "Shared cell vocabulary.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Cross-row calibration — share one domain per table.",
    },
  ],
  demo: LOAD,
  example: {
    title: "Load per hour",
    code: `import { HeatStrip } from "${PKG}/heat-strip";\n\n<HeatStrip data={hourlyLoad} domain={[0, 100]} title="Load per hour" />`,
  },
};

export function Preview() {
  return <HeatStrip data={LOAD} domain={D} summary={false} width={130} height={18} />;
}

export const showcase = {
  hint: "intensity strip",
  Node: () => <HeatStrip data={LOAD} domain={D} title="CPU pressure" width={130} height={18} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "steps", label: "steps", min: 2, max: 9, init: 5 },
    {
      kind: "segmented",
      key: "shape",
      label: "shape",
      options: ["square", "round", "dot"],
      init: "square",
    },
  ],
  data: LOAD,
  shuffle: (seed) =>
    Array.from({ length: 30 }, (_, i) => Math.round(Math.sin((i + seed * 3) / 4) * 40 + 50)),
  render: (s, data) => (
    <HeatStrip
      data={data}
      domain={D}
      steps={s.steps as number}
      shape={s.shape as "square" | "round" | "dot"}
      summary={false}
      width={260}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<HeatStrip",
      "  data={hourlyLoad}",
      "  domain={[0, 100]}",
      s.steps !== 5 && `  steps={${s.steps}}`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "shared-domain rows",
    code: `// one domain per table — rows stay comparable\n{tenants.map((t) => (\n  <HeatStrip key={t.id} data={t.load} domain={[0, 100]} />\n))}`,
    node: (
      <span className="inline-flex flex-col gap-1">
        <HeatStrip data={LOAD} domain={D} summary={false} width={160} height={12} />
        <HeatStrip
          data={LOAD.map((v) => Math.round(v * 0.4))}
          domain={D}
          summary={false}
          width={160}
          height={12}
        />
      </span>
    ),
  },
  {
    label: "nulls hold their slot",
    code: `// a missing record is visibly different from zero\n<HeatStrip data={[3, null, 8, null, 5]} />`,
    node: <HeatStrip data={[3, null, 8, null, 5]} summary={false} width={90} height={14} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <HeatStrip
      data={props.data}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 10}
    />
  );
}

export function markCode(): string {
  return `<HeatStrip data={data} />`;
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
