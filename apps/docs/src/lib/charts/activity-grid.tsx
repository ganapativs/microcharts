import { ActivityGrid } from "@microcharts/react/activity-grid";
import { ActivityGrid as ActivityGridInteractive } from "@microcharts/react/activity-grid/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

const demoGrid = [
  0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1, 3, 0, 2, 3, 4, 1, 2, 0, 1, 2, 3, 4, 2,
  1, 0,
];

const showcaseGrid = [
  3, 2, 4, 1, 3, 0, 2, 4, 3, 1, 2, 4, 0, 1, 3, 2, 4, 3, 2, 1, 3, 0, 2, 3, 4, 1, 2, 0,
];

/** Deterministic 35-cell wave for the playground (SSR-stable, never random). */
function gridWave(seed: number): number[] {
  return Array.from({ length: 35 }, (_, i) => Math.round(Math.abs(Math.sin(i * 1.3 + seed)) * 4));
}

export const entry: ChartEntry = {
  name: "ActivityGrid",
  slug: "activity-grid",
  status: "stable",
  collection: "core",
  tagline: "Calendar or matrix intensity — the contribution-graph shape.",
  staticImport: `${PKG}/activity-grid`,
  interactiveImport: `${PKG}/activity-grid/interactive`,
  dataShape: "number[]",
  encoding: {
    channel: "color intensity (discrete levels) over a grid",
    precision: "low — steer to SparkBar when exact comparison matters",
  },
  nodeBudget: "1 per cell",
  bestFor: ["daily activity", "streaks and cadence", "seasonality at a glance"],
  avoidFor: ["exact values", "precise comparison between two cells"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Ordered values, one per cell.",
    },
    {
      name: "layout",
      type: '"grid" | "strip"',
      required: false,
      description: "7-row calendar or single strip.",
    },
    {
      name: "shape",
      type: '"square" | "round" | "dot"',
      required: false,
      description: "Cell mark: crisp square, soft corners, or padded dot.",
    },
    {
      name: "start",
      type: "string | Date",
      required: false,
      description: "First slot's calendar day (UTC) — pads the first column so weekday rows align.",
    },
    {
      name: "weekStart",
      type: "0 | 1",
      required: false,
      description: "Start of week for start alignment (0 Sunday, 1 Monday).",
    },
    {
      name: "cell",
      type: "number",
      required: false,
      description: "Cell edge length in viewBox units.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Explicit range for level bucketing.",
    },
    {
      name: "title",
      type: "string",
      required: false,
      description: "Accessible name; joins the auto summary.",
    },
    {
      name: "summary",
      type: "string | false",
      required: false,
      description: "Override or disable the auto summary.",
    },
  ],
  demo: [0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1, 3],
  example: {
    title: "Commits this month",
    code: `import { ActivityGrid } from "${PKG}/activity-grid";

const commitCounts = [
  0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1, 3,
];

<ActivityGrid data={commitCounts} title="Commits" />`,
  },
};

export function Preview() {
  return <ActivityGrid data={entry.demo} cell={10} summary={false} />;
}

export const showcase = {
  hint: "cadence",
  Node: () => <ActivityGridInteractive data={showcaseGrid} cell={9} title="Commit activity" />,
};

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover a cell, or focus and move in 2-D with the arrow keys.">
      <ActivityGridInteractive data={demoGrid} cell={13} title="Commit activity" />
    </DemoPanel>
  );
}

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "layout", options: ["grid", "strip"], init: "grid" },
    { kind: "segmented", key: "shape", options: ["square", "round", "dot"], init: "square" },
    { kind: "segmented", key: "cell", options: ["9", "12", "15"], init: "12" },
  ],
  data: gridWave(0),
  shuffle: gridWave,
  render: (s, data) => (
    <ActivityGrid
      data={data}
      layout={s.layout as "grid" | "strip"}
      shape={s.shape as "square" | "round" | "dot"}
      cell={Number(s.cell)}
      title="Playground"
    />
  ),
  code: (s, data) =>
    [
      "<ActivityGrid",
      `  data={/* ${data.length} values */}`,
      `  layout="${s.layout}"`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      `  cell={${s.cell}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "default cells",
    code: `// ActivityGrid sizes from cell edge length (default 10)\n<ActivityGrid data={data} />`,
    node: (
      <ActivityGrid
        data={[0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1]}
        summary={false}
      />
    ),
  },
  {
    label: "larger cells",
    code: `// bump every cell — the whole grid scales with it\n<ActivityGrid data={data} cell={14} />`,
    node: (
      <ActivityGrid
        data={[0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1]}
        cell={14}
        summary={false}
      />
    ),
  },
  {
    label: "responsive",
    code: `// let CSS drive the width — the viewBox keeps the grid's ratio\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <ActivityGrid data={data} style={{ width: "100%", height: "auto" }} />\n</div>`,
    fluid: true,
    node: (
      /* a full quarter (13 weeks) so the fluid grid reads landscape at
         the frame width — 20 values gave ~3 giant columns. Deterministic
         wave, not random (SSR-stable). */
      <ActivityGrid
        data={Array.from({ length: 91 }, (_, i) => (i * 5 + (i % 3) * 7) % 5)}
        style={{ width: "100%", height: "auto" }}
        summary={false}
      />
    ),
  },
];

export function Mark({ data }: { data: number[]; width?: number; height?: number }) {
  return <ActivityGrid data={data} layout="strip" cell={7} summary={false} />;
}

export function markCode(): string {
  return `<ActivityGrid data={data} layout="strip" cell={7} />`;
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
