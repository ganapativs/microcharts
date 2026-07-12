import { BreathingDot } from "@microcharts/react/breathing-dot";
import { BreathingDot as BreathingDotInteractive } from "@microcharts/react/breathing-dot/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "BreathingDot",
  slug: "breathing-dot",
  status: "stable",
  collection: "expressive",
  tagline: "How loaded the system is, right now — ambiently.",
  staticImport: `${PKG}/breathing-dot`,
  interactiveImport: `${PKG}/breathing-dot/interactive`,
  // The pulse rate/amplitude IS the encoding (the continuous breathing
  // animation, reduced-motion-gated to a static ring offset) — a mount
  // entrance would fight that live motion, so this chart has no `animate`
  // prop at all.
  animates: false,
  dataShape: "{ value: number }",
  encoding: { channel: "pulse rate + amplitude (static: ring offset) by level", precision: "low" },
  nodeBudget: "3",
  bestFor: [
    "an ambient 'how strained is it right now' read",
    "a live status dot in a header or KPI card",
    "per-node load in a dense table",
  ],
  avoidFor: [
    "an exact load figure (Progress / Sparkline)",
    "discrete events (HeartbeatBlip)",
    "a trend over time (Sparkline)",
  ],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "Level 0–1 (clamped). null / NaN → unknown.",
    },
    {
      name: "thresholds",
      type: "[number, number]",
      required: false,
      description: "calm / elevated / strained edges (default [0.5, 0.8]).",
    },
    {
      name: "label",
      type: '"value" | "none"',
      required: false,
      description: "Percent numeral beside the dot.",
    },
  ],
  demo: [0.42],
  example: {
    title: "Load",
    code: `import { BreathingDot } from "${PKG}/breathing-dot";\n\n<BreathingDot value={0.42} title="Load" />`,
  },
};

export function Preview() {
  return <BreathingDot value={0.42} summary={false} size={20} />;
}

export const showcase = {
  hint: "right now",
  Node: () => <BreathingDot value={0.65} title="Load" size={28} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "level", min: 0, max: 100, step: 1, init: 42 },
    { kind: "segmented", key: "label", label: "label", options: ["none", "value"], init: "none" },
  ],
  render: (s) => (
    <BreathingDot
      value={(s.value as number) / 100}
      label={s.label as "none" | "value"}
      summary={false}
      size={64}
    />
  ),
  code: (s) =>
    [
      "<BreathingDot",
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  // No `animate` prop exists on this chart (see entry.animates) — the
  // continuous breathing pulse IS the encoding.
  renderInteractive: (s) => (
    <BreathingDotInteractive
      value={(s.value as number) / 100}
      label={s.label as "none" | "value"}
      summary={false}
      size={64}
    />
  ),
  codeInteractive: (s) =>
    [
      "<BreathingDot",
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Drag the load up and down — the dot pulses faster and larger as it moves through the calm, elevated, and strained bands. The motion is the encoding, so a reduced-motion reader gets the static ring offset instead, and the band is announced through a polite live region only when it changes.",
  animates: false,
};

export const recipes: Recipe[] = [
  {
    label: "SLO-derived thresholds",
    code: `<BreathingDot value={0.72} thresholds={[0.6, 0.85]} />`,
    node: <BreathingDot value={0.72} thresholds={[0.6, 0.85]} summary={false} size={28} />,
  },
  {
    label: "unknown never looks calm",
    code: `<BreathingDot value={null} />`,
    node: <BreathingDot value={null} summary={false} size={28} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? Math.abs(props.data[0]!) % 1 : 0.42;
  return <BreathingDot value={v} summary={false} size={props.height ?? 16} />;
}

export function markCode(): string {
  return `<BreathingDot value={0.42} />`;
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
