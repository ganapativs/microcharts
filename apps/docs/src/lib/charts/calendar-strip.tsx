import { CalendarStrip } from "@microcharts/react/calendar-strip";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// pinned end — docs must be deterministic (never a live "now")
export const END = "2026-07-01";
export const DATA = Array.from({ length: 18 }, (_, i) => ({
  date: `2026-06-${String(4 + i).padStart(2, "0")}`,
  value: i % 4 === 3 ? 0 : (i % 7) + 1,
}));
// staging deploys far less often than production — real zeros (tracked,
// nothing shipped), never gaps.
const STAGING = DATA.map((d, i) => ({ date: d.date, value: i % 3 === 0 ? d.value : 0 }));

export const entry: ChartEntry = {
  name: "CalendarStrip",
  slug: "calendar-strip",
  status: "stable",
  collection: "core",
  tagline: "The last few weeks, day by day: real calendar position.",
  staticImport: `${PKG}/calendar-strip`,
  interactiveImport: `${PKG}/calendar-strip/interactive`,
  dataShape: "{ date: ISO string | Date, value }[], date-indexed, not slot-indexed",
  encoding: {
    channel: "discrete color step per real calendar day",
    precision: "low per day, high for rhythm — ActivityGrid for longer histories",
  },
  nodeBudget: "≤ 56 (1 per day, weeks ≤ 8 documented cap)",
  bestFor: ["habit/deploy cadence in KPI cards", "week-aligned recent activity"],
  avoidFor: ["long ordinal histories (ActivityGrid)", "exact per-day values (MiniBar)"],
  props: [
    {
      name: "data",
      type: "{ date; value }[]",
      required: true,
      description: "Date-keyed values; duplicates sum with a dev warning.",
    },
    {
      name: "weeks",
      type: "number",
      required: false,
      description: "Window length in whole weeks ending at `end` (default 4).",
    },
    {
      name: "end",
      type: "string | Date",
      required: false,
      description: "Last day of the window (defaults to today UTC — pin it for SSR determinism).",
    },
    {
      name: "weekStart",
      type: "0 | 1",
      required: false,
      description: "Locale start-of-week (default Monday).",
    },
    {
      name: "steps",
      type: "number",
      required: false,
      description: "Intensity steps including the zero track (default 5).",
    },
    {
      name: "shape",
      type: '"square" | "round" | "dot"',
      required: false,
      description: "Shared cell vocabulary.",
    },
    {
      name: "cell",
      type: "number",
      required: false,
      description: "Cell edge length in viewBox units (default 7).",
    },
    {
      name: "gap",
      type: "number",
      required: false,
      description: "Gap between cells (default 1).",
    },
    {
      name: "dateFormat",
      type: "Intl.DateTimeFormatOptions | (d: Date) => string",
      required: false,
      interactive: true,
      description: "Announced day label (defaults to weekday + month + day, UTC).",
    },
  ],
  demo: DATA.map((d) => d.value),
  example: {
    title: "Deploy cadence",
    code: `import { CalendarStrip } from "${PKG}/calendar-strip";\n\n<CalendarStrip data={days} end="2026-07-01" title="Deploy cadence" />`,
  },
  sampleData: [
    {
      name: "days",
      code:
        "const days = Array.from({ length: 18 }, (_, i) => ({\n" +
        '  date: `2026-06-${String(4 + i).padStart(2, "0")}`,\n' +
        "  value: i % 4 === 3 ? 0 : (i % 7) + 1,\n" +
        "}));",
    },
  ],
};

export function Preview() {
  return <CalendarStrip data={DATA} end={END} summary={false} style={{ width: 110, height: 62 }} />;
}
export const playground: PlaygroundSpec = {
  // `data` and `end` are pinned to the module's `days`/`end` constants — the
  // docs demo must stay deterministic (a live "now" would drift screenshots).
  knobs: [
    {
      kind: "segmented",
      key: "weeks",
      label: "weeks",
      options: ["2", "4", "8"],
      init: "4",
    },
    {
      kind: "segmented",
      key: "weekStart",
      label: "week starts",
      options: ["monday", "sunday"],
      init: "monday",
    },
    {
      kind: "segmented",
      key: "shape",
      label: "cells",
      options: ["square", "round", "dot"],
      init: "square",
    },
    { kind: "range", key: "cell", label: "cell size", min: 5, max: 12, step: 1, init: 7 },
    { kind: "range", key: "gap", label: "gap", min: 0, max: 3, step: 1, init: 1 },
  ],
  render: (s) => (
    <CalendarStrip
      data={DATA}
      end={END}
      weeks={Number(s.weeks)}
      weekStart={s.weekStart === "sunday" ? 0 : 1}
      shape={s.shape as "square" | "round" | "dot"}
      cell={Number(s.cell)}
      gap={Number(s.gap)}
      summary={false}
      style={{
        width: 180,
        height: "auto",
      }}
    />
  ),
  code: (s) =>
    [
      "<CalendarStrip",
      "  data={days}",
      `  end="${END}"`,
      s.weeks !== "4" && `  weeks={${s.weeks}}`,
      s.weekStart === "sunday" && "  weekStart={0}",
      s.shape !== "square" && `  shape="${s.shape}"`,
      Number(s.cell) !== 7 && `  cell={${s.cell}}`,
      Number(s.gap) !== 1 && `  gap={${s.gap}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover a day or arrow through the grid (←/→ day, ↑/↓ week) — each announces its real calendar day.",
};

export const recipes: Recipe[] = [
  {
    label: "habit rows",
    code: `{habits.map((h) => (\n  <CalendarStrip key={h.id} data={h.days} end={today} weeks={2} title={h.name} />\n))}`,
    node: (
      <CalendarStrip
        data={DATA}
        end={END}
        weeks={2}
        summary={false}
        style={{ width: 110, height: 30 }}
      />
    ),
  },
  {
    label: "dot cells for dense cards",
    code: `<CalendarStrip data={days} end={today} shape="dot" />`,
    node: (
      <CalendarStrip
        data={DATA}
        end={END}
        shape="dot"
        summary={false}
        style={{ width: 110, height: 62 }}
      />
    ),
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        <span className="font-mono text-xs text-fd-muted-foreground">api</span> shipped on 11 of the
        last 24 tracked days{" "}
        <span className="mc-inline">
          <CalendarStrip data={DATA} end={END} summary={false} cell={4} />
        </span>{" "}
        — quiet on three, no telemetry the rest of this week.
      </p>
    ),
    code: `<p>\n  api shipped on 11 of the last 24 tracked days{" "}\n  <CalendarStrip data={days} end="2026-07-01" cell={4} /> — quiet on three.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {[
            { name: "production", data: DATA, note: "near-daily" },
            { name: "staging", data: STAGING, note: "sparse" },
          ].map((env) => (
            <tr key={env.name}>
              <td className="py-1.5 pr-3 font-mono text-xs text-fd-muted-foreground">{env.name}</td>
              <td className="py-1.5">
                <CalendarStrip data={env.data} end={END} weeks={2} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{env.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <CalendarStrip data={days} end="2026-07-01" weeks={2} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Deploys this window</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">11</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">of 24 tracked days</span>
          </div>
        </div>
        <CalendarStrip data={DATA} end={END} summary={false} style={{ width: 110, height: 62 }} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">11</span>\n  <span className="unit">of 24 tracked days</span>\n  <CalendarStrip data={days} end="2026-07-01" />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["production", DATA],
            ["staging", STAGING],
          ] as const
        ).map(([name, data], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <CalendarStrip data={data} end={END} weeks={2} summary={false} cell={5} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  production <CalendarStrip data={days} end="2026-07-01" weeks={2} cell={5} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <CalendarStrip
      data={props.data.map((v, i) => ({
        date: `2026-06-${String(1 + (i % 28)).padStart(2, "0")}`,
        value: Math.abs(v),
      }))}
      end="2026-06-28"
      summary={false}
      style={{ width: props.width ?? 60, height: props.height ?? 34 }}
    />
  );
}

export function markCode(): string {
  return `<CalendarStrip data={days} end={today} />`;
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
