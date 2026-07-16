import { ProgressRing } from "@microcharts/react/progress-ring";
import { ProgressRing as ProgressRingInteractive } from "@microcharts/react/progress-ring/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "ProgressRing",
  slug: "progress-ring",
  status: "stable",
  collection: "core",
  tagline: "How complete is this? At icon size, where a bar doesn't fit.",
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
  // `max` isn't its own knob: `pct` already expresses value as value/max — a
  // second denominator control would just relabel the same fraction.
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
  renderInteractive: (s, _data, ui) => (
    <ProgressRingInteractive
      value={(s.pct as number) / 100}
      sweep={s.sweep as boolean}
      weight={s.weight as number}
      label={(s.label as boolean) ? "percent" : "none"}
      size={48}
      summary={false}
      animate={ui.animate}
      style={{ width: 96, height: 96 }}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ProgressRing",
      `  value={${(s.pct as number) / 100}}`,
      (s.sweep as boolean) && "  sweep",
      s.weight !== 3 && `  weight={${s.weight}}`,
      (s.label as boolean) && '  label="percent"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Advance the ring — it announces only at quarter-threshold crossings (no spam).",
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

const JOBS: { name: string; value: number }[] = [
  { name: "Database", value: 0.82 },
  { name: "Media", value: 0.35 },
  { name: "Config", value: 1 },
];

const COOLDOWNS: { name: string; value: number }[] = [
  { name: "Photos", value: 0.4 },
  { name: "Videos", value: 0.85 },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Nightly backup is{" "}
        <span className="mc-inline">
          <ProgressRing value={0.68} summary={false} style={{ width: 18, height: 18 }} />
        </span>{" "}
        two-thirds through, about 12 minutes left.
      </p>
    ),
    code: `<p>\n  Nightly backup is{" "}\n  <ProgressRing value={0.68} style={{ width: 18, height: 18 }} /> two-thirds through.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {JOBS.map((j) => (
            <tr key={j.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{j.name}</td>
              <td className="py-1.5">
                <ProgressRing value={j.value} summary={false} style={{ width: 18, height: 18 }} />
              </td>
              <td className="py-1.5 pl-3 text-right font-mono text-fd-muted-foreground">
                {Math.round(j.value * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <ProgressRing value={0.82} style={{ width: 18, height: 18 }} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Storage used</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">142</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">of 200 GB</span>
          </div>
        </div>
        <ProgressRing value={0.71} summary={false} style={{ width: 32, height: 32 }} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">142</span>\n  <span className="unit">of 200 GB</span>\n  <ProgressRing value={0.71} style={{ width: 32, height: 32 }} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {COOLDOWNS.map((c, i) => (
          <span
            key={c.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {c.name}
            <ProgressRing value={c.value} sweep summary={false} style={{ width: 14, height: 14 }} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Photos <ProgressRing value={0.4} sweep style={{ width: 14, height: 14 }} />\n</button>`,
  },
};

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <ProgressRing value={0.68} summary={false} style={{ width: 18, height: 18 }} />;
}

export function markCode(): string {
  return `<ProgressRing value={0.68} />`;
}

export function PreviewLive() {
  return (
    <ProgressRingInteractive
      value={0.68}
      summary={false}
      style={{ width: 40, height: 40 }}
      animate
    />
  );
}

export default {
  entry,
  Preview,
  PreviewLive,
  showcase,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
