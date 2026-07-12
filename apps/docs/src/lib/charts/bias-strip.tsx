import { BiasStrip } from "@microcharts/react/bias-strip";
import { BiasStrip as BiasStripInteractive } from "@microcharts/react/bias-strip/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

// a ~+2 bias with noise and two pairs beyond the limits of agreement
const DIFFS = [
  1.8, 2.4, 1.5, 2.9, 2.1, 1.2, 2.6, 3.0, 1.9, 2.3, 6.5, 2.0, 1.7, 2.8, 2.2, -1.5, 2.5, 1.6, 2.7,
  2.0,
];
const PAIRS = DIFFS.map((d, i) => ({ a: i + d, b: i }));

export const entry: ChartEntry = {
  name: "BiasStrip",
  slug: "bias-strip",
  status: "stable",
  collection: "frontier",
  tagline: "Do two ways of measuring the same thing systematically disagree?",
  staticImport: `${PKG}/bias-strip`,
  interactiveImport: `${PKG}/bias-strip/interactive`,
  dataShape: "{ a, b }[] (paired measurements)",
  encoding: { channel: "vertical position of the paired difference", precision: "high" },
  nodeBudget: "1 per pair (≤ 40) + band + 2 lines",
  bestFor: ["method-agreement checks in a cell", "instrument drift in a KPI card"],
  avoidFor: ["unpaired samples (MicroScatter)", "a single time series (Sparkline)"],
  props: [
    { name: "data", type: "{ a; b }[]", required: true, description: "Paired measurements." },
    {
      name: "limits",
      type: "number",
      required: false,
      description: "k in bias ± k·σ (default 1.96 ≈ 95% limits of agreement).",
    },
    {
      name: "label",
      type: '"bias" | "none"',
      required: false,
      description: "Seat-gated bias caption (default) or hidden.",
    },
    { name: "r", type: "number", required: false, description: "Base dot radius, clamped [1, 3]." },
  ],
  demo: DIFFS,
  example: {
    title: "Device vs reference",
    code: `import { BiasStrip } from "${PKG}/bias-strip";\n\n<BiasStrip data={pairs} title="Device vs reference" />`,
  },
  sampleData: [
    {
      name: "pairs",
      code: `// a ~+2 bias with noise and two pairs beyond the limits of agreement
const pairs = [
  1.8, 2.4, 1.5, 2.9, 2.1, 1.2, 2.6, 3.0, 1.9, 2.3, 6.5, 2.0, 1.7, 2.8, 2.2, -1.5, 2.5, 1.6, 2.7,
  2.0,
].map((d, i) => ({ a: i + d, b: i }));`,
    },
  ],
};

export function Preview() {
  return <BiasStrip data={PAIRS} summary={false} width={120} height={64} />;
}

export const showcase = {
  hint: "agreement",
  Node: () => <BiasStrip data={PAIRS} title="Device vs reference" width={120} height={64} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "wide", label: "99% limits", init: false },
    { kind: "toggle", key: "caption", label: "bias caption", init: true },
    { kind: "range", key: "r", label: "dot radius", min: 1, max: 3, step: 0.5, init: 1.5 },
  ],
  render: (s) => (
    <BiasStrip
      data={PAIRS}
      limits={(s.wide as boolean) ? 2.58 : 1.96}
      label={(s.caption as boolean) ? "bias" : "none"}
      r={s.r as number}
      summary={false}
      width={220}
      height={120}
    />
  ),
  code: (s) =>
    [
      "<BiasStrip",
      "  data={pairs}",
      (s.wide as boolean) && "  limits={2.58}",
      !(s.caption as boolean) && '  label="none"',
      s.r !== 1.5 && `  r={${s.r}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <BiasStripInteractive
      data={PAIRS}
      limits={(s.wide as boolean) ? 2.58 : 1.96}
      label={(s.caption as boolean) ? "bias" : "none"}
      r={s.r as number}
      summary={false}
      animate={ui.animate}
      width={220}
      height={120}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<BiasStrip",
      "  data={pairs}",
      (s.wide as boolean) && "  limits={2.58}",
      !(s.caption as boolean) && '  label="none"',
      s.r !== 1.5 && `  r={${s.r}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover the nearest pair or step by mean with ←/→ — each announces its mean, difference, and whether it clears the limits.",
};

export const recipes: Recipe[] = [
  {
    label: "in a sentence",
    code: `device and reference <BiasStrip data={pairs}\n  style={{ width: "3em", height: "1.6em" }} /> agree, +2 bias`,
    node: (
      <span>
        device and reference{" "}
        <BiasStrip data={PAIRS} summary={false} style={{ width: "3em", height: "1.6em" }} /> agree,
        +2 bias
      </span>
    ),
  },
  {
    label: "99% limits of agreement",
    code: `<BiasStrip data={pairs} limits={2.58} />`,
    node: <BiasStrip data={PAIRS} limits={2.58} summary={false} width={120} height={64} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <BiasStrip
      data={props.data.map((d, i) => ({ a: i + d, b: i }))}
      summary={false}
      width={props.width ?? 56}
      height={props.height ?? 30}
    />
  );
}

export function markCode(): string {
  return `<BiasStrip data={pairs} />`;
}

export function PreviewLive() {
  return <BiasStripInteractive data={PAIRS} summary={false} width={120} height={64} animate />;
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
