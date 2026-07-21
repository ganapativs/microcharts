import { BreathingDot } from "@microcharts/react/breathing-dot";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "BreathingDot",
  slug: "breathing-dot",
  status: "stable",
  collection: "expressive",
  tagline: "How loaded the system is right now, ambiently.",
  staticImport: `${PKG}/breathing-dot`,
  interactiveImport: `${PKG}/breathing-dot/interactive`,
  // The pulse rate/amplitude IS the encoding (the continuous breathing
  // animation, reduced-motion-gated to a static ring offset) — a mount
  // entrance would fight that live motion, so this chart has no `animate`
  // prop at all.
  animates: false,
  picker: false,
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

const CTX_ROWS = [
  { name: "api", meta: "42%", value: 0.42 },
  { name: "worker", meta: "68%", value: 0.68 },
  { name: "db", meta: "31%", value: 0.31 },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        System load right now{" "}
        <span className="mc-inline">
          <BreathingDot value={0.42} size={20} summary={false} />
        </span>{" "}
        — moderate strain, pulsing at 42%.
      </p>
    ),
    code: '<p>\n  System load right now{" "}\n  <span className="mc-inline">\n    <BreathingDot value={0.42} summary={false} />\n  </span>{" "}\n  — moderate strain, pulsing at 42%.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <BreathingDot value={row.value} size={22} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <BreathingDot value={0.42} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Load</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">42%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">current strain</span>
          </div>
        </div>
        <BreathingDot value={0.42} size={48} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">42%</span>\n  <span className="unit">current strain</span>\n  <BreathingDot value={0.42} />\n</div>',
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {CTX_ROWS.map((row, i) => (
          <span
            key={row.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${i === 0 ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground" : "border-fd-border text-fd-muted-foreground"}`}
          >
            {row.name}
            <BreathingDot value={row.value} size={18} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  api <BreathingDot value={0.42} />\n</button>',
  },
};

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
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModuleStatic;
