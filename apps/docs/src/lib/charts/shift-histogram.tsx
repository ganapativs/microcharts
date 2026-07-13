import { ShiftHistogram } from "@microcharts/react/shift-histogram";
import { ShiftHistogram as ShiftHistogramInteractive } from "@microcharts/react/shift-histogram/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// latency (ms) before/after a fix — the whole distribution moved left
export const BEFORE = Array.from({ length: 100 }, (_, i) => 120 + (i % 40) - 20);
export const AFTER = Array.from({ length: 100 }, (_, i) => 96 + (i % 40) - 20);
export const MS = (n: number) => `${Math.round(n)} ms`;

export const entry: ChartEntry = {
  name: "ShiftHistogram",
  slug: "shift-histogram",
  status: "stable",
  collection: "decision",
  tagline: "Did the fix actually change the distribution?",
  staticImport: `${PKG}/shift-histogram`,
  interactiveImport: `${PKG}/shift-histogram/interactive`,
  dataShape: "{ before: number[]; after: number[] }",
  encoding: {
    channel: "mirrored bin heights around a center + median shift",
    precision: "medium — shape read; the shift label is the takeaway",
  },
  nodeBudget: "2 per bin + 4",
  bestFor: [
    'a "the fix, proven" read in a KPI card',
    "before/after distributions in an experiments table",
    "showing a change is real, not just a mean move",
  ],
  avoidFor: ["a single distribution (HistogramStrip)", "two labelled arms (ABStrips)"],
  props: [
    {
      name: "data",
      type: "{ before: number[]; after: number[] }",
      required: true,
      description: "The two samples — raw observations, shared bin edges are derived.",
    },
    {
      name: "bins",
      type: "number",
      required: false,
      description: "Shared bin count (default auto, Sturges capped at 12).",
    },
    {
      name: "mode",
      type: '"mirror" | "overlay"',
      required: false,
      description: "Mirror (default) or after-as-outline over before fill.",
    },
    {
      name: "label",
      type: '"shift" | "none"',
      required: false,
      description: "Signed median shift in a right gutter.",
    },
  ],
  demo: AFTER,
  example: {
    title: "The fix",
    code: `import { ShiftHistogram } from "${PKG}/shift-histogram";\n\n<ShiftHistogram data={{ before, after }} title="The fix" />`,
  },
  sampleData: [
    {
      name: "before",
      code: `// latency (ms) before/after a fix — the whole distribution moved left
const before = Array.from({ length: 100 }, (_, i) => 120 + (i % 40) - 20);`,
    },
    {
      name: "after",
      code: `const after = Array.from({ length: 100 }, (_, i) => 96 + (i % 40) - 20);`,
    },
  ],
};

export function Preview() {
  return (
    <ShiftHistogram
      data={{ before: BEFORE, after: AFTER }}
      format={MS}
      summary={false}
      width={160}
      height={24}
    />
  );
}

export const showcase = {
  hint: "before vs after",
  Node: () => (
    <ShiftHistogram
      data={{ before: BEFORE, after: AFTER }}
      format={MS}
      title="The fix"
      width={160}
      height={24}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["mirror", "overlay"],
      init: "mirror",
    },
    { kind: "segmented", key: "bins", label: "bins", options: ["auto", "6", "10"], init: "auto" },
    { kind: "segmented", key: "label", label: "label", options: ["none", "shift"], init: "shift" },
  ],
  render: (s) => (
    <ShiftHistogram
      data={{ before: BEFORE, after: AFTER }}
      format={MS}
      mode={s.mode as "mirror" | "overlay"}
      bins={s.bins === "auto" ? undefined : Number(s.bins)}
      label={s.label as "shift" | "none"}
      summary={false}
      width={280}
      height={28}
    />
  ),
  code: (s) =>
    [
      "<ShiftHistogram",
      "  data={{ before, after }}",
      s.mode !== "mirror" && `  mode="${s.mode}"`,
      s.bins !== "auto" && `  bins={${s.bins}}`,
      s.label !== "shift" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ShiftHistogramInteractive
      data={{ before: BEFORE, after: AFTER }}
      format={MS}
      mode={s.mode as "mirror" | "overlay"}
      bins={s.bins === "auto" ? undefined : Number(s.bins)}
      label={s.label as "shift" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ShiftHistogram",
      "  data={{ before, after }}",
      s.mode !== "mirror" && `  mode="${s.mode}"`,
      s.bins !== "auto" && `  bins={${s.bins}}`,
      s.label !== "shift" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the bins — each announces the before/after proportions; M jumps to the median bins.",
};

export const recipes: Recipe[] = [
  {
    label: "overlay for similar shapes",
    code: `const before = Array.from({ length: 100 }, (_, i) => 120 + (i % 40) - 20);
const after = Array.from({ length: 100 }, (_, i) => 96 + (i % 40) - 20);

<ShiftHistogram data={{ before, after }} mode="overlay" />`,
    node: (
      <ShiftHistogram
        data={{ before: BEFORE, after: AFTER }}
        format={MS}
        mode="overlay"
        summary={false}
        width={180}
        height={24}
      />
    ),
  },
  {
    label: "no real shift",
    code: `const before = Array.from({ length: 100 }, (_, i) => 120 + (i % 40) - 20);

<ShiftHistogram data={{ before, after: before }} />`,
    node: (
      <ShiftHistogram
        data={{ before: BEFORE, after: BEFORE }}
        format={MS}
        summary={false}
        width={180}
        height={24}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const before = props.data.map((v) => 100 + (Math.abs(v) % 40));
  const after = props.data.map((v) => 80 + (Math.abs(v) % 40));
  return (
    <ShiftHistogram
      data={{ before, after }}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<ShiftHistogram data={{ before, after }} />`;
}

export function PreviewLive() {
  return (
    <ShiftHistogramInteractive
      data={{ before: BEFORE, after: AFTER }}
      format={MS}
      summary={false}
      width={160}
      height={24}
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
