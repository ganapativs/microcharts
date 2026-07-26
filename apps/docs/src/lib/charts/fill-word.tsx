import { FillWord } from "@microcharts/react/fill-word";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "FillWord",
  slug: "fill-word",
  status: "stable",
  collection: "expressive",
  tagline: "Progress on a named task, where the label is the bar.",
  staticImport: `${PKG}/fill-word`,
  interactiveImport: `${PKG}/fill-word/interactive`,
  picker: false,
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
    {
      name: "fontSize",
      type: "number",
      required: false,
      description:
        "Word type size in viewBox units (default 12) — here the word is the mark, so this sizes the chart.",
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

const CTX_ROWS = [
  { name: "avatar.png", meta: "62%", data: [0.51, 0.52, 0.54, 0.56, 0.57, 0.59, 0.6, 0.62] },
  { name: "report.pdf", meta: "100%", data: [0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.97, 1.0] },
  { name: "data.zip", meta: "18%", data: [0.15, 0.15, 0.16, 0.16, 0.17, 0.17, 0.18, 0.18] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Upload progress{" "}
        <span className="mc-inline">
          <FillWord word="uploading" value={0.62} fontSize={13} summary={false} />
        </span>{" "}
        — 62% of the file transferred.
      </p>
    ),
    code: '<p>\n  Upload progress{" "}\n  <span className="mc-inline">\n    <FillWord word="loading" value={0.62} summary={false} />\n  </span>{" "}\n  — 62% of the file transferred.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <FillWord word="uploading" value={row.data.at(-1)!} fontSize={13} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: '<td>\n  <FillWord word="loading" value={0.62} />\n</td>',
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Upload</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">62%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">complete</span>
          </div>
        </div>
        <FillWord word="uploading" value={0.62} fontSize={16} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">62%</span>\n  <span className="unit">complete</span>\n  <FillWord word="loading" value={0.62} />\n</div>',
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
            <FillWord word="uploading" value={row.data.at(-1)!} fontSize={11} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  avatar <FillWord word="loading" value={0.62} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? (Math.abs(props.data[0]!) % 100) / 100 : 0.62;
  return (
    <FillWord word="loading" value={v || 0.62} summary={false} fontSize={props.height ?? 13} />
  );
}

export function markCode(): string {
  return `<FillWord word="loading" value={0.62} />`;
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
