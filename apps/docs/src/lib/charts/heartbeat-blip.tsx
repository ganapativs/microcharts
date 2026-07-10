import { HeartbeatBlip } from "@microcharts/react/heartbeat-blip";
import { InteractiveDemo } from "./heartbeat-blip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

const NOW = 100_000;
const BUSY = [97_000, 92_000, 85_000, 70_000, 55_000, 48_000];

export const entry: ChartEntry = {
  name: "HeartbeatBlip",
  slug: "heartbeat-blip",
  status: "stable",
  collection: "expressive",
  tagline: "Is it alive, and how busy — instantly.",
  staticImport: `${PKG}/heartbeat-blip`,
  interactiveImport: `${PKG}/heartbeat-blip/interactive`,
  dataShape: "number[]",
  encoding: { channel: "a spike per event across the recent window", precision: "medium" },
  nodeBudget: "3",
  bestFor: [
    "at-a-glance liveness of a service or stream",
    "request or event rate in a header",
    "per-service liveness in a status table",
  ],
  avoidFor: [
    "exact event counts (Seismogram / EventTimeline)",
    "a continuous level (BreathingDot)",
    "long-term trends (Sparkline)",
  ],
  props: [
    {
      name: "events",
      type: "number[]",
      required: true,
      description: "Event timestamps (ms).",
    },
    {
      name: "window",
      type: "number",
      required: false,
      description: "The visible recent window in ms (default 60000).",
    },
    {
      name: "now",
      type: "number",
      required: false,
      description: "Explicit clock — defaults to the latest event (SSR-safe).",
    },
    {
      name: "label",
      type: '"count" | "none"',
      required: false,
      description: "Event-count numeral at the right.",
    },
  ],
  demo: BUSY,
  example: {
    title: "Liveness",
    code: `import { HeartbeatBlip } from "${PKG}/heartbeat-blip";\n\n// pass 'now' from your data layer — never Date.now() in a server render\n<HeartbeatBlip events={eventTimestamps} now={serverNow} title="Requests" />`,
  },
};

export function Preview() {
  return <HeartbeatBlip events={BUSY} now={NOW} summary={false} width={80} />;
}

export const showcase = {
  hint: "alive?",
  Node: () => <HeartbeatBlip events={BUSY} now={NOW} title="Requests" width={90} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "count", label: "events", min: 0, max: 12, step: 1, init: 6 },
    { kind: "segmented", key: "label", label: "label", options: ["none", "count"], init: "none" },
  ],
  render: (s) => (
    <HeartbeatBlip
      events={Array.from({ length: s.count as number }, (_, k) => NOW - k * 4200 - 2000)}
      now={NOW}
      label={s.label as "none" | "count"}
      summary={false}
      width={160}
    />
  ),
  code: (s) =>
    [
      "<HeartbeatBlip",
      "  events={eventTimestamps}",
      "  now={serverNow}",
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "a 5-minute window",
    code: `<HeartbeatBlip events={events} window={5 * 60_000} now={serverNow} />`,
    node: <HeartbeatBlip events={BUSY} window={300_000} now={NOW} summary={false} width={100} />,
  },
  {
    label: "flatline is the down signal (never a fake pulse)",
    code: `<HeartbeatBlip events={[]} now={serverNow} />`,
    node: <HeartbeatBlip events={[]} now={NOW} summary={false} width={100} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const n = props.data.length ? (Math.abs(Math.round(props.data[0]!)) % 8) + 1 : 6;
  return (
    <HeartbeatBlip
      events={Array.from({ length: n }, (_, k) => NOW - k * 5000 - 2000)}
      now={NOW}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<HeartbeatBlip events={events} now={serverNow} />`;
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
