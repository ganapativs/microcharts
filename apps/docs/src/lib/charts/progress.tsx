import { Progress } from "@microcharts/react/progress";
import { InteractiveDemo } from "./progress.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "Progress",
  slug: "progress",
  status: "stable",
  collection: "core",
  tagline: "How far along, exactly — bar plus the percent that is the datum.",
  staticImport: `${PKG}/progress`,
  interactiveImport: `${PKG}/progress/interactive`,
  dataShape: "number of max (optionally segmented)",
  encoding: { channel: "zero-anchored bar length + direct % label", precision: "high" },
  nodeBudget: "≤ 4 continuous · ≤ 3 + segments",
  bestFor: ["KPI cards", "table completion columns", "step counts (segments)"],
  avoidFor: ["icon-size slots (use ProgressRing)", "composition (use SegmentedBar)"],
  props: [
    { name: "value", type: "number", required: true, description: "The progressed amount." },
    { name: "max", type: "number", required: false, description: "Denominator (default 1)." },
    {
      name: "segments",
      type: "number",
      required: false,
      description: "Discrete-chunk track — the chart says step count, not ratio.",
    },
    {
      name: "label",
      type: '"percent" | "value" | "fraction" | "none"',
      required: false,
      description: "The direct label; percent is the default datum.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "down = burn-down wording (summary only; the bar stays factual).",
    },
  ],
  demo: [0.68],
  example: {
    title: "Onboarding",
    code: `import { Progress } from "${PKG}/progress";\n\n<Progress value={0.68} title="Onboarding" />`,
  },
};

export function Preview() {
  return <Progress value={0.68} summary={false} style={{ width: 120, height: 20 }} />;
}

export const showcase = {
  hint: "completion",
  Node: () => <Progress value={0.68} title="Backlog burn" style={{ width: 120, height: 20 }} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "pct", label: "value %", min: 0, max: 120, init: 68 },
    { kind: "range", key: "segments", label: "segments", min: 0, max: 10, init: 0 },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["percent", "value", "fraction", "none"],
      init: "percent",
    },
  ],
  render: (s) => (
    <Progress
      value={(s.pct as number) / 100}
      segments={(s.segments as number) >= 2 ? (s.segments as number) : undefined}
      label={s.label as "percent" | "value" | "fraction" | "none"}
      summary={false}
      style={{ width: 200, height: 26 }}
    />
  ),
  code: (s) =>
    [
      "<Progress",
      `  value={${(s.pct as number) / 100}}`,
      (s.segments as number) >= 2 && `  segments={${s.segments}}`,
      s.label !== "percent" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "table column",
    code: `// fixed width per row — fractions stay comparable down the column\n<Progress value={row.done} max={row.total} style={{ width: 96 }} />`,
    node: <Progress value={0.44} summary={false} style={{ width: 96 }} />,
  },
  {
    label: "stepped onboarding",
    code: `<Progress value={3} max={5} segments={5} label="fraction" />`,
    node: (
      <Progress
        value={3}
        max={5}
        segments={5}
        label="fraction"
        summary={false}
        style={{ width: 120 }}
      />
    ),
  },
];

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <Progress value={0.68} summary={false} style={{ width: 64, height: 10 }} />;
}

export function markCode(): string {
  return `<Progress value={0.68} />`;
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
