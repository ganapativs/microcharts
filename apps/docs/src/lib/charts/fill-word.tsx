import { FillWord } from "@microcharts/react/fill-word";
import { FillWord as FillWordInteractive } from "@microcharts/react/fill-word/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "FillWord",
  slug: "fill-word",
  status: "stable",
  collection: "expressive",
  tagline: "Progress on a named task, where the label is the bar.",
  staticImport: `${PKG}/fill-word`,
  interactiveImport: `${PKG}/fill-word/interactive`,
  dataShape: "{ word: string; value: number }",
  encoding: { channel: "inked fraction of the word's own glyph extent", precision: "medium" },
  nodeBudget: "2 (+1 numeral)",
  bestFor: [
    "a labelled progress read in a sentence or cell",
    "a sync / upload status where the label names the task",
    "a quota or TTL where the word is the metric",
  ],
  avoidFor: [
    "precise percentages (Progress)",
    "trends (Sparkline)",
    "many parallel bars (MiniBar)",
  ],
  props: [
    { name: "word", type: "string", required: true, description: "The text that is the chart." },
    { name: "value", type: "number", required: true, description: "Fraction 0–1 (clamped)." },
    {
      name: "mode",
      type: '"fill" | "drain"',
      required: false,
      description: "fill grows the ink (complete); drain empties it (remaining / TTL).",
    },
    {
      name: "label",
      type: '"none" | "value"',
      required: false,
      description: "Append the percent numeral after the word.",
    },
  ],
  demo: [62],
  example: {
    title: "Upload",
    code: `import { FillWord } from "${PKG}/fill-word";\n\n<FillWord word="uploading" value={0.62} />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-center gap-4">
      <FillWord word="uploading" value={0.62} summary={false} fontSize={13} />
      <FillWord word="expiring" value={0.7} mode="drain" summary={false} fontSize={13} />
    </span>
  );
}

export const showcase = {
  hint: "the label is the bar",
  Node: () => <FillWord word="uploading" value={0.62} title="Upload" fontSize={16} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value %", min: 0, max: 100, step: 1, init: 62 },
    { kind: "segmented", key: "mode", label: "mode", options: ["fill", "drain"], init: "fill" },
    { kind: "toggle", key: "label", label: "show %", init: false },
  ],
  render: (s) => (
    <FillWord
      word={s.mode === "drain" ? "expiring" : "uploading"}
      value={(s.value as number) / 100}
      mode={s.mode as "fill" | "drain"}
      label={s.label ? "value" : "none"}
      summary={false}
      fontSize={18}
    />
  ),
  code: (s) =>
    [
      "<FillWord",
      `  word="${s.mode === "drain" ? "expiring" : "uploading"}"`,
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.mode !== "fill" && `  mode="${s.mode}"`,
      s.label && '  label="value"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <FillWordInteractive
      word={s.mode === "drain" ? "expiring" : "uploading"}
      value={(s.value as number) / 100}
      mode={s.mode as "fill" | "drain"}
      label={s.label ? "value" : "none"}
      summary={false}
      animate={ui.animate}
      fontSize={18}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<FillWord",
      `  word="${s.mode === "drain" ? "expiring" : "uploading"}"`,
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.mode !== "fill" && `  mode="${s.mode}"`,
      s.label && '  label="value"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Tap to advance — the accent ink edge glides along the word (reduced-motion → it jumps) and the new percentage is announced through a polite live region, throttled so a streaming value never spams.",
};

export const recipes: Recipe[] = [
  {
    label: "drain mode for a remaining-time story",
    code: `<FillWord word="expiring" value={0.7} mode="drain" />`,
    node: <FillWord word="expiring" value={0.7} mode="drain" summary={false} fontSize={14} />,
  },
  {
    label: "show the exact percent alongside",
    code: `<FillWord word="storage" value={0.4} label="value" />`,
    node: <FillWord word="storage" value={0.4} label="value" summary={false} fontSize={14} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? (Math.abs(props.data[0]!) % 100) / 100 : 0.62;
  return (
    <FillWord word="loading" value={v || 0.62} summary={false} fontSize={props.height ?? 13} />
  );
}

export function markCode(): string {
  return `<FillWord word="loading" value={0.62} />`;
}

export function PreviewLive() {
  return (
    <span className="inline-flex items-center gap-4">
      <FillWordInteractive word="uploading" value={0.62} summary={false} fontSize={13} animate />
      <FillWord word="expiring" value={0.7} mode="drain" summary={false} fontSize={13} />
    </span>
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
