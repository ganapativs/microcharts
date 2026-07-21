import { EventTimeline } from "@microcharts/react/event-timeline";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const H = 3_600_000;
export const T0 = Date.UTC(2026, 5, 3);
export const DATA = [
  { start: T0 + 1 * H, end: T0 + 5 * H, label: "Freeze", kind: "accent" as const },
  { start: T0 + 6 * H, end: T0 + 15 * H, label: "Healthy", kind: "positive" as const },
  { start: T0 + 11 * H, label: "Incident", kind: "negative" as const },
  { start: T0 + 16 * H, end: T0 + 18 * H, kind: "negative" as const },
  { start: T0 + 20 * H, label: "Release" },
];
export const WINDOW: [number, number] = [T0, T0 + 24 * H];
/** A second service with a clean window — contrast for the cell/tab homes. */
const AUTH = [{ start: T0, end: T0 + 24 * H, label: "Healthy", kind: "positive" as const }];

export const entry: ChartEntry = {
  name: "EventTimeline",
  slug: "event-timeline",
  status: "stable",
  collection: "core",
  tagline: "What happened when, and for how long: spans and instants on one row.",
  staticImport: `${PKG}/event-timeline`,
  interactiveImport: `${PKG}/event-timeline/interactive`,
  dataShape: "{ start, end?, label?, kind? }[], end present = span, absent = point event",
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
    {
      name: "dateFormat",
      type: "Intl.DateTimeFormatOptions | (d: Date) => string",
      required: false,
      interactive: true,
      description:
        "Announced timestamp format for focused events (defaults to a locale date-time).",
    },
  ],
  demo: DATA.map((d) => ((d.end ?? d.start) - d.start) / H),
  example: {
    title: "API uptime",
    code: `import { EventTimeline } from "${PKG}/event-timeline";\n\n<EventTimeline data={windows} domain={today} title="API uptime" />`,
  },
  sampleData: [
    {
      name: "windows",
      code: `const windows = [
  { start: Date.UTC(2026, 5, 3, 1), end: Date.UTC(2026, 5, 3, 5), label: "Freeze", kind: "accent" },
  { start: Date.UTC(2026, 5, 3, 6), end: Date.UTC(2026, 5, 3, 15), label: "Healthy", kind: "positive" },
  { start: Date.UTC(2026, 5, 3, 11), label: "Incident", kind: "negative" },
  { start: Date.UTC(2026, 5, 3, 16), end: Date.UTC(2026, 5, 3, 18), kind: "negative" },
  { start: Date.UTC(2026, 5, 3, 20), label: "Release" },
];`,
    },
    {
      name: "today",
      code: `const today: [number, number] = [Date.UTC(2026, 5, 3), Date.UTC(2026, 5, 4)];`,
    },
  ],
};

export function Preview() {
  return <EventTimeline data={DATA} domain={WINDOW} summary={false} width={150} height={20} />;
}
export const playground: PlaygroundSpec = {
  // data and domain aren't knobbed — they're the fixture + shared window, not
  // interactive toggles (same convention as every other domain-taking chart).
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
  interactiveHint:
    "Hover an item or arrow chronologically — spans announce their interval and duration, instants their moment.",
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

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        API status today{" "}
        <span className="mc-inline">
          <EventTimeline data={DATA} domain={WINDOW} summary={false} width={90} height={14} />
        </span>{" "}
        — 3 spans covering 63% of the window, one incident logged.
      </p>
    ),
    code: `<p>\n  API status today{" "}\n  <span className="mc-inline">\n    <EventTimeline data={windows} domain={today} width={90} height={14} summary={false} />\n  </span>\n  {" "}\n  — 3 spans covering 63% of the window.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {(
            [
              ["API", DATA, 1],
              ["Auth", AUTH, 0],
            ] as const
          ).map(([name, rows, incidents]) => (
            <tr key={name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{name}</td>
              <td className="py-1.5">
                <EventTimeline data={rows} domain={WINDOW} summary={false} width={90} height={14} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {incidents} incident{incidents === 1 ? "" : "s"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <EventTimeline data={windows} domain={today} width={90} height={14} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Window coverage</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">63%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">3 spans, 1 incident</span>
          </div>
        </div>
        <EventTimeline data={DATA} domain={WINDOW} summary={false} width={200} height={30} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">63%</span>\n  <span className="unit">3 spans, 1 incident</span>\n  <EventTimeline data={windows} domain={today} width={200} height={30} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["API", DATA],
            ["Auth", AUTH],
          ] as const
        ).map(([name, rows], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <EventTimeline data={rows} domain={WINDOW} summary={false} width={54} height={14} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  API <EventTimeline data={windows} domain={today} width={54} height={14} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <EventTimeline
      data={props.data.slice(0, 6).map((v, i) => ({
        start: i * 10,
        end: i % 2 === 0 && Math.abs(v) > 0 ? i * 10 + Math.abs(v) : undefined,
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
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModuleStatic;
