import { GradeProfile } from "@microcharts/react/grade-profile";
import { GradeProfile as GradeProfileInteractive } from "@microcharts/react/grade-profile/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const m = (n: number) => `${n} m`;
export const TRAIL = [
  { d: 0, elev: 800 },
  { d: 100, elev: 809 },
  { d: 250, elev: 812 },
  { d: 350, elev: 817 },
  { d: 500, elev: 835 },
  { d: 700, elev: 833 },
  { d: 900, elev: 865 },
];

export const entry: ChartEntry = {
  name: "GradeProfile",
  slug: "grade-profile",
  status: "stable",
  collection: "expressive",
  tagline: "How hard the route is, and where — pitches coloured by grade, the steepest called out.",
  staticImport: `${PKG}/grade-profile`,
  interactiveImport: `${PKG}/grade-profile/interactive`,
  dataShape: "{ d, elev }[] — distance + elevation in the same unit",
  encoding: {
    channel: "colour = quantized grade bin; area = elevation ridge; x = distance",
    precision: "medium — a difficulty read; the readout gives the exact grade",
  },
  nodeBudget: "1 quad per segment + ridge (+ seat-gated summit tick)",
  bestFor: ["route / climb profiles (cycling, running, hiking)", "where the hard pitches fall"],
  avoidFor: ["a single elevation series (Sparkline)", "non-monotone tracks (needs distance order)"],
  props: [
    {
      name: "data",
      type: "{ d: number; elev: number }[]",
      required: true,
      description: "Distance + elevation, monotonic in d, same unit so grade is a true percent.",
    },
    {
      name: "bins",
      type: "[number, number, number]",
      required: false,
      description: "Ascending grade % thresholds that quantize the four difficulty bins.",
    },
    {
      name: "label",
      type: '"max" | "none"',
      required: false,
      description: "Mark the steepest pitch, or render the profile alone.",
    },
  ],
  demo: [800, 865],
  example: {
    title: "Queen stage",
    code: `import { GradeProfile } from "${PKG}/grade-profile";\n\n<GradeProfile data={trail} format={(n) => \`\${n} m\`} title="Queen stage" />`,
  },
  sampleData: [
    {
      name: "trail",
      code: `const trail = [
  { d: 0, elev: 800 },
  { d: 100, elev: 809 },
  { d: 250, elev: 812 },
  { d: 350, elev: 817 },
  { d: 500, elev: 835 },
  { d: 700, elev: 833 },
  { d: 900, elev: 865 },
];`,
    },
  ],
};

export function Preview() {
  return <GradeProfile data={TRAIL} summary={false} width={150} height={44} />;
}

export const showcase = {
  hint: "steepest pitch",
  Node: () => <GradeProfile data={TRAIL} format={m} title="Queen stage" width={170} height={48} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "label", label: "summit label", init: true },
    {
      kind: "range",
      key: "hard",
      label: "brutal ≥",
      min: 8,
      max: 16,
      step: 1,
      init: 10,
    },
  ],
  render: (s) => (
    <GradeProfile
      data={TRAIL}
      label={s.label ? "max" : "none"}
      bins={[3, 6, Number(s.hard)]}
      format={m}
      summary={false}
      width={280}
      height={48}
    />
  ),
  code: (s) =>
    [
      "<GradeProfile",
      "  data={trail}",
      s.label === false && '  label="none"',
      s.hard !== 10 && `  bins={[3, 6, ${s.hard}]}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <GradeProfileInteractive
      data={TRAIL}
      label={s.label ? "max" : "none"}
      bins={[3, 6, Number(s.hard)]}
      format={m}
      animate={ui.animate}
      summary={false}
      width={280}
      height={48}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<GradeProfile",
      "  data={trail}",
      s.label === false && '  label="none"',
      s.hard !== 10 && `  bins={[3, 6, ${s.hard}]}`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover, or use ←/→ — each pitch announces its distance, true grade, and cumulative climb.",
};

export const recipes: Recipe[] = [
  {
    label: "stage cell",
    code: `<GradeProfile data={stage.profile} label="none" width={80} height={24} />`,
    node: <GradeProfile data={TRAIL} label="none" summary={false} width={80} height={24} />,
  },
  {
    label: "call out the wall",
    code: `<GradeProfile data={trail} bins={[4, 8, 12]} />`,
    node: (
      <GradeProfile
        data={TRAIL}
        bins={[4, 8, 12]}
        format={m}
        summary={false}
        width={200}
        height={46}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <GradeProfile
      data={TRAIL}
      label="none"
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 24}
    />
  );
}

export function markCode(): string {
  return `<GradeProfile data={trail} />`;
}

export default {
  entry,
  Preview,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
