import { TokenConfidence } from "@microcharts/react/token-confidence";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

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
  tagline: "Which parts of generated text you should double-check: the text is the chart.",
  staticImport: `${PKG}/token-confidence`,
  interactiveImport: `${PKG}/token-confidence/interactive`,
  picker: false,
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
    code: `import { TokenConfidence } from "${PKG}/token-confidence";\n\n<TokenConfidence data={tokens} title="Model answer" />`,
  },
  sampleData: [
    {
      name: "tokens",
      code: `const tokens = [
  { token: "The", confidence: 0.98 },
  { token: " Treaty", confidence: 0.93 },
  { token: " of", confidence: 0.99 },
  { token: " Westphalia", confidence: 0.71 },
  { token: " was", confidence: 0.96 },
  { token: " signed", confidence: 0.9 },
  { token: " in", confidence: 0.97 },
  { token: " 1648", confidence: 0.44 },
];`,
    },
  ],
};

export function Preview() {
  return <TokenConfidence data={ANSWER} summary={false} style={{ fontSize: "0.8rem" }} />;
}
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

const CTX_ROWS = [
  { name: "facts", meta: "98%", data: ANSWER.slice(0, 8) },
  { name: "dates", meta: "71%", data: ANSWER.slice(4, 12) },
  { name: "names", meta: "88%", data: ANSWER.slice(8, 16) },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Model answer confidence{" "}
        <span className="mc-inline">
          <TokenConfidence
            data={ANSWER.slice(0, 6)}
            summary={false}
            style={{ fontSize: "0.7rem" }}
          />
        </span>{" "}
        — high on facts, dips on dates.
      </p>
    ),
    code: "<p>\n  Model answer confidence <TokenConfidence data={tokens} /> — high on facts, dips on dates.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <TokenConfidence data={row.data} summary={false} style={{ fontSize: "0.65rem" }} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <TokenConfidence data={tokens} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Confidence</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">98%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">peak token</span>
          </div>
        </div>
        <TokenConfidence
          data={ANSWER.slice(0, 10)}
          summary={false}
          style={{ fontSize: "0.85rem" }}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">98%</span>\n  <TokenConfidence data={tokens} />\n</div>',
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
            <TokenConfidence data={row.data} summary={false} style={{ fontSize: "0.55rem" }} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  facts <TokenConfidence data={tokens} />\n</button>',
  },
};

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
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModuleStatic;
