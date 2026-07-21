import { MoonPhase } from "@microcharts/react/moon-phase";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "MoonPhase",
  slug: "moon-phase",
  status: "stable",
  collection: "expressive",
  tagline: "How far through a cycle or period: readable across cultures.",
  staticImport: `${PKG}/moon-phase`,
  interactiveImport: `${PKG}/moon-phase/interactive`,
  // The lit region already cross-fades on value change (one-shot WAAPI
  // value-transition in client.tsx) — a mount entrance would fight that
  // existing motion, so this chart has no `animate` prop at all.
  animates: false,
  picker: false,
  dataShape: "{ value: number }",
  encoding: { channel: "illuminated area fraction of the disc", precision: "medium" },
  nodeBudget: "3",
  bestFor: [
    "sprint or quota progress in a sentence",
    "a billing-period or release-cycle marker",
    "any 0–1 completion that reads at a glance",
  ],
  avoidFor: ["exact percentages (Progress)", "trends (Sparkline)", "comparisons (MiniBar)"],
  props: [
    { name: "value", type: "number", required: true, description: "Fraction 0–1 (clamped)." },
    {
      name: "mode",
      type: '"progress" | "cycle"',
      required: false,
      description:
        "progress = monotonic fill; cycle = true lunar mapping (0 new → 0.5 full → 1 new).",
    },
  ],
  demo: [68],
  example: {
    title: "Sprint",
    code: `import { MoonPhase } from "${PKG}/moon-phase";\n\n<MoonPhase value={0.68} title="Sprint" />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-center gap-3">
      {[0.1, 0.35, 0.5, 0.75, 1].map((v) => (
        <MoonPhase key={v} value={v} summary={false} size={20} />
      ))}
    </span>
  );
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value %", min: 0, max: 100, step: 1, init: 68 },
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["progress", "cycle"],
      init: "progress",
    },
  ],
  render: (s) => (
    <MoonPhase
      value={(s.value as number) / 100}
      mode={s.mode as "progress" | "cycle"}
      summary={false}
      size={44}
    />
  ),
  code: (s) =>
    [
      "<MoonPhase",
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.mode !== "progress" && `  mode="${s.mode}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Tap to advance the phase — the lit region cross-fades to its new area (reduced-motion → it swaps), hover reveals the percent, and each change is announced through a polite live region.",
  animates: false,
};

export const recipes: Recipe[] = [
  {
    label: "cycle mode maps the real lunar phases",
    code: `<MoonPhase value={0.5} mode="cycle" /> // full moon`,
    node: (
      <span className="inline-flex gap-2 items-center">
        {[0, 0.25, 0.5, 0.75].map((v) => (
          <MoonPhase key={v} value={v} mode="cycle" summary={false} size={22} />
        ))}
      </span>
    ),
  },
];

const SPRINTS = [
  { name: "Sprint 12", value: 0.68, meta: "68%" },
  { name: "Sprint 11", value: 1, meta: "100%" },
  { name: "Sprint 10", value: 0.82, meta: "82%" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Sprint progress{" "}
        <span className="mc-inline">
          <MoonPhase value={0.68} summary={false} size={16} />
        </span>{" "}
        — 68% through, waxing past half.
      </p>
    ),
    code: '<p>\n  Sprint progress{" "}\n  <span className="mc-inline">\n    <MoonPhase value={0.68} summary={false} />\n  </span>{" "}\n  — 68% through, waxing past half.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {SPRINTS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{row.name}</td>
              <td className="py-1.5">
                <MoonPhase value={row.value} summary={false} size={16} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <MoonPhase value={0.68} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Sprint</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">68%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">complete</span>
          </div>
        </div>
        <MoonPhase value={0.68} summary={false} size={36} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">68%</span>\n  <MoonPhase value={0.68} />\n</div>',
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {SPRINTS.map((row, i) => (
          <span
            key={row.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${i === 0 ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground" : "border-fd-border text-fd-muted-foreground"}`}
          >
            {row.name.replace("Sprint ", "S")}
            <MoonPhase value={row.value} summary={false} size={14} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Sprint 12 <MoonPhase value={0.68} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? (Math.abs(props.data[0]!) % 100) / 100 : 0.68;
  return <MoonPhase value={v} summary={false} size={props.height ?? 16} />;
}

export function markCode(): string {
  return `<MoonPhase value={0.68} />`;
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
