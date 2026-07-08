import { ProgressRing } from "@microcharts/react/progress-ring";
import { InteractiveDemo } from "./progress-ring.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "ProgressRing",
  slug: "progress-ring",
  status: "stable",
  collection: "core",
  tagline: "How complete is this — at icon size, where a bar doesn't fit.",
  staticImport: `${PKG}/progress-ring`,
  interactiveImport: `${PKG}/progress-ring/interactive`,
  dataShape: "value of max",
  encoding: {
    channel: "arc sweep (fixed 12-o'clock start)",
    precision: "medium — Progress when the % must read precisely",
  },
  nodeBudget: "≤ 3",
  bestFor: ["tab headers", "KPI card corners", "cooldowns (sweep)"],
  avoidFor: ["precise reads (Progress)", "gauges (never shipped)"],
  props: [
    { name: "value", type: "number", required: true, description: "The progressed amount." },
    { name: "max", type: "number", required: false, description: "Denominator (default 1)." },
    {
      name: "sweep",
      type: "boolean",
      required: false,
      description: "Countdown: the REMAINING wedge shrinks.",
    },
    {
      name: "weight",
      type: "number",
      required: false,
      description: "Ring thickness (viewBox units).",
    },
    {
      name: "label",
      type: '"none" | "percent"',
      required: false,
      description: "Centered figure (≥ 20 px rendered).",
    },
  ],
  demo: [0.68],
  example: {
    title: "Backup",
    code: `import { ProgressRing } from "${PKG}/progress-ring";\n\n<ProgressRing value={0.68} title="Backup" />`,
  },
};

export function Preview() {
  return <ProgressRing value={0.68} summary={false} style={{ width: 40, height: 40 }} />;
}

export const showcase = {
  hint: "completion",
  Node: () => (
    <ProgressRing
      value={0.68}
      label="percent"
      size={40}
      title="Backup"
      style={{ width: 40, height: 40 }}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "pct", label: "value %", min: 0, max: 120, init: 68 },
    { kind: "toggle", key: "sweep", label: "sweep (countdown)", init: false },
    { kind: "range", key: "weight", label: "weight", min: 2, max: 8, init: 3 },
    { kind: "toggle", key: "label", label: "percent label", init: true },
  ],
  render: (s) => (
    <ProgressRing
      value={(s.pct as number) / 100}
      sweep={s.sweep as boolean}
      weight={s.weight as number}
      label={(s.label as boolean) ? "percent" : "none"}
      size={48}
      summary={false}
      style={{ width: 96, height: 96 }}
    />
  ),
  code: (s) =>
    [
      "<ProgressRing",
      `  value={${(s.pct as number) / 100}}`,
      (s.sweep as boolean) && "  sweep",
      s.weight !== 3 && `  weight={${s.weight}}`,
      (s.label as boolean) && '  label="percent"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "tab header",
    code: `<span>Sync <ProgressRing value={0.68} style={{ width: "0.9em", height: "0.9em" }} /></span>`,
    node: (
      <span>
        Sync{" "}
        <ProgressRing value={0.68} summary={false} style={{ width: "0.9em", height: "0.9em" }} />
      </span>
    ),
  },
  {
    label: "cooldown (sweep)",
    code: `// retry timer: the remaining wedge shrinks\n<ProgressRing value={elapsed / total} sweep />`,
    node: <ProgressRing value={0.68} sweep summary={false} style={{ width: 28, height: 28 }} />,
  },
];

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <ProgressRing value={0.68} summary={false} style={{ width: 18, height: 18 }} />;
}

export function markCode(): string {
  return `<ProgressRing value={0.68} />`;
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
