import { CalendarStrip } from "@microcharts/react/calendar-strip";
import { InteractiveDemo } from "./calendar-strip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
// pinned end — docs must be deterministic (never a live "now")
const END = "2026-07-01";
const DATA = Array.from({ length: 18 }, (_, i) => ({
  date: `2026-06-${String(4 + i).padStart(2, "0")}`,
  value: i % 4 === 3 ? 0 : (i % 7) + 1,
}));

export const entry: ChartEntry = {
  name: "CalendarStrip",
  slug: "calendar-strip",
  status: "stable",
  collection: "core",
  tagline: "The last few weeks, day by day — real calendar position.",
  staticImport: `${PKG}/calendar-strip`,
  interactiveImport: `${PKG}/calendar-strip/interactive`,
  dataShape: "{ date: ISO string | Date, value }[] — date-indexed, not slot-indexed",
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
      name: "shape",
      type: '"square" | "round" | "dot"',
      required: false,
      description: "Shared cell vocabulary.",
    },
  ],
  demo: DATA.map((d) => d.value),
  example: {
    title: "Deploy cadence",
    code: `import { CalendarStrip } from "${PKG}/calendar-strip";\n\n<CalendarStrip data={days} end="2026-07-01" title="Deploy cadence" />`,
  },
};

export function Preview() {
  return <CalendarStrip data={DATA} end={END} summary={false} style={{ width: 110, height: 62 }} />;
}

export const showcase = {
  hint: "weekday rhythm",
  Node: () => (
    <CalendarStrip
      data={DATA}
      end={END}
      title="Deploy cadence"
      style={{ width: 110, height: 62 }}
    />
  ),
};

export const playground: PlaygroundSpec = {
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
  ],
  render: (s) => (
    <CalendarStrip
      data={DATA}
      end={END}
      weeks={Number(s.weeks)}
      weekStart={s.weekStart === "sunday" ? 0 : 1}
      shape={s.shape as "square" | "round" | "dot"}
      summary={false}
      style={{ width: 180, height: Number(s.weeks) * 22 }}
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
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
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
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
