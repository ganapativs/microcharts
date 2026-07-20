import { StreakSpark } from "@microcharts/react/streak-spark";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

// runs: 9 passing, 1 fail, 4 passing, 2 fail, 3 passing → current 3, record 9.
export const STREAK = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1];

export const entry: ChartEntry = {
  name: "StreakSpark",
  slug: "streak-spark",
  status: "stable",
  collection: "decision",
  tagline: "The current run against the record, with the texture of every streak and break.",
  staticImport: `${PKG}/streak-spark`,
  interactiveImport: `${PKG}/streak-spark/interactive`,
  dataShape: "(boolean | number | null)[]",
  encoding: {
    channel: "width = run length; height + opacity = run type; current run accented",
    precision: "high",
  },
  nodeBudget: "1 rect per run, cap 40",
  bestFor: [
    "pass/fail run histories",
    "uptime & incident-free streaks",
    "current vs record streaks",
  ],
  avoidFor: ["a continuous magnitude (SparkBar)", "a single ratio (Progress)"],
  props: [
    {
      name: "data",
      type: "(boolean | number | null)[]",
      required: true,
      description: "Outcomes; null is a gap that breaks the run. Numbers pass on > 0.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which outcome is the streak: pass (up) or fail (down).",
    },
    {
      name: "threshold",
      type: "number",
      required: false,
      description: "With numeric data, values ≥ threshold pass.",
    },
    {
      name: "label",
      type: '"current" | "both" | "none"',
      required: false,
      description: "Count labels: the current run, the record too, or neither.",
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
  ],
  demo: STREAK,
  example: {
    title: "Deploy streak",
    code: `import { StreakSpark } from "${PKG}/streak-spark";

// 1 = passing build, 0 = failing build
<StreakSpark
  data={[1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1]}
  title="Deploy streak"
/>`,
  },
};

export function Preview() {
  return <StreakSpark data={STREAK} width={180} height={48} summary={false} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "positive", label: "streak is", options: ["up", "down"], init: "up" },
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["current", "both", "none"],
      init: "current",
    },
  ],
  data: STREAK,
  shuffle: (seed) =>
    Array.from({ length: 22 }, (_, i) => (Math.sin((i + seed) * 1.7) > -0.3 ? 1 : 0)),
  render: (s, data) => (
    <StreakSpark
      data={data}
      positive={s.positive as "up" | "down"}
      label={s.label as "current" | "both" | "none"}
      width={340}
      height={92}
      className="w-full max-w-md"
      style={{ height: "auto" }}
      title="Playground"
    />
  ),
  code: (s, data) =>
    [
      "<StreakSpark",
      `  data={[${data.join(", ")}]}`,
      s.positive !== "up" && `  positive="${s.positive}"`,
      s.label !== "current" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover a run, or focus and step through with ← → — each run announces its length, outcome, and whether it is the record.",
};

export const recipes: Recipe[] = [
  {
    label: "default",
    code: `// data alone → an intrinsic 96×20 box\n<StreakSpark data={[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]} />`,
    node: <StreakSpark data={[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]} summary={false} />,
  },
  {
    label: "fixed size",
    code: `// width & height are viewBox units — they also set the pixel box\n<StreakSpark data={[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]} width={200} height={48} label="both" />`,
    node: (
      <StreakSpark
        data={[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]}
        width={200}
        height={48}
        label="both"
        summary={false}
      />
    ),
  },
  {
    label: "responsive",
    code: `// omit width/height, let CSS drive the width — the viewBox keeps the ratio\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <StreakSpark data={[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]} style={{ width: "100%", height: "auto" }} />\n</div>`,
    fluid: true,
    node: (
      <StreakSpark
        data={[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]}
        style={{ width: "100%", height: "auto" }}
        summary={false}
      />
    ),
  },
];

const CTX_ROWS = [
  { name: "prod", meta: "7 pass", data: [5, 5, 6, 6, 6, 6, 7, 7] },
  { name: "staging", meta: "12 pass", data: [9, 9, 10, 10, 11, 11, 12, 12] },
  { name: "dev", meta: "3 fail", data: [2, 2, 2, 3, 3, 3, 3, 3] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Deploy streak{" "}
        <span className="mc-inline">
          <StreakSpark data={STREAK} label="both" height={16} summary={false} />
        </span>{" "}
        — 7 greens in a row, last fail 3 days ago.
      </p>
    ),
    code: "<p>\n  Deploy streak <StreakSpark data={data}${size} /> — 7 greens in a row, last fail 3 days ago.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <StreakSpark data={row.data} label="both" height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <StreakSpark data={data}${size} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Streak</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">7</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">consecutive passes</span>
          </div>
        </div>
        <StreakSpark data={CTX_ROWS[0]!.data} label="both" height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">7</span>\n  <span className="unit">consecutive passes</span>\n  <StreakSpark data={data}${size} />\n</div>',
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
            <StreakSpark data={row.data} label="both" height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  prod <StreakSpark data={data}${size} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <StreakSpark
      data={STREAK}
      label="none"
      summary={false}
      width={props.width ?? 72}
      height={props.height ?? 18}
    />
  );
}

export function markCode(width?: number, height?: number): string {
  const size = width && height ? ` width={${width}} height={${height}}` : "";
  return `<StreakSpark data={data}${size} />`;
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
