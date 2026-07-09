import { DicePips } from "@microcharts/react/dice-pips";
import { InteractiveDemo } from "./dice-pips.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "DicePips",
  slug: "dice-pips",
  status: "stable",
  collection: "expressive",
  tagline: "A small count or severity, read instantly as a die face.",
  staticImport: `${PKG}/dice-pips`,
  interactiveImport: `${PKG}/dice-pips/interactive`,
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

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? Math.abs(Math.round(props.data[0]!)) % 7 : 4;
  return <DicePips value={v || 4} summary={false} size={props.height ?? 16} />;
}

export function markCode(): string {
  return `<DicePips value={4} />`;
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
