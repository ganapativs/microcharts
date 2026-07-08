import { Seismogram } from "@microcharts/react/seismogram";
import { InteractiveDemo } from "./seismogram.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
// A dense, bursty signal — mostly-live slots with quiet gaps and a few real
// spikes — so the trace reads as a seismograph, not scattered matchsticks.
const BURSTS = [
  1, 2, 1, 3, 2, 6, 2, 1, 0, 2, 1, 4, 9, 3, 1, 2, 0, 1, 3, 2, 7, 2, 1, 0, 2, 1, 5, 11, 3, 1, 2, 1,
];

export const entry: ChartEntry = {
  name: "Seismogram",
  slug: "seismogram",
  status: "stable",
  collection: "core",
  tagline: "When did things happen, and how hard — event density over time.",
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
};

export function Preview() {
  return <Seismogram data={BURSTS} summary={false} width={140} height={28} />;
}

export const showcase = {
  hint: "events",
  Node: () => <Seismogram data={BURSTS} title="Error bursts" width={200} height={34} />,
};

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
  ],
  render: (s) => (
    <Seismogram
      data={(s.signed as boolean) ? BURSTS.map((v, i) => (i % 2 === 0 ? v : -v)) : BURSTS}
      mode={s.mode as "intensity" | "barcode"}
      positive={(s.signed as boolean) ? "up" : undefined}
      anomaly={(s.flag as boolean) ? 6 : undefined}
      summary={false}
      width={260}
      height={44}
    />
  ),
  code: (s) =>
    [
      "<Seismogram",
      "  data={events}",
      s.mode !== "intensity" && `  mode="${s.mode}"`,
      (s.signed as boolean) && '  positive="up"',
      (s.flag as boolean) && "  anomaly={6}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "table row",
    code: `<Seismogram data={service.bursts} width={120} height={14} />`,
    node: <Seismogram data={BURSTS} summary={false} width={120} height={14} />,
  },
  {
    label: "barcode (presence only)",
    code: `// heights are noise? declare it — uniform ticks say "when", not "how hard"\n<Seismogram data={deploys} mode="barcode" />`,
    node: <Seismogram data={BURSTS} mode="barcode" summary={false} width={120} height={14} />,
  },
  {
    label: "flag anomalies",
    code: `// spikes at or above the threshold flare in the alert token\n<Seismogram data={service.bursts} anomaly={6} />`,
    node: <Seismogram data={BURSTS} anomaly={6} summary={false} width={120} height={14} />,
  },
];

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
  return `<Seismogram data={events} />`;
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
