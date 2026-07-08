import { Seismogram } from "@microcharts/react/seismogram";
import { InteractiveDemo } from "./seismogram.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const BURSTS = Array.from({ length: 48 }, (_, i) =>
  i % 9 === 0 ? (i % 27 === 0 ? 8 : 3) : i % 13 === 0 ? 1 : 0,
);

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
  nodeBudget: "≤ 2 (tick path + midline)",
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
  return <Seismogram data={BURSTS} summary={false} style={{ width: 120, height: 24 }} />;
}

export const showcase = {
  hint: "events",
  Node: () => <Seismogram data={BURSTS} title="Error bursts" style={{ width: 120, height: 24 }} />,
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
  ],
  render: (s) => (
    <Seismogram
      data={(s.signed as boolean) ? BURSTS.map((v, i) => (i % 2 === 0 ? v : -v)) : BURSTS}
      mode={s.mode as "intensity" | "barcode"}
      positive={(s.signed as boolean) ? "up" : undefined}
      summary={false}
      style={{ width: 260, height: 44 }}
    />
  ),
  code: (s) =>
    [
      "<Seismogram",
      "  data={events}",
      s.mode !== "intensity" && `  mode="${s.mode}"`,
      (s.signed as boolean) && '  positive="up"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "table row",
    code: `<Seismogram data={service.bursts} style={{ width: 120, height: 14 }} />`,
    node: <Seismogram data={BURSTS} summary={false} style={{ width: 120, height: 14 }} />,
  },
  {
    label: "barcode (presence only)",
    code: `// heights are noise? declare it — uniform ticks say "when", not "how hard"\n<Seismogram data={deploys} mode="barcode" />`,
    node: (
      <Seismogram data={BURSTS} mode="barcode" summary={false} style={{ width: 120, height: 14 }} />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <Seismogram
      data={props.data.map((v, i) => (i % 3 === 0 ? v : 0))}
      summary={false}
      style={{ width: props.width ?? 60, height: props.height ?? 16 }}
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
