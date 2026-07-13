import { ABStrips } from "@microcharts/react/ab-strips";
import { ABStrips as ABStripsInteractive } from "@microcharts/react/ab-strips/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// two latency arms (ms): B (test) centered a bit lower than A (control), overlapping
export const A = Array.from({ length: 80 }, (_, i) => 130 + ((i * 13) % 44) - 22);
export const B = Array.from({ length: 80 }, (_, i) => 116 + ((i * 13) % 44) - 22);
export const MS = (n: number) => `${Math.round(n)} ms`;

export const entry: ChartEntry = {
  name: "ABStrips",
  slug: "ab-strips",
  status: "stable",
  collection: "decision",
  tagline: "Did B beat A — and by more than the overlap?",
  staticImport: `${PKG}/ab-strips`,
  interactiveImport: `${PKG}/ab-strips/interactive`,
  dataShape: "{ a: number[]; b: number[] } — the two arms",
  encoding: {
    channel: "two graded quantile strips on one scale; the overlap is the answer",
    precision: "medium — interval read; the delta label restores a number",
  },
  nodeBudget: "≤ 10",
  bestFor: [
    "an A/B experiment result in a KPI card",
    "control vs test in an experiments table",
    "any two-sample comparison where the spread matters",
  ],
  avoidFor: ["a single distribution (BenchmarkStrip)", "more than two arms (small multiples)"],
  props: [
    {
      name: "data",
      type: "{ a: number[]; b: number[] }",
      required: true,
      description: "The two arms — raw samples, not summaries.",
    },
    {
      name: "labels",
      type: "[string, string]",
      required: false,
      description: "Row identities for the gutter tags + summary (default ['A', 'B']).",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which direction of the B−A delta reads as good (colors the delta).",
    },
    {
      name: "label",
      type: '"delta" | "none"',
      required: false,
      description: "Signed median delta in a right gutter.",
    },
  ],
  demo: B,
  example: {
    title: "Latency A/B",
    code: `import { ABStrips } from "${PKG}/ab-strips";\n\nconst control = Array.from({ length: 80 }, (_, i) => 130 + ((i * 13) % 44) - 22);\nconst test = Array.from({ length: 80 }, (_, i) => 116 + ((i * 13) % 44) - 22);\n\n<ABStrips data={{ a: control, b: test }} positive="down" title="Latency A/B" />`,
  },
};

export function Preview() {
  return (
    <ABStrips
      data={{ a: A, b: B }}
      format={MS}
      positive="down"
      summary={false}
      width={160}
      height={22}
    />
  );
}

export const showcase = {
  hint: "A vs B, with spread",
  Node: () => (
    <ABStrips
      data={{ a: A, b: B }}
      format={MS}
      positive="down"
      title="Latency A/B"
      width={160}
      height={22}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "positive",
      label: "good dir",
      options: ["down", "up"],
      init: "down",
    },
    { kind: "segmented", key: "label", label: "label", options: ["none", "delta"], init: "delta" },
  ],
  render: (s) => (
    <ABStrips
      data={{ a: A, b: B }}
      format={MS}
      positive={s.positive as "up" | "down"}
      label={s.label as "delta" | "none"}
      summary={false}
      width={280}
      height={26}
    />
  ),
  code: (s) =>
    [
      "<ABStrips",
      "  data={{ a: control, b: test }}",
      s.positive === "down" && '  positive="down"',
      s.label !== "delta" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ABStripsInteractive
      data={{ a: A, b: B }}
      format={MS}
      positive={s.positive as "up" | "down"}
      label={s.label as "delta" | "none"}
      summary={false}
      animate={ui.animate}
      width={280}
      height={26}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ABStrips",
      "  data={{ a: control, b: test }}",
      s.positive === "down" && '  positive="down"',
      s.label !== "delta" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow (↑/↓ rows, ←/→ edges) — the median announces the delta vs the other arm; other edges announce the percentile.",
};

export const recipes: Recipe[] = [
  {
    label: "labelled arms",
    code: `<ABStrips data={{ a: control, b: test }} labels={["Control", "Test"]} />`,
    node: (
      <ABStrips
        data={{ a: A, b: B }}
        format={MS}
        labels={["Ctrl", "Test"]}
        summary={false}
        width={180}
        height={22}
      />
    ),
  },
  {
    label: "clearly separated",
    code: `<ABStrips data={{ a: slow, b: fast }} />`,
    node: (
      <ABStrips
        data={{ a: A.map((v) => v + 40), b: B }}
        format={MS}
        positive="down"
        summary={false}
        width={180}
        height={22}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const a = props.data.map((v) => 120 + (Math.abs(v) % 30));
  const b = props.data.map((v) => 108 + (Math.abs(v) % 30));
  return (
    <ABStrips
      data={{ a, b }}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<ABStrips data={{ a, b }} />`;
}

export function PreviewLive() {
  return (
    <ABStripsInteractive
      data={{ a: A, b: B }}
      format={MS}
      positive="down"
      summary={false}
      width={160}
      height={22}
      animate
    />
  );
}

export default {
  entry,
  Preview,
  PreviewLive,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
