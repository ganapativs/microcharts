import { LikertStrip } from "@microcharts/react/likert-strip";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const SURVEY = [
  { label: "Strongly disagree", value: 10 },
  { label: "Disagree", value: 14 },
  { label: "Neutral", value: 14 },
  { label: "Agree", value: 34 },
  { label: "Strongly agree", value: 28 },
];

export const entry: ChartEntry = {
  name: "LikertStrip",
  slug: "likert-strip",
  status: "stable",
  collection: "core",
  tagline: "Does the response lean agree or disagree, and how hard.",
  staticImport: `${PKG}/likert-strip`,
  interactiveImport: `${PKG}/likert-strip/interactive`,
  dataShape: "{ label, value }[] ordered most-negative → most-positive (2–7 levels)",
  encoding: {
    channel: "signed segment length from a center line",
    precision: "medium — MiniBar for exact per-level values",
  },
  nodeBudget: "≤ 10 (≤ 7 segments + hairline + 2 labels)",
  maxWidth: 260,
  maxHeight: 60,
  gotchas: [
    "`format` merges with this chart's own unit instead of replacing it, so changing notation or precision keeps the unit; an explicit `style` opts out of the unit and of the digit defaults calibrated for it.",
    "7 levels is the legibility bar; more are rejected.",
    "Negative counts are treated as 0.",
  ],
  bestFor: ["survey question rows (SparkGroup shared scale)", "sentiment in cards"],
  avoidFor: ["> 7 levels", "unvalenced composition (SegmentedBar)"],
  props: [
    {
      name: "data",
      type: "{ label; value }[]",
      required: true,
      description: "Ordinal levels, negative → positive.",
    },
    {
      name: "neutral",
      type: '"split" | "omit"',
      required: false,
      description: "Center-straddle or omit-from-bar (always labeled).",
    },
    {
      name: "label",
      type: '"ends" | "net" | "none"',
      required: false,
      description: "Agree/disagree % or one signed score.",
    },
  ],
  demo: SURVEY.map((d) => d.value),
  example: {
    title: "Q1 satisfaction",
    code: `import { LikertStrip } from "${PKG}/likert-strip";

<LikertStrip
  data={[
    { label: "Strongly disagree", value: 10 },
    { label: "Disagree", value: 14 },
    { label: "Neutral", value: 14 },
    { label: "Agree", value: 34 },
    { label: "Strongly agree", value: 28 },
  ]}
  title="Q1 satisfaction"
/>`,
  },
  sampleData: [
    {
      name: "responses",
      code: `const responses = [
  { label: "Strongly disagree", value: 10 },
  { label: "Disagree", value: 14 },
  { label: "Neutral", value: 14 },
  { label: "Agree", value: 34 },
  { label: "Strongly agree", value: 28 },
];`,
    },
  ],
};

export function Preview() {
  return <LikertStrip data={SURVEY} summary={false} width={130} height={20} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "neutral",
      label: "neutral",
      options: ["split", "omit"],
      init: "split",
    },
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["ends", "net", "none"],
      init: "ends",
    },
  ],
  render: (s) => (
    <LikertStrip
      data={SURVEY}
      neutral={s.neutral as "split" | "omit"}
      label={s.label as "ends" | "net" | "none"}
      summary={false}
      width={260}
      height={26}
    />
  ),
  code: (s) =>
    [
      "<LikertStrip",
      "  data={responses}",
      s.neutral !== "split" && `  neutral="${s.neutral}"`,
      s.label !== "ends" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow through the levels — each announces its share and position.",
};

export const recipes: Recipe[] = [
  {
    label: "survey rows",
    code: `{questions.map((q) => (\n  <LikertStrip key={q.id} data={q.responses} title={q.text} />\n))}`,
    node: <LikertStrip data={SURVEY} summary={false} width={160} height={16} />,
  },
  {
    label: "net score for dense tables",
    code: `<LikertStrip data={responses} label="net" />`,
    node: <LikertStrip data={SURVEY} label="net" summary={false} width={120} height={14} />,
  },
];

const QUESTIONS = [
  { q: "Checkout was easy", data: SURVEY },
  {
    q: "Support response time",
    data: [
      { label: "Strongly disagree", value: 18 },
      { label: "Disagree", value: 22 },
      { label: "Neutral", value: 20 },
      { label: "Agree", value: 26 },
      { label: "Strongly agree", value: 14 },
    ],
  },
  {
    q: "Pricing feels fair",
    data: [
      { label: "Strongly disagree", value: 8 },
      { label: "Disagree", value: 12 },
      { label: "Neutral", value: 10 },
      { label: "Agree", value: 40 },
      { label: "Strongly agree", value: 30 },
    ],
  },
];

const RETURNING = [
  { label: "Strongly disagree", value: 4 },
  { label: "Disagree", value: 6 },
  { label: "Neutral", value: 10 },
  { label: "Agree", value: 38 },
  { label: "Strongly agree", value: 42 },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Checkout satisfaction, Q1{" "}
        <span className="mc-inline">
          <LikertStrip data={SURVEY} summary={false} label="none" width={90} height={16} />
        </span>{" "}
        — 62% agree, 24% disagree. Leans positive.
      </p>
    ),
    code: `<p>\n  Checkout satisfaction, Q1{" "}\n  <span className="mc-inline">\n    <LikertStrip data={responses} label="none" height={16} summary={false} />\n  </span>{" "}\n  — 62% agree, 24% disagree. Leans positive.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {QUESTIONS.map((row) => (
            <tr key={row.q}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{row.q}</td>
              <td className="py-1.5">
                <LikertStrip data={row.data} summary={false} label="none" width={120} height={16} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <LikertStrip data={q.responses} label="none" />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Checkout satisfaction</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">62%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">agree, 24% disagree</span>
          </div>
        </div>
        <LikertStrip data={SURVEY} summary={false} label="none" width={160} height={18} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">62%</span>\n  <span className="unit">agree, 24% disagree</span>\n  <LikertStrip data={responses} label="none" width={160} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["New users", SURVEY],
            ["Returning users", RETURNING],
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
            <LikertStrip data={rows} summary={false} label="none" width={64} height={12} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  New users <LikertStrip data={responses} label="none" width={64} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <LikertStrip
      data={props.data.slice(0, 5).map((v, i) => ({ label: `L${i + 1}`, value: v }))}
      label="none"
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 12}
    />
  );
}

export function markCode(): string {
  return `<LikertStrip data={responses} />`;
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
