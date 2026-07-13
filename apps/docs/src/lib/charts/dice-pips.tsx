import { DicePips } from "@microcharts/react/dice-pips";
import { DicePips as DicePipsInteractive } from "@microcharts/react/dice-pips/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "DicePips",
  slug: "dice-pips",
  status: "stable",
  collection: "expressive",
  tagline: "A small count or severity, read instantly as a die face.",
  staticImport: `${PKG}/dice-pips`,
  interactiveImport: `${PKG}/dice-pips/interactive`,
  // Pip changes already cross-fade (one-shot WAAPI value-transition in
  // client.tsx) — a mount entrance would fight that existing motion, so this
  // chart has no `animate` prop at all.
  animates: false,
  dataShape: "{ value: number }",
  encoding: { channel: "canonical pip pattern 1–6 (subitized)", precision: "high" },
  nodeBudget: "≤ 7 (face + 6 pips)",
  bestFor: [
    "severity or rating 0–6 in a cell",
    "an at-a-glance small count in a sentence",
    "an incident-severity badge",
  ],
  avoidFor: ["counts above 6 (TallyMarks)", "magnitudes (MiniBar)", "proportions (Progress)"],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "Integer 0–6 (rounded); above 6 shows a numeral.",
    },
    {
      name: "face",
      type: "boolean",
      required: false,
      description: "Draw the die outline (default true).",
    },
  ],
  demo: [4],
  example: {
    title: "Severity",
    code: `import { DicePips } from "${PKG}/dice-pips";\n\n<DicePips value={4} title="Severity" />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-center gap-3">
      {[1, 2, 3, 4, 5, 6].map((v) => (
        <DicePips key={v} value={v} summary={false} size={18} />
      ))}
    </span>
  );
}

export const showcase = {
  hint: "subitized",
  Node: () => <DicePips value={5} title="Severity" size={24} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value", min: 0, max: 9, step: 1, init: 4 },
    { kind: "toggle", key: "face", label: "face", init: true },
  ],
  render: (s) => (
    <DicePips value={s.value as number} face={s.face as boolean} summary={false} size={44} />
  ),
  code: (s) =>
    ["<DicePips", `  value={${s.value}}`, s.face === false && "  face={false}", "/>"]
      .filter(Boolean)
      .join("\n"),
  // No `animate` prop exists on this chart (see entry.animates) — the pips'
  // own value-transition cross-fade is the only motion; renderInteractive
  // still demonstrates the interactive entry itself.
  renderInteractive: (s) => (
    <DicePipsInteractive
      value={s.value as number}
      face={s.face as boolean}
      summary={false}
      size={44}
    />
  ),
  codeInteractive: (s) =>
    ["<DicePips", `  value={${s.value}}`, s.face === false && "  face={false}", "/>"]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Tap to roll — the pip set cross-fades to the new face and the value is announced through a polite live region. The pips are one value, so there is no cursor to move.",
  animates: false,
};

export const recipes: Recipe[] = [
  {
    label: "pips-only for dense columns",
    code: `<DicePips value={5} face={false} />`,
    node: <DicePips value={5} face={false} summary={false} size={20} />,
  },
  {
    label: "above 6 shows the exact numeral — no invented pattern",
    code: `<DicePips value={9} />`,
    node: <DicePips value={9} summary={false} size={20} />,
  },
];

const CTX_ROWS = [
  { name: "INC-142", meta: "4" },
  { name: "INC-141", meta: "2" },
  { name: "INC-140", meta: "5" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Incident severity{" "}
        <span className="mc-inline">
          <DicePips value={5} size={20} summary={false} />
        </span>{" "}
        — rated 4 of 6, elevated but not critical.
      </p>
    ),
    code: "<p>\n  Incident severity <DicePips value={4} /> — rated 4 of 6, elevated but not critical.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <DicePips value={5} size={22} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <DicePips value={4} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Severity</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">4</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">of 6</span>
          </div>
        </div>
        <DicePips value={5} size={48} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">4</span>\n  <span className="unit">of 6</span>\n  <DicePips value={4} />\n</div>',
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
            <DicePips value={5} size={18} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  INC-142 <DicePips value={4} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? Math.abs(Math.round(props.data[0]!)) % 7 : 4;
  return <DicePips value={v || 4} summary={false} size={props.height ?? 16} />;
}

export function markCode(): string {
  return `<DicePips value={4} />`;
}

export function PreviewLive() {
  return (
    <span className="inline-flex items-center gap-3">
      {[1, 2, 3, 4, 5, 6].map((v) => (
        <DicePipsInteractive key={v} value={v} summary={false} size={18} />
      ))}
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
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
