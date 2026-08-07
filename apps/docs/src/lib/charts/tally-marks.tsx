import { TallyMarks } from "@microcharts/react/tally-marks";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "TallyMarks",
  slug: "tally-marks",
  status: "stable",
  collection: "expressive",
  tagline: "How many, counted the way a human counts.",
  staticImport: `${PKG}/tally-marks`,
  interactiveImport: `${PKG}/tally-marks/interactive`,
  // Marks already draw in on every value change (one-shot stroke-dashoffset
  // sweep, client.tsx) — a mount entrance would fight that existing motion,
  // so this chart has no `animate` prop at all.
  animates: false,
  picker: false,
  readout: false,
  dataShape: "{ value: number }",
  encoding: { channel: "mark count in four-and-strike clusters of five", precision: "high" },
  nodeBudget: "2 (strokes + overflow numeral)",
  gotchas: ["Width is derived from the count; only `height` is yours to set."],
  bestFor: [
    "a small running count in a sentence or cell",
    "a live event or score counter",
    "editorial / hand-tallied contexts (the drawn pen)",
  ],
  avoidFor: [
    "large magnitudes (MiniBar)",
    "trends over time (Sparkline)",
    "proportions (Progress)",
  ],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "The count. Floored; negatives clamp to 0.",
    },
    {
      name: "total",
      type: "number",
      required: false,
      description: "Marks drawn before overflow (default 25).",
    },
    {
      name: "overflow",
      type: '"numeral" | "clamp"',
      required: false,
      description:
        "numeral appends +N; clamp stops drawing. The summary always keeps the true count.",
    },
    {
      name: "pen",
      type: '"ruled" | "drawn"',
      required: false,
      description: "Hand-drawn jitter for editorial contexts.",
    },
  ],
  demo: [23],
  example: {
    title: "Signatures",
    code: `import { TallyMarks } from "${PKG}/tally-marks";\n\n<TallyMarks value={23} title="Signatures" />`,
  },
};

export function Preview() {
  return <TallyMarks value={23} summary={false} height={16} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value", min: 0, max: 40, step: 1, init: 23 },
    { kind: "range", key: "total", label: "total", min: 5, max: 40, step: 5, init: 25 },
    { kind: "segmented", key: "pen", label: "pen", options: ["ruled", "drawn"], init: "ruled" },
    {
      kind: "segmented",
      key: "overflow",
      label: "overflow",
      options: ["numeral", "clamp"],
      init: "numeral",
    },
  ],
  render: (s) => (
    <TallyMarks
      value={s.value as number}
      total={s.total as number}
      pen={s.pen as "ruled" | "drawn"}
      overflow={s.overflow as "numeral" | "clamp"}
      title="Count"
      summary={false}
      height={28}
    />
  ),
  code: (s) =>
    [
      "<TallyMarks",
      `  value={${s.value}}`,
      s.total !== 25 && `  total={${s.total}}`,
      s.pen !== "ruled" && `  pen="${s.pen}"`,
      s.overflow !== "numeral" && `  overflow="${s.overflow}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Tap to count — each new mark draws in and the total is announced through a polite live region. A count has no sub-parts, so focus reads the summary and there is no cursor to move.",
  animates: false,
};

export const recipes: Recipe[] = [
  {
    label: "hand-drawn pen for an editorial count",
    code: `<TallyMarks value={17} pen="drawn" />`,
    node: <TallyMarks value={17} pen="drawn" summary={false} height={20} />,
  },
  {
    label: "cap the width — the numeral tells the truth past total",
    code: `<TallyMarks value={38} total={20} />`,
    node: <TallyMarks value={38} total={20} summary={false} height={20} />,
  },
];

const CTX_ROWS = [
  { name: "District 1", meta: "23", data: [17, 17, 18, 19, 20, 21, 22, 23] },
  { name: "District 2", meta: "18", data: [13, 14, 14, 15, 16, 17, 17, 18] },
  { name: "District 3", meta: "31", data: [22, 24, 25, 26, 27, 29, 30, 31] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Petition signatures{" "}
        <span className="mc-inline">
          <TallyMarks value={17} pen="drawn" height={16} summary={false} />
        </span>{" "}
        — 23 collected, 27 to goal.
      </p>
    ),
    code: '<p>\n  Petition signatures{" "}\n  <span className="mc-inline">\n    <TallyMarks value={12} summary={false} />\n  </span>{" "}\n  — 23 collected, 27 to goal.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <TallyMarks value={Number(row.meta)} pen="drawn" height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <TallyMarks value={12} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Signatures</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">23</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">of 50 goal</span>
          </div>
        </div>
        <TallyMarks value={17} pen="drawn" height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">23</span>\n  <span className="unit">of 50 goal</span>\n  <TallyMarks value={12} />\n</div>',
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
            <TallyMarks value={Number(row.meta)} pen="drawn" height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  D1 <TallyMarks value={12} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const value = props.data.length ? Math.abs(Math.round(props.data[0]!)) % 24 : 12;
  return <TallyMarks value={value || 12} summary={false} height={props.height ?? 16} />;
}

export function markCode(): string {
  return `<TallyMarks value={12} />`;
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
