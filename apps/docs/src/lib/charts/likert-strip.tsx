import { LikertStrip } from "@microcharts/react/likert-strip";
import { InteractiveDemo } from "./likert-strip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const SURVEY = [
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
  tagline: "Does the response lean agree or disagree — and how hard.",
  staticImport: `${PKG}/likert-strip`,
  interactiveImport: `${PKG}/likert-strip/interactive`,
  dataShape: "{ label, value }[] ordered most-negative → most-positive (2–7 levels)",
  encoding: {
    channel: "signed segment length from a center line",
    precision: "medium — MiniBar for exact per-level values",
  },
  nodeBudget: "≤ 10 (≤ 7 segments + hairline + 2 labels)",
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
    {
      name: "mode",
      type: '"share" | "count"',
      required: false,
      description: "Percent normalization or raw counts on a fixed max.",
    },
  ],
  demo: SURVEY.map((d) => d.value),
  example: {
    title: "Q1 satisfaction",
    code: `import { LikertStrip } from "${PKG}/likert-strip";\n\n<LikertStrip data={responses} title="Q1 satisfaction" />`,
  },
};

export function Preview() {
  return <LikertStrip data={SURVEY} summary={false} width={130} height={20} />;
}

export const showcase = {
  hint: "sentiment",
  Node: () => <LikertStrip data={SURVEY} title="Q1 satisfaction" width={130} height={20} />,
};

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
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
