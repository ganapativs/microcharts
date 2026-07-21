import { Seismogram } from "@microcharts/react/seismogram";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// A dense, bursty signal — mostly-live slots with quiet gaps and a few real
// spikes — so the trace reads as a seismograph, not scattered matchsticks.
// Exported so the interactive demo shares ONE dataset (no static/interactive drift).
export const BURSTS = [
  1, 2, 1, 3, 2, 6, 2, 1, 0, 2, 1, 4, 9, 3, 1, 2, 0, 1, 3, 2, 7, 2, 1, 0, 2, 1, 5, 11, 3, 1, 2, 1,
];
// Two more per-minute error streams, quieter than checkout — for the
// cell/tab homes, so "error bursts per service" is a real multi-row read,
// not one strip repeated three times.
const AUTH_BURSTS = [
  0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 1, 4, 0, 0, 1, 0,
];
const SEARCH_BURSTS = [
  1, 0, 0, 2, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 0, 1, 0, 0, 3, 0, 0, 1, 0, 0, 0, 2, 0, 1, 0,
];
const SERVICES: { name: string; bursts: number[] }[] = [
  { name: "checkout-api", bursts: BURSTS },
  { name: "auth-api", bursts: AUTH_BURSTS },
  { name: "search-api", bursts: SEARCH_BURSTS },
];

export const entry: ChartEntry = {
  name: "Seismogram",
  slug: "seismogram",
  status: "stable",
  collection: "core",
  tagline: "When did things happen, and how hard: event density over time.",
  staticImport: `${PKG}/seismogram`,
  interactiveImport: `${PKG}/seismogram/interactive`,
  dataShape: "(number | null)[] (per-slot intensity; 0 = quiet)",
  encoding: {
    channel: "tick presence (density) + height (intensity)",
    precision: "medium — Sparkline for levels, EventTimeline for labeled events",
  },
  nodeBudget: "≤ 2 typical (tick path; +1 flag path, +1 signed midline)",
  bestFor: ["error bursts per service", "alert density", "activity texture in rows"],
  avoidFor: ["level tracking (Sparkline)", "labeled events (EventTimeline)"],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "Per-slot event intensity; 0/null = quiet.",
    },
    {
      name: "mode",
      type: '"intensity" | "barcode"',
      required: false,
      description: "Barcode collapses heights — pure occurrence density.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Polarity coloring of signed ticks.",
    },
    {
      name: "anomaly",
      type: "number",
      required: false,
      description: "Flag spikes: |v| ≥ threshold flares in the alert token.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Fixed intensity scale across rows.",
    },
  ],
  demo: BURSTS,
  example: {
    title: "Error bursts",
    code: `import { Seismogram } from "${PKG}/seismogram";\n\n<Seismogram data={burstsPerMinute} title="Error bursts" />`,
  },
  sampleData: [
    {
      name: "burstsPerMinute",
      code: `const burstsPerMinute = [
  1, 2, 1, 3, 2, 6, 2, 1, 0, 2, 1, 4, 9, 3, 1, 2,
  0, 1, 3, 2, 7, 2, 1, 0, 2, 1, 5, 11, 3, 1, 2, 1,
];`,
    },
  ],
};

export function Preview() {
  return <Seismogram data={BURSTS} summary={false} width={140} height={28} />;
} // color, format, locale, id, className, style, children: styling/formatting
// escape hatches, not chart-shape knobs — no interactive control (consistent
// with every other chart's playground; locale is demonstrated live in the
// mdx variants instead). title/summary stay off here for a clean strip.
export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["intensity", "barcode"],
      init: "intensity",
    },
    { kind: "toggle", key: "signed", label: "signed data", init: false },
    { kind: "toggle", key: "flag", label: "flag spikes", init: false },
    { kind: "toggle", key: "domain", label: "fixed domain [0, 20]", init: false },
  ],
  render: (s) => (
    <Seismogram
      data={(s.signed as boolean) ? BURSTS.map((v, i) => (i % 2 === 0 ? v : -v)) : BURSTS}
      mode={s.mode as "intensity" | "barcode"}
      positive={(s.signed as boolean) ? "up" : undefined}
      anomaly={(s.flag as boolean) ? 6 : undefined}
      domain={(s.domain as boolean) ? [0, 20] : undefined}
      summary={false}
      width={260}
      height={44}
    />
  ),
  code: (s) =>
    [
      "<Seismogram",
      "  data={burstsPerMinute}",
      s.mode !== "intensity" && `  mode="${s.mode}"`,
      (s.signed as boolean) && '  positive="up"',
      (s.flag as boolean) && "  anomaly={6}",
      (s.domain as boolean) && "  domain={[0, 20]}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow through the slots; Home/End jump to the first/last event.",
};

export const recipes: Recipe[] = [
  {
    label: "table row",
    code: `<Seismogram data={service.bursts} width={120} height={14} />`,
    node: <Seismogram data={BURSTS} summary={false} width={120} height={14} />,
  },
  {
    label: "barcode (presence only)",
    code: `// heights are noise? declare it — uniform ticks say "when", not "how hard"\n<Seismogram data={burstsPerMinute} mode="barcode" />`,
    node: <Seismogram data={BURSTS} mode="barcode" summary={false} width={120} height={14} />,
  },
  {
    label: "flag anomalies",
    code: `// spikes at or above the threshold flare in the alert token\n<Seismogram data={service.bursts} anomaly={6} />`,
    node: <Seismogram data={BURSTS} anomaly={6} summary={false} width={120} height={14} />,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Checkout errors this hour{" "}
        <span className="mc-inline">
          <Seismogram data={BURSTS} summary={false} width={90} height={16} />
        </span>{" "}
        — 29 events, spiking to 11 at minute 28.
      </p>
    ),
    code: `<p>\n  Checkout errors this hour{" "}\n  <span className="mc-inline">\n    <Seismogram data={burstsPerMinute} width={90} height={16} summary={false} />\n  </span>{" "}\n  — 29 events, spiking to 11 at minute 28.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {SERVICES.map((svc) => (
            <tr key={svc.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{svc.name}</td>
              <td className="py-1.5">
                <Seismogram
                  data={svc.bursts}
                  domain={[0, 12]}
                  summary={false}
                  width={90}
                  height={16}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {svc.bursts.filter((v) => v !== 0).length} events
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <Seismogram data={svc.bursts} domain={[0, 12]} width={90} height={16} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Checkout error bursts</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">29</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">events/hr · peak 11</span>
          </div>
        </div>
        <Seismogram data={BURSTS} anomaly={6} summary={false} width={200} height={30} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">29</span>\n  <span className="unit">events/hr · peak 11</span>\n  <Seismogram data={burstsPerMinute} anomaly={6} width={200} height={30} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {SERVICES.map((svc, i) => (
          <span
            key={svc.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {svc.name}
            <Seismogram data={svc.bursts} domain={[0, 12]} summary={false} width={54} height={14} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  checkout-api <Seismogram data={svc.bursts} domain={[0, 12]} width={54} height={14} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <Seismogram
      data={props.data.map((v, i) => (i % 3 === 0 ? v : 0))}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<Seismogram data={burstsPerMinute} />`;
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
