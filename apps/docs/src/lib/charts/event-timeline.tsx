import { EventTimeline } from "@microcharts/react/event-timeline";
import { InteractiveDemo } from "./event-timeline.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const H = 3_600_000;
const T0 = Date.UTC(2026, 5, 3);
const DATA = [
  { start: T0 + 1 * H, end: T0 + 5 * H, label: "Freeze", kind: "accent" as const },
  { start: T0 + 6 * H, end: T0 + 15 * H, label: "Healthy", kind: "positive" as const },
  { start: T0 + 11 * H, label: "Incident", kind: "negative" as const },
  { start: T0 + 16 * H, end: T0 + 18 * H, kind: "negative" as const },
  { start: T0 + 20 * H, label: "Release" },
];
const WINDOW: [number, number] = [T0, T0 + 24 * H];

export const entry: ChartEntry = {
  name: "EventTimeline",
  slug: "event-timeline",
  status: "stable",
  collection: "core",
  tagline: "What happened when, and for how long — spans and instants on one row.",
  staticImport: `${PKG}/event-timeline`,
  interactiveImport: `${PKG}/event-timeline/interactive`,
  dataShape: "{ start, end?, label?, kind? }[] — end present = span, absent = point event",
  encoding: {
    channel: "span extent on a linear time axis; points as position marks",
    precision: "high",
  },
  nodeBudget: "≤ 14 (1 per item + track + now tick, ≤ 12 items documented)",
  bestFor: ["per-service uptime rows", "on-call shifts and release windows in cards"],
  avoidFor: ["more than ~12 items", "aggregated durations (MiniBar of totals)"],
  props: [
    {
      name: "data",
      type: "{ start; end?; label?; kind? }[]",
      required: true,
      description: "Spans (with end) and point events (without), ms epoch or Date.",
    },
    {
      name: "domain",
      type: "[start, end]",
      required: false,
      description: "The window — fix it across rows for small multiples.",
    },
    {
      name: "now",
      type: "number | Date",
      required: false,
      description: "Current-moment tick; authored, never implicit.",
    },
    {
      name: "label",
      type: '"none" | "spans"',
      required: false,
      description: "Centered in-span labels with deterministic drop-out.",
    },
  ],
  demo: DATA.map((d) => ((d.end ?? d.start) - d.start) / H),
  example: {
    title: "API uptime",
    code: `import { EventTimeline } from "${PKG}/event-timeline";\n\n<EventTimeline data={windows} domain={today} title="API uptime" />`,
  },
};

export function Preview() {
  return <EventTimeline data={DATA} domain={WINDOW} summary={false} width={150} height={20} />;
}

export const showcase = {
  hint: "when + how long",
  Node: () => (
    <EventTimeline data={DATA} domain={WINDOW} title="API uptime" width={150} height={20} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "now", label: "now tick", init: false },
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["none", "spans"],
      init: "none",
    },
  ],
  render: (s) => (
    <EventTimeline
      data={DATA}
      domain={WINDOW}
      now={s.now ? T0 + 21 * H : undefined}
      label={s.label as "none" | "spans"}
      width={280}
      height={36}
      summary={false}
    />
  ),
  code: (s) =>
    [
      "<EventTimeline",
      "  data={windows}",
      "  domain={today}",
      s.now && "  now={Date.now()}",
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "uptime rows (shared window)",
    code: `{services.map((svc) => (\n  <EventTimeline key={svc.id} data={svc.windows} domain={today} title={svc.name} />\n))}`,
    node: <EventTimeline data={DATA} domain={WINDOW} summary={false} width={170} height={14} />,
  },
  {
    label: "with the current moment",
    code: `<EventTimeline data={windows} domain={today} now={Date.now()} />`,
    node: (
      <EventTimeline
        data={DATA}
        domain={WINDOW}
        now={T0 + 21 * H}
        summary={false}
        width={170}
        height={14}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <EventTimeline
      data={props.data.slice(0, 6).map((v, i) => ({
        start: i * 10,
        end: i % 2 === 0 ? i * 10 + Math.abs(v) : undefined,
      }))}
      domain={[0, 60]}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 12}
    />
  );
}

export function markCode(): string {
  return `<EventTimeline data={windows} domain={window} />`;
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
