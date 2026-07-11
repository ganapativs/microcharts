import { ParetoStrip } from "@microcharts/react/pareto-strip";
import { ParetoStrip as ParetoStripInteractive } from "@microcharts/react/pareto-strip/interactive";
import { InteractiveDemo } from "./pareto-strip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
// incident causes by count — a few dominate
export const CAUSES = [
  { label: "Timeouts", value: 38 },
  { label: "OOM", value: 24 },
  { label: "Deploy", value: 15 },
  { label: "Config", value: 9 },
  { label: "Network", value: 7 },
  { label: "Auth", value: 4 },
  { label: "Disk", value: 3 },
  { label: "DNS", value: 3 },
  { label: "Other bug", value: 2 },
];

export const entry: ChartEntry = {
  name: "ParetoStrip",
  slug: "pareto-strip",
  status: "stable",
  collection: "decision",
  tagline: "What should we fix first?",
  staticImport: `${PKG}/pareto-strip`,
  interactiveImport: `${PKG}/pareto-strip/interactive`,
  dataShape: "{ label: string; value: number }[]",
  encoding: {
    channel: "descending bar magnitude + cumulative-share line on a fixed 0–100% scale",
    precision: "high",
  },
  nodeBudget: "1 per bar + 4",
  bestFor: [
    'a "fix these three" read in a KPI card',
    "incident causes or support tags in a tab header",
    "any long-tail composition where a few dominate",
  ],
  avoidFor: ["a plain ranking (MiniBar)", "parts of a single whole (SegmentedBar)"],
  props: [
    {
      name: "data",
      type: "{ label; value }[]",
      required: true,
      description: "Categories with magnitudes — the component sorts descending.",
    },
    {
      name: "threshold",
      type: "number | false",
      required: false,
      description: "Cumulative reference line % (default 80 — a working reference, not a law).",
    },
    {
      name: "max",
      type: "number",
      required: false,
      description: "Categories beyond max roll up into Other (default 8, always last).",
    },
    {
      name: "label",
      type: '"count" | "none"',
      required: false,
      description: "'K of N → cum%' in a right gutter.",
    },
  ],
  demo: CAUSES.map((c) => c.value),
  example: {
    title: "Incident causes",
    code: `import { ParetoStrip } from "${PKG}/pareto-strip";

const causes = [
  { label: "Timeouts", value: 38 },
  { label: "OOM", value: 24 },
  { label: "Deploy", value: 15 },
  { label: "Config", value: 9 },
  { label: "Network", value: 7 },
  { label: "Auth", value: 4 },
  { label: "Disk", value: 3 },
  { label: "DNS", value: 3 },
  { label: "Other bug", value: 2 },
];

<ParetoStrip data={causes} unit="causes" metric="incidents" title="Incident causes" />`,
  },
};

export function Preview() {
  return <ParetoStrip data={CAUSES} summary={false} width={160} height={22} />;
}

export const showcase = {
  hint: "the vital few",
  Node: () => (
    <ParetoStrip
      data={CAUSES}
      unit="causes"
      metric="incidents"
      title="Incident causes"
      width={160}
      height={22}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "threshold", label: "threshold", min: 50, max: 95, step: 5, init: 80 },
    { kind: "segmented", key: "max", label: "max", options: ["4", "6", "8"], init: "8" },
    { kind: "segmented", key: "label", label: "label", options: ["none", "count"], init: "count" },
  ],
  render: (s) => (
    <ParetoStrip
      data={CAUSES}
      threshold={s.threshold as number}
      max={Number(s.max)}
      unit="causes"
      metric="incidents"
      label={s.label as "count" | "none"}
      summary={false}
      width={280}
      height={28}
    />
  ),
  code: (s) =>
    [
      "<ParetoStrip",
      "  data={causes}",
      s.threshold !== 80 && `  threshold={${s.threshold}}`,
      s.max !== "8" && `  max={${s.max}}`,
      s.label !== "count" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ParetoStripInteractive
      data={CAUSES}
      threshold={s.threshold as number}
      max={Number(s.max)}
      unit="causes"
      metric="incidents"
      label={s.label as "count" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ParetoStrip",
      "  data={causes}",
      s.threshold !== 80 && `  threshold={${s.threshold}}`,
      s.max !== "8" && `  max={${s.max}}`,
      s.label !== "count" && `  label="${s.label}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the bars — each announces its share and the running cumulative; T jumps to the 80% crossing.",
};

export const recipes: Recipe[] = [
  {
    label: "roll the tail into Other",
    code: `<ParetoStrip data={causes} max={4} />`,
    node: <ParetoStrip data={CAUSES} max={4} summary={false} width={180} height={22} />,
  },
  {
    label: "no threshold line",
    code: `<ParetoStrip data={causes} threshold={false} />`,
    node: <ParetoStrip data={CAUSES} threshold={false} summary={false} width={180} height={22} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = props.data
    .slice(0, 6)
    .map((v, i) => ({ label: `c${i}`, value: 40 - i * 6 + (Math.abs(v) % 4) }));
  return (
    <ParetoStrip
      data={data}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<ParetoStrip data={causes} />`;
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
