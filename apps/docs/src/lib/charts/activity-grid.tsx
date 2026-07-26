import { ActivityGrid } from "@microcharts/react/activity-grid";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

const demoGrid = [
  0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1, 3, 0, 2, 3, 4, 1, 2, 0, 1, 2, 3, 4, 2,
  1, 0,
];

const showcaseGrid = [
  3, 2, 4, 1, 3, 0, 2, 4, 3, 1, 2, 4, 0, 1, 3, 2, 4, 3, 2, 1, 3, 0, 2, 3, 4, 1, 2, 0,
];

/** Deterministic 35-cell wave for the playground (SSR-stable, never random). */
function gridWave(seed: number): number[] {
  return Array.from({ length: 35 }, (_, i) => Math.round(Math.abs(Math.sin(i * 1.3 + seed)) * 4));
}

/** Thursday 1970-01-01 — same fixed alignment day used in the docs page's
 *  "calendar-aligned" example, so the playground's `anchor` knob is deterministic. */
export const ALIGN_DATE = "1970-01-01";
/** Widened bucket range for the `domain` knob — compresses every level below
 *  the wave's natural max (4) so the dimming is visible. */
export const DOMAIN: readonly [number, number] = [0, 6];

export const entry: ChartEntry = {
  name: "ActivityGrid",
  slug: "activity-grid",
  status: "stable",
  collection: "core",
  tagline: "Calendar or matrix intensity: the contribution-graph shape.",
  staticImport: `${PKG}/activity-grid`,
  interactiveImport: `${PKG}/activity-grid/interactive`,
  dataShape: "number[]",
  encoding: {
    channel: "color intensity (discrete levels) over a grid",
    precision: "low — steer to SparkBar when exact comparison matters",
  },
  nodeBudget: "1 per cell",
  bestFor: ["daily activity", "streaks and cadence", "seasonality at a glance"],
  avoidFor: ["exact values", "precise comparison between two cells"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Ordered values, one per cell.",
    },
    {
      name: "layout",
      type: '"grid" | "strip"',
      required: false,
      description: "7-row calendar or single strip.",
    },
    {
      name: "shape",
      type: '"square" | "round" | "dot"',
      required: false,
      description: "Cell mark: crisp square, soft corners, or padded dot.",
    },
    {
      name: "anchor",
      type: "string | Date",
      required: false,
      description: "First slot's calendar day (UTC) — pads the first column so weekday rows align.",
    },
    {
      name: "weekStart",
      type: "0 | 1",
      required: false,
      description: "Start of week for anchor alignment (0 Sunday, 1 Monday).",
    },
    {
      name: "cell",
      type: "number",
      required: false,
      description: "Cell edge length in viewBox units.",
    },
    {
      name: "steps",
      type: "number",
      required: false,
      description:
        "Intensity steps including the zero track (default 5, GitHub-like). Same knob, same name, as CalendarStrip, CoverageStrip, GardenGrid, HeatCell, HeatStrip and SpiralYear.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Explicit range for level bucketing.",
    },
    {
      name: "title",
      type: "string",
      required: false,
      description: "Accessible name; joins the auto summary.",
    },
    {
      name: "summary",
      type: "string | false",
      required: false,
      description: "Override or disable the auto summary.",
    },
    {
      name: "gap",
      type: "number",
      required: false,
      description: "Gap between cells in viewBox units (default 2).",
    },
  ],
  demo: [0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1, 3],
  example: {
    title: "Commits this month",
    code: `import { ActivityGrid } from "${PKG}/activity-grid";\n\n<ActivityGrid data={commits} title="Commits" />`,
  },
  sampleData: [
    {
      name: "commits",
      code: `const commits = [
  0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1, 3, 0, 2, 3, 4, 1, 2, 0, 1, 2, 3, 4, 2,
  1, 0,
];`,
    },
  ],
};

export function Preview() {
  return <ActivityGrid data={entry.demo} cell={10} summary={false} />;
}
export const playground: PlaygroundSpec = {
  // `title`/`summary` drive the accessible name, not a visual toggle — title
  // stays fixed to "Playground" below.
  knobs: [
    { kind: "segmented", key: "layout", options: ["grid", "strip"], init: "grid" },
    { kind: "segmented", key: "shape", options: ["square", "round", "dot"], init: "square" },
    { kind: "segmented", key: "cell", options: ["9", "12", "15"], init: "12" },
    {
      kind: "segmented",
      key: "align",
      label: "calendar align",
      options: ["none", "monday", "sunday"],
      init: "none",
    },
    { kind: "toggle", key: "domain", label: "fixed domain [0, 6]", init: false },
  ],
  data: gridWave(0),
  shuffle: gridWave,
  render: (s, data) => (
    <ActivityGrid
      data={data}
      layout={s.layout as "grid" | "strip"}
      shape={s.shape as "square" | "round" | "dot"}
      cell={Number(s.cell)}
      anchor={s.align !== "none" ? ALIGN_DATE : undefined}
      weekStart={s.align === "sunday" ? 0 : 1}
      domain={s.domain ? DOMAIN : undefined}
      title="Playground"
    />
  ),
  code: (s, data) =>
    [
      "<ActivityGrid",
      `  data={/* ${data.length} values */}`,
      `  layout="${s.layout}"`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      `  cell={${s.cell}}`,
      s.align !== "none" && `  anchor="${ALIGN_DATE}"`,
      s.align === "sunday" && "  weekStart={0}",
      s.domain && "  domain={[0, 6]}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover a cell, or focus and move in 2-D with the arrow keys.",
};

export const recipes: Recipe[] = [
  {
    label: "default cells",
    code: `// ActivityGrid sizes from cell edge length (default 10)\n<ActivityGrid data={commits} />`,
    node: (
      <ActivityGrid
        data={[0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1]}
        summary={false}
      />
    ),
  },
  {
    label: "larger cells",
    code: `// bump every cell — the whole grid scales with it\n<ActivityGrid data={commits} cell={14} />`,
    node: (
      <ActivityGrid
        data={[0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1]}
        cell={14}
        summary={false}
      />
    ),
  },
  {
    label: "responsive",
    code: `// let CSS drive the width — the viewBox keeps the grid's ratio\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <ActivityGrid data={commits} style={{ width: "100%", height: "auto" }} />\n</div>`,
    fluid: true,
    node: (
      /* a full quarter (13 weeks) so the fluid grid reads landscape at
         the frame width — 20 values gave ~3 giant columns. Deterministic
         wave, not random (SSR-stable). */
      <ActivityGrid
        data={Array.from({ length: 91 }, (_, i) => (i * 5 + (i % 3) * 7) % 5)}
        style={{ width: "100%", height: "auto" }}
        summary={false}
      />
    ),
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Commit cadence for the last two weeks{" "}
        <span className="mc-inline">
          <ActivityGrid data={demoGrid.slice(0, 14)} layout="strip" cell={7} summary={false} />
        </span>{" "}
        — bursts of shipping, punctuated by two dead-quiet days.
      </p>
    ),
    code: `<p>\n  Commit cadence for the last two weeks{" "}\n  <span className="mc-inline">\n    <ActivityGrid data={commits.slice(0, 14)} layout="strip" cell={7} summary={false} />\n  </span>{" "}\n  — bursts of shipping, punctuated by two dead-quiet days.\n</p>`,
  },
  cell: {
    render: () => {
      const rows: [string, number[], number][] = [
        ["api", demoGrid.slice(0, 7), 13],
        ["web", showcaseGrid.slice(0, 7), 15],
        ["docs", demoGrid.slice(7, 14), 14],
      ];
      return (
        <table className="mc-inline-table w-full text-sm tabular-nums">
          <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
            {rows.map(([name, series, total]) => (
              <tr key={name}>
                <td className="py-1.5 pr-3 text-fd-muted-foreground">{name}</td>
                <td className="py-1.5">
                  <ActivityGrid data={series} layout="strip" cell={8} summary={false} />
                </td>
                <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    },
    code: `<td>\n  <ActivityGrid data={commits.slice(0, 7)} layout="strip" cell={8} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Commits this sprint</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">67</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">
              across 35 days, busiest at 4
            </span>
          </div>
        </div>
        <ActivityGrid data={demoGrid} cell={8} summary={false} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">67</span>\n  <span className="unit">across 35 days, busiest at 4</span>\n  <ActivityGrid data={commits} cell={8} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["api", demoGrid.slice(-14)],
            ["web", showcaseGrid.slice(-14)],
          ] as const
        ).map(([name, series], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <ActivityGrid data={series} layout="strip" cell={5} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  api <ActivityGrid data={commits.slice(-14)} layout="strip" cell={5} />\n</button>`,
  },
};

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  // a landscape 7-row contribution grid (the shape the tagline promises) reads at
  // favicon scale; the full-width strip collapses to a hairline when fit to the box.
  // ~14 weeks gives a 2:1 matrix that fills the glyph box instead of a sliver.
  const cells = Array.from({ length: 98 }, (_, i) => Math.round(Math.abs(Math.sin(i * 0.7)) * 4));
  return <ActivityGrid data={cells} layout="grid" cell={3} summary={false} />;
}

export function markCode(): string {
  return `<ActivityGrid data={data} layout="strip" cell={7} />`;
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
