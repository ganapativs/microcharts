import { EventRaster } from "@microcharts/react/event-raster";
import { EventRaster as EventRasterInteractive } from "@microcharts/react/event-raster/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

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
      ui.animate && " animate",
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

const CTX_ROWS = [
  { name: "checkout", meta: "9" },
  { name: "auth", meta: "7" },
  { name: "search", meta: "4" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Service events this hour{" "}
        <span className="mc-inline">
          <EventRaster data={RASTER} height={16} summary={false} />
        </span>{" "}
        — checkout-api busiest, 9 events.
      </p>
    ),
    code: "<p>\n  Service events this hour <EventRaster data={services} /> — checkout-api busiest, 9 events.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <EventRaster data={RASTER} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <EventRaster data={services} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Events</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">9</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">checkout-api/hr</span>
          </div>
        </div>
        <EventRaster data={RASTER} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">9</span>\n  <span className="unit">checkout-api/hr</span>\n  <EventRaster data={services} />\n</div>',
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
            <EventRaster data={RASTER} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  checkout <EventRaster data={services} />\n</button>',
  },
};

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

export function PreviewLive() {
  return <EventRasterInteractive data={RASTER} summary={false} width={220} height={56} animate />;
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
