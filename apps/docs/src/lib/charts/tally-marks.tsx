import { TallyMarks } from "@microcharts/react/tally-marks";
import { InteractiveDemo } from "./tally-marks.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "TallyMarks",
  slug: "tally-marks",
  status: "stable",
  collection: "expressive",
  tagline: "How many — counted the way a human counts.",
  staticImport: `${PKG}/tally-marks`,
  interactiveImport: `${PKG}/tally-marks/interactive`,
  dataShape: "{ value: number }",
  encoding: { channel: "mark count in four-and-strike clusters of five", precision: "high" },
  nodeBudget: "2 (strokes + overflow numeral)",
  bestFor: [
    "a small running count in a sentence or cell",
    "a live event or score counter",
    "editorial / hand-tallied contexts (the drawn pen)",
  ],
  avoidFor: [
    "large magnitudes (MiniBar)",
    "trends over time (Sparkline)",
    "proportions (Progress)",
  ],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "The count. Floored; negatives clamp to 0.",
    },
    {
      name: "max",
      type: "number",
      required: false,
      description: "Marks drawn before overflow (default 25).",
    },
    {
      name: "overflow",
      type: '"numeral" | "clamp"',
      required: false,
      description:
        "numeral appends +N; clamp stops drawing. The summary always keeps the true count.",
    },
    {
      name: "pen",
      type: '"ruled" | "drawn"',
      required: false,
      description: "Hand-drawn jitter for editorial contexts.",
    },
  ],
  demo: [23],
  example: {
    title: "Signatures",
    code: `import { TallyMarks } from "${PKG}/tally-marks";\n\n<TallyMarks value={23} title="Signatures" />`,
  },
};

export function Preview() {
  return <TallyMarks value={23} summary={false} height={16} />;
}

export const showcase = {
  hint: "counted by hand",
  Node: () => <TallyMarks value={17} pen="drawn" title="Votes" height={22} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value", min: 0, max: 40, step: 1, init: 23 },
    { kind: "range", key: "max", label: "max", min: 5, max: 40, step: 5, init: 25 },
    { kind: "segmented", key: "pen", label: "pen", options: ["ruled", "drawn"], init: "ruled" },
    {
      kind: "segmented",
      key: "overflow",
      label: "overflow",
      options: ["numeral", "clamp"],
      init: "numeral",
    },
  ],
  render: (s) => (
    <TallyMarks
      value={s.value as number}
      max={s.max as number}
      pen={s.pen as "ruled" | "drawn"}
      overflow={s.overflow as "numeral" | "clamp"}
      title="Count"
      summary={false}
      height={28}
    />
  ),
  code: (s) =>
    [
      "<TallyMarks",
      `  value={${s.value}}`,
      s.max !== 25 && `  max={${s.max}}`,
      s.pen !== "ruled" && `  pen="${s.pen}"`,
      s.overflow !== "numeral" && `  overflow="${s.overflow}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "hand-drawn pen for an editorial count",
    code: `<TallyMarks value={17} pen="drawn" />`,
    node: <TallyMarks value={17} pen="drawn" summary={false} height={20} />,
  },
  {
    label: "cap the width — the numeral tells the truth past max",
    code: `<TallyMarks value={38} max={20} />`,
    node: <TallyMarks value={38} max={20} summary={false} height={20} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const value = props.data.length ? Math.abs(Math.round(props.data[0]!)) % 24 : 12;
  return <TallyMarks value={value || 12} summary={false} height={props.height ?? 16} />;
}

export function markCode(): string {
  return `<TallyMarks value={12} />`;
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
