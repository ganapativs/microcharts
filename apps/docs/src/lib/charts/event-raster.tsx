import { EventRaster } from "@microcharts/react/event-raster";
import { EventRaster as EventRasterInteractive } from "@microcharts/react/event-raster/interactive";
import { InteractiveDemo } from "./event-raster.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
export const RASTER = [
  { label: "api", events: [2, 5, 6, 14, 20, 21, 33, 40, 41, 48, 55] },
  { label: "db", events: [3, 6, 15, 21, 34, 41, 55] },
  { label: "cache", events: [6, 21, 41, 55] },
  { label: "queue", events: [10, 30, 50] },
];

export const entry: ChartEntry = {
  name: "EventRaster",
  slug: "event-raster",
  status: "stable",
  collection: "frontier",
  tagline:
    "When each source fired — and whether sources fire together, in sequence, or not at all.",
  staticImport: `${PKG}/event-raster`,
  interactiveImport: `${PKG}/event-raster/interactive`,
  dataShape: "{ label, events: number[] }[] (one lane per source)",
  encoding: { channel: "position (x = time, y = lane)", precision: "high / medium" },
  nodeBudget: "1 path per lane, cap 12",
  bestFor: ["service events across sources", "agent steps / cron / sensor triggers"],
  avoidFor: ["a single lane (RugStrip)", "continuous rates (Sparkline)"],
  props: [
    {
      name: "data",
      type: "{ label, events }[]",
      required: true,
      description: "One lane per source.",
    },
    {
      name: "emphasis",
      type: "string",
      required: false,
      description: "Accents one lane — the sync read.",
    },
    {
      name: "labels",
      type: "boolean",
      required: false,
      description: "Left-gutter lane names (on ≤ 8 lanes).",
    },
    {
      name: "overflow",
      type: '"bin" | "clip"',
      required: false,
      description: "Aliasing lanes bin to counts (disclosed).",
    },
  ],
  demo: [9, 7, 4, 3],
  example: {
    title: "Service events",
    code: `import { EventRaster } from "${PKG}/event-raster";\n\n<EventRaster data={services} title="Service events" />`,
  },
  sampleData: [
    {
      name: "services",
      code: `const services = [
  { label: "api", events: [2, 5, 6, 14, 20, 21, 33, 40, 41, 48, 55] },
  { label: "db", events: [3, 6, 15, 21, 34, 41, 55] },
  { label: "cache", events: [6, 21, 41, 55] },
  { label: "queue", events: [10, 30, 50] },
];`,
    },
  ],
};

export function Preview() {
  return <EventRaster data={RASTER} summary={false} width={220} height={56} />;
}

export const showcase = {
  hint: "sync",
  Node: () => <EventRaster data={RASTER} title="Service events" width={220} height={56} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "emphasis",
      label: "emphasis",
      options: ["none", "api", "db", "cache"],
      init: "none",
    },
    { kind: "toggle", key: "labels", label: "labels", init: true },
    {
      kind: "segmented",
      key: "overflow",
      label: "overflow",
      options: ["bin", "clip"],
      init: "bin",
    },
  ],
  render: (s) => (
    <EventRaster
      data={RASTER}
      emphasis={s.emphasis === "none" ? undefined : (s.emphasis as string)}
      labels={s.labels as boolean}
      overflow={s.overflow as "bin" | "clip"}
      summary={false}
      width={320}
      height={36}
    />
  ),
  code: (s) =>
    [
      "<EventRaster",
      "  data={services}",
      s.emphasis !== "none" && `  emphasis="${s.emphasis}"`,
      s.labels === false && "  labels={false}",
      s.overflow !== "bin" && `  overflow="${s.overflow}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <EventRasterInteractive
      data={RASTER}
      emphasis={s.emphasis === "none" ? undefined : (s.emphasis as string)}
      labels={s.labels as boolean}
      overflow={s.overflow as "bin" | "clip"}
      summary={false}
      animate={ui.animate}
      width={320}
      height={36}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<EventRaster",
      "  data={services}",
      s.emphasis !== "none" && `  emphasis="${s.emphasis}"`,
      s.labels === false && "  labels={false}",
      s.overflow !== "bin" && `  overflow="${s.overflow}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or use ↑/↓ for lanes and ←/→ for events — each announces its lane, time, and position.",
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<EventRaster data={row.lanes} labels={false} width={80} height={24} />`,
    node: <EventRaster data={RASTER} labels={false} summary={false} width={80} height={24} />,
  },
  {
    label: "emphasis",
    code: `<EventRaster data={services} emphasis="api" />`,
    node: <EventRaster data={RASTER} emphasis="api" summary={false} width={200} height={56} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <EventRaster
      data={RASTER.slice(0, 3)}
      labels={false}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 24}
    />
  );
}

export function markCode(): string {
  return `<EventRaster data={services} />`;
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
