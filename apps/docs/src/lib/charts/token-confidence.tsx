import { TokenConfidence } from "@microcharts/react/token-confidence";
import { TokenConfidence as TokenConfidenceInteractive } from "@microcharts/react/token-confidence/interactive";
import { InteractiveDemo } from "./token-confidence.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
export const ANSWER = [
  { token: "The", confidence: 0.98 },
  { token: " Treaty", confidence: 0.93 },
  { token: " of", confidence: 0.99 },
  { token: " Westphalia", confidence: 0.71 },
  { token: " was", confidence: 0.96 },
  { token: " signed", confidence: 0.9 },
  { token: " in", confidence: 0.97 },
  { token: " 1648", confidence: 0.44 },
  { token: ",", confidence: 0.98 },
  { token: " ending", confidence: 0.82 },
  { token: " the", confidence: 0.99 },
  { token: " Thirty", confidence: 0.63 },
  { token: " Years", confidence: 0.88 },
  { token: "'", confidence: 0.9 },
  { token: " War", confidence: 0.85 },
  { token: " over", confidence: 0.31 },
  { token: " a", confidence: 0.94 },
  { token: " decade", confidence: 0.38 },
  { token: ".", confidence: 0.99 },
];

export const entry: ChartEntry = {
  name: "TokenConfidence",
  slug: "token-confidence",
  status: "stable",
  collection: "frontier",
  tagline: "Which parts of generated text you should double-check — the text is the chart.",
  staticImport: `${PKG}/token-confidence`,
  interactiveImport: `${PKG}/token-confidence/interactive`,
  dataShape: "{ token, confidence }[] (confidence 0–1)",
  encoding: {
    channel: "typographic underline tier (color + thickness + style)",
    precision: "low by design",
  },
  nodeBudget: "1 span per token (HTML, not SVG)",
  bestFor: ["LLM answers in chat / transcripts", "flagging text to review"],
  avoidFor: ["numeric confidence auditing (CalibrationStrip)", "a single score (Delta)"],
  // HTML host (the documented SVG exception — the text IS the chart), so there
  // is no SVG mark for the entrance engine to animate.
  animates: false,
  props: [
    {
      name: "data",
      type: "{ token, confidence }[]",
      required: true,
      description: "Tokens + confidences.",
    },
    {
      name: "tiers",
      type: "readonly [number, number]",
      required: false,
      description: "lo/hi thresholds — the only tuning.",
    },
    {
      name: "show",
      type: '"flagged" | "all"',
      required: false,
      description: "All also hairlines confident tokens.",
    },
    {
      name: "legend",
      type: "boolean",
      required: false,
      description: "Appends the 1-line inline key.",
    },
  ],
  demo: [98, 71, 44, 63],
  example: {
    title: "Model answer",
    code: `import { TokenConfidence } from "${PKG}/token-confidence";

const tokens = [
  { token: "The", confidence: 0.98 },
  { token: " Treaty", confidence: 0.93 },
  { token: " of", confidence: 0.99 },
  { token: " Westphalia", confidence: 0.71 },
  { token: " was", confidence: 0.96 },
  { token: " signed", confidence: 0.9 },
  { token: " in", confidence: 0.97 },
  { token: " 1648", confidence: 0.44 },
];

<TokenConfidence data={tokens} title="Model answer" />`,
  },
};

export function Preview() {
  return <TokenConfidence data={ANSWER} summary={false} style={{ fontSize: "0.8rem" }} />;
}

export const showcase = {
  hint: "confidence",
  Node: () => (
    <TokenConfidence data={ANSWER} title="Model answer" style={{ fontSize: "0.85rem" }} />
  ),
};

export const playground: PlaygroundSpec = {
  // HTML host, not SVG (the documented Chart-root exception) — no entrance
  // motion to gate.
  animates: false,
  knobs: [
    { kind: "range", key: "lo", label: "guessing < ", min: 20, max: 60, init: 50 },
    { kind: "range", key: "hi", label: "confident ≥ ", min: 60, max: 95, init: 80 },
    { kind: "toggle", key: "all", label: "show all", init: false },
    { kind: "toggle", key: "legend", label: "legend", init: false },
  ],
  render: (s) => (
    <TokenConfidence
      data={ANSWER}
      tiers={[(s.lo as number) / 100, (s.hi as number) / 100]}
      show={s.all ? "all" : "flagged"}
      legend={s.legend as boolean}
      summary={false}
      style={{ fontSize: "0.95rem" }}
    />
  ),
  code: (s) =>
    [
      "<TokenConfidence",
      "  data={tokens}",
      `  tiers={[${((s.lo as number) / 100).toFixed(2)}, ${((s.hi as number) / 100).toFixed(2)}]}`,
      s.all === true && '  show="all"',
      s.legend === true && "  legend",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s) => (
    <TokenConfidenceInteractive
      data={ANSWER}
      tiers={[(s.lo as number) / 100, (s.hi as number) / 100]}
      show={s.all ? "all" : "flagged"}
      legend={s.legend as boolean}
      summary={false}
      style={{ fontSize: "0.95rem" }}
    />
  ),
  codeInteractive: (s) =>
    [
      "<TokenConfidence",
      "  data={tokens}",
      `  tiers={[${((s.lo as number) / 100).toFixed(2)}, ${((s.hi as number) / 100).toFixed(2)}]}`,
      s.all === true && '  show="all"',
      s.legend === true && "  legend",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Tab in, then use ←/→ to rove the flagged tokens — each announces its tier and confidence.",
};

export const recipes: Recipe[] = [
  {
    label: "in a sentence",
    code: `<p>The model said <TokenConfidence data={tokens} /></p>`,
    node: (
      <TokenConfidence data={ANSWER.slice(0, 8)} summary={false} style={{ fontSize: "0.85rem" }} />
    ),
  },
  {
    label: "with legend",
    code: `<TokenConfidence data={tokens} legend />`,
    node: (
      <TokenConfidence
        data={ANSWER.slice(0, 10)}
        legend
        summary={false}
        style={{ fontSize: "0.85rem" }}
      />
    ),
  },
];

export function Mark() {
  return (
    <TokenConfidence data={ANSWER.slice(0, 6)} summary={false} style={{ fontSize: "0.7rem" }} />
  );
}

export function markCode(): string {
  return `<TokenConfidence data={tokens} />`;
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
