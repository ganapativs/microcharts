import { Constellation } from "@microcharts/react/constellation";
import { Constellation as ConstellationInteractive } from "@microcharts/react/constellation/interactive";
import { InteractiveDemo } from "./constellation.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

const INCIDENTS = [
  { x: 0, y: 40, m: 2 },
  { x: 2, y: 90, m: 7 },
  { x: 5, y: 30, m: 3 },
  { x: 8, y: 65, m: 5 },
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const monthFmt = (x: number) => MONTHS[x] ?? String(x);

export const entry: ChartEntry = {
  name: "Constellation",
  slug: "constellation",
  status: "stable",
  collection: "expressive",
  tagline: "When the rare events happened, and how big.",
  staticImport: `${PKG}/constellation`,
  interactiveImport: `${PKG}/constellation/interactive`,
  dataShape: "{ x: number; y?: number; m?: number }[]",
  encoding: { channel: "position (x = time, y = value) + area-true dot size", precision: "medium" },
  nodeBudget: "n+1",
  bestFor: [
    "sparse incidents or outages on a timeline",
    "milestones with a magnitude (severity, size)",
    "rare events where sequence is the story",
  ],
  avoidFor: [
    "dense event streams (Seismogram / EventTimeline)",
    "a continuous trend (Sparkline)",
    "precise value comparison (dot area is low precision)",
  ],
  props: [
    {
      name: "data",
      type: "{ x: number; y?: number; m?: number }[]",
      required: true,
      description: "Events: x = time, y = value, m = magnitude (area-true size).",
    },
    {
      name: "connect",
      type: "boolean",
      required: false,
      description: "The faint chronology line (default true).",
    },
    {
      name: "label",
      type: '"max" | "none"',
      required: false,
      description: "Numeral at the largest event.",
    },
    {
      name: "xFormat",
      type: "(x: number) => string",
      required: false,
      description: "Formats time for the summary (e.g. a month name).",
    },
  ],
  demo: [40, 90, 30, 65],
  example: {
    title: "Incidents",
    code: `import { Constellation } from "${PKG}/constellation";\n\n<Constellation\n  data={[\n    { x: 0, y: 40, m: 2 },\n    { x: 2, y: 90, m: 7 },\n    { x: 5, y: 30, m: 3 },\n    { x: 8, y: 65, m: 5 },\n  ]}\n  title="Incidents"\n/>`,
  },
};

export function Preview() {
  return <Constellation data={INCIDENTS} summary={false} width={90} height={26} />;
}

export const showcase = {
  hint: "rare events",
  Node: () => (
    <Constellation data={INCIDENTS} xFormat={monthFmt} title="Incidents" width={110} height={30} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "spike", label: "biggest", min: 40, max: 100, step: 5, init: 90 },
    { kind: "segmented", key: "connect", label: "connect", options: ["on", "off"], init: "on" },
    { kind: "segmented", key: "label", label: "label", options: ["none", "max"], init: "none" },
  ],
  render: (s) => (
    <Constellation
      data={[
        { x: 0, y: 40, m: 2 },
        { x: 2, y: s.spike as number, m: 7 },
        { x: 5, y: 30, m: 3 },
        { x: 8, y: 65, m: 5 },
      ]}
      connect={s.connect === "on"}
      label={s.label as "none" | "max"}
      summary={false}
      width={140}
      height={44}
    />
  ),
  code: (s) =>
    [
      "<Constellation",
      "  data={events}",
      s.connect !== "on" && "  connect={false}",
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ConstellationInteractive
      data={[
        { x: 0, y: 40, m: 2 },
        { x: 2, y: s.spike as number, m: 7 },
        { x: 5, y: 30, m: 3 },
        { x: 8, y: 65, m: 5 },
      ]}
      connect={s.connect === "on"}
      label={s.label as "none" | "max"}
      animate={ui.animate}
      summary={false}
      width={140}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Constellation",
      "  data={events}",
      s.connect !== "on" && "  connect={false}",
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or focus and arrow through the events chronologically — each announces its time, value, and magnitude through a polite live region. The connector is chronology only; toggle it off for a pure scatter.",
};

export const recipes: Recipe[] = [
  {
    label: "month labels in the summary",
    code: `const monthFmt = (x: number) => ["Jan","Feb","Mar","Apr","May","Jun"][x];\n\n<Constellation data={events} xFormat={monthFmt} />`,
    node: (
      <Constellation data={INCIDENTS} xFormat={monthFmt} summary={false} width={100} height={28} />
    ),
  },
  {
    label: "pure scatter (no chronology line)",
    code: `<Constellation data={events} connect={false} />`,
    node: (
      <Constellation data={INCIDENTS} connect={false} summary={false} width={100} height={28} />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const pts = props.data.length
    ? props.data.map((v, i) => ({ x: i, y: Math.abs(v), m: (Math.abs(v) % 5) + 1 }))
    : INCIDENTS;
  return (
    <Constellation
      data={pts}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<Constellation data={[{ x: 0, y: 40, m: 2 }, { x: 2, y: 90, m: 7 }]} />`;
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
