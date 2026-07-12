import { Hypnogram } from "@microcharts/react/hypnogram";
import { Hypnogram as HypnogramInteractive } from "@microcharts/react/hypnogram/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const SLEEP = [
  { t: 0, state: "Awake" },
  { t: 8, state: "Light" },
  { t: 22, state: "Deep" },
  { t: 38, state: "Light" },
  { t: 50, state: "REM" },
  { t: 62, state: "Light" },
  { t: 74, state: "Deep" },
  { t: 86, state: "Light" },
  { t: 98, state: "REM" },
  { t: 110, state: "Awake" },
];
export const STATES = ["Awake", "REM", "Light", "Deep"];
const DOM: [number, number] = [0, 120];

export const entry: ChartEntry = {
  name: "Hypnogram",
  slug: "hypnogram",
  status: "stable",
  collection: "frontier",
  tagline:
    "Which discrete state the system was in over time — and how choppy the transitions were.",
  staticImport: `${PKG}/hypnogram`,
  interactiveImport: `${PKG}/hypnogram/interactive`,
  dataShape: "{ t, state }[] (state holds until the next entry)",
  encoding: { channel: "row position (y = state, x = time), no interpolation", precision: "high" },
  nodeBudget: "≤ 3 paths",
  bestFor: ["sleep stages", "deploy / machine / incident state over time"],
  avoidFor: ["continuous signals (Sparkline)", "a single current state (StatusDot)"],
  props: [
    {
      name: "data",
      type: "{ t, state }[]",
      required: true,
      description: "State holds from t to the next entry.",
    },
    {
      name: "states",
      type: "string[]",
      required: false,
      description: "Row order top→bottom; ordinal semantics live here.",
    },
    {
      name: "emphasis",
      type: "string",
      required: false,
      description: "Accents one state — the decision read.",
    },
    {
      name: "variant",
      type: '"steps" | "lanes"',
      required: false,
      description: "Lanes for nominal states with no rank.",
    },
  ],
  demo: [0, 1, 2, 1, 3, 1, 0],
  example: {
    title: "Sleep stages",
    code: `import { Hypnogram } from "${PKG}/hypnogram";\n\n<Hypnogram data={sleep} states={["Awake","REM","Light","Deep"]} title="Sleep stages" />`,
  },
  sampleData: [
    {
      name: "sleep",
      code: `const sleep = [
  { t: 0, state: "Awake" },
  { t: 8, state: "Light" },
  { t: 22, state: "Deep" },
  { t: 38, state: "Light" },
  { t: 50, state: "REM" },
  { t: 62, state: "Light" },
  { t: 74, state: "Deep" },
  { t: 86, state: "Light" },
  { t: 98, state: "REM" },
  { t: 110, state: "Awake" },
];`,
    },
  ],
};

export function Preview() {
  return (
    <Hypnogram data={SLEEP} states={STATES} domain={DOM} summary={false} width={150} height={64} />
  );
}

export const showcase = {
  hint: "states",
  Node: () => (
    <Hypnogram
      data={SLEEP}
      states={STATES}
      domain={DOM}
      title="Sleep stages"
      width={150}
      height={64}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "variant",
      label: "variant",
      options: ["steps", "lanes"],
      init: "steps",
    },
    {
      kind: "segmented",
      key: "emphasis",
      label: "emphasis",
      options: ["none", "Deep", "REM", "Awake"],
      init: "none",
    },
    { kind: "toggle", key: "connectors", label: "connectors", init: true },
  ],
  render: (s) => (
    <Hypnogram
      data={SLEEP}
      states={STATES}
      domain={DOM}
      variant={s.variant as "steps" | "lanes"}
      emphasis={s.emphasis === "none" ? undefined : (s.emphasis as string)}
      connectors={s.connectors as boolean}
      summary={false}
      width={300}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<Hypnogram",
      "  data={sleep}",
      `  states={["Awake", "REM", "Light", "Deep"]}`,
      s.variant !== "steps" && `  variant="${s.variant}"`,
      s.emphasis !== "none" && `  emphasis="${s.emphasis}"`,
      s.connectors === false && "  connectors={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <HypnogramInteractive
      data={SLEEP}
      states={STATES}
      domain={DOM}
      variant={s.variant as "steps" | "lanes"}
      emphasis={s.emphasis === "none" ? undefined : (s.emphasis as string)}
      connectors={s.connectors as boolean}
      animate={ui.animate}
      summary={false}
      width={300}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Hypnogram",
      "  data={sleep}",
      `  states={["Awake", "REM", "Light", "Deep"]}`,
      s.variant !== "steps" && `  variant="${s.variant}"`,
      s.emphasis !== "none" && `  emphasis="${s.emphasis}"`,
      s.connectors === false && "  connectors={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow across the runs — each announces its state and time span.",
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<Hypnogram data={row.states} width={80} height={16} />`,
    node: (
      <Hypnogram data={SLEEP} states={STATES} domain={DOM} summary={false} width={80} height={16} />
    ),
  },
  {
    label: "lanes (nominal)",
    code: `<Hypnogram data={sleep} variant="lanes" />`,
    node: (
      <Hypnogram
        data={SLEEP}
        states={STATES}
        domain={DOM}
        variant="lanes"
        summary={false}
        width={160}
        height={64}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const names = ["Awake", "Light", "Deep", "REM"];
  const data = props.data
    .slice(0, 8)
    .map((v, i) => ({ t: i, state: names[Math.abs(Math.round(v)) % 4]! }));
  return (
    <Hypnogram
      data={data.length ? data : SLEEP}
      states={names}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<Hypnogram data={sleep} states={["Awake", "REM", "Light", "Deep"]} />`;
}

export function PreviewLive() {
  return (
    <HypnogramInteractive
      data={SLEEP}
      states={STATES}
      domain={DOM}
      summary={false}
      width={150}
      height={64}
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
