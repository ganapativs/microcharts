import { HeartbeatBlip } from "@microcharts/react/heartbeat-blip";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const NOW = 100_000;
export const BUSY = [97_000, 92_000, 85_000, 70_000, 55_000, 48_000];

export const entry: ChartEntry = {
  name: "HeartbeatBlip",
  slug: "heartbeat-blip",
  status: "stable",
  collection: "expressive",
  tagline: "Is it alive, and how busy? Instantly.",
  staticImport: `${PKG}/heartbeat-blip`,
  interactiveImport: `${PKG}/heartbeat-blip/interactive`,
  // The sweep IS the encoding (the trace's own left-sweeping motion carries
  // the event rate) — a mount entrance would fight that live motion, so this
  // chart has no `animate` prop at all.
  animates: false,
  picker: false,
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
  sampleData: [
    {
      name: "eventTimestamps",
      code: `const eventTimestamps = [97_000, 92_000, 85_000, 70_000, 55_000, 48_000];`,
    },
    {
      name: "serverNow",
      code: `const serverNow = 100_000;`,
    },
  ],
};

export function Preview() {
  return <HeartbeatBlip events={BUSY} now={NOW} summary={false} width={80} />;
}
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
  interactiveHint:
    "A live event firehose. Each blip is one real event arriving; the trace sweeps left as time passes and the rate you see IS the event rate. Stop the firehose and, after the window empties, the flat baseline is the down signal — never a fake pulse. Reduced-motion readers get the same trace, re-rendered on each event instead of swept.",
  animates: false,
};

export const recipes: Recipe[] = [
  {
    label: "a 5-minute window",
    code: `<HeartbeatBlip events={eventTimestamps} window={5 * 60_000} now={serverNow} />`,
    node: <HeartbeatBlip events={BUSY} window={300_000} now={NOW} summary={false} width={100} />,
  },
  {
    label: "flatline is the down signal (never a fake pulse)",
    code: `<HeartbeatBlip events={[]} now={serverNow} />`,
    node: <HeartbeatBlip events={[]} now={NOW} summary={false} width={100} />,
  },
];

const SERVICES = [
  { name: "api", events: BUSY, meta: "6 events/min" },
  { name: "worker", events: [99_000, 95_000, 88_000], meta: "3 events/min" },
  { name: "queue", events: [99_500, 99_200], meta: "2 events/min" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Request liveness{" "}
        <span className="mc-inline">
          <HeartbeatBlip events={BUSY} now={NOW} summary={false} width={90} height={16} />
        </span>{" "}
        — six events in the last minute, trace still sweeping.
      </p>
    ),
    code: '<p>\n  Request liveness{" "}\n  <span className="mc-inline">\n    <HeartbeatBlip events={eventTimestamps} now={serverNow} width={90} height={16} summary={false} />\n  </span>{" "}\n  — six events in the last minute.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {SERVICES.map((s) => (
            <tr key={s.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{s.name}</td>
              <td className="py-1.5">
                <HeartbeatBlip events={s.events} now={NOW} summary={false} width={72} height={16} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{s.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td><HeartbeatBlip events={svc.events} now={serverNow} width={72} height={16} /></td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Request liveness</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">6</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">events in the last minute</span>
          </div>
        </div>
        <HeartbeatBlip events={BUSY} now={NOW} summary={false} width={200} height={30} />
      </>
    ),
    code: '<div className="kpi"><span className="figure">6</span><HeartbeatBlip events={eventTimestamps} now={serverNow} width={200} height={30} /></div>',
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {SERVICES.map((s, i) => (
          <span
            key={s.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${i === 0 ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground" : "border-fd-border text-fd-muted-foreground"}`}
          >
            {s.name}
            <HeartbeatBlip events={s.events} now={NOW} summary={false} width={44} height={14} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">api <HeartbeatBlip events={eventTimestamps} now={serverNow} width={44} height={14} /></button>',
  },
};

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
  return `<HeartbeatBlip events={eventTimestamps} now={serverNow} />`;
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
