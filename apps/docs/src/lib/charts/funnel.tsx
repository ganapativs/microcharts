import { Funnel } from "@microcharts/react/funnel";
import { InteractiveDemo } from "./funnel.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const PIPE = [
  { label: "Visitors", value: 12400 },
  { label: "Signups", value: 5704 },
  { label: "Activated", value: 2730 },
  { label: "Paid", value: 1116 },
];

export const entry: ChartEntry = {
  name: "Funnel",
  slug: "funnel",
  status: "stable",
  collection: "core",
  tagline: "Where does the pipeline leak — stage-to-stage conversion in a cell.",
  staticImport: `${PKG}/funnel`,
  interactiveImport: `${PKG}/funnel/interactive`,
  dataShape: "{ label, value }[] (ordered stages)",
  encoding: {
    channel: "column height per stage, zero-anchored",
    precision: "high (rects, no trapezoid interpolation)",
  },
  nodeBudget: "2/stage − 1 (≤ 6 stages)",
  bestFor: ["per-campaign funnels in tables", "conversion in cards"],
  avoidFor: ["unordered categories (MiniBar)", "> 6 stages"],
  props: [
    { name: "data", type: "{ label; value }[]", required: true, description: "Ordered stages." },
    {
      name: "mode",
      type: '"absolute" | "rate"',
      required: false,
      description: "Rate = % of the FIRST stage (never the previous).",
    },
    {
      name: "connectors",
      type: "boolean",
      required: false,
      description: "Retained-share slats between stages.",
    },
    {
      name: "label",
      type: '"none" | "percent" | "value"',
      required: false,
      description: "Above each column (deterministic drop-out).",
    },
    {
      name: "highlight",
      type: "number | string",
      required: false,
      description: "Accent the leak stage.",
    },
  ],
  demo: PIPE.map((d) => d.value),
  example: {
    title: "Signup funnel",
    code: `import { Funnel } from "${PKG}/funnel";

const stages = [
  { label: "Visitors", value: 12400 },
  { label: "Signups", value: 5704 },
  { label: "Activated", value: 2730 },
  { label: "Paid", value: 1116 },
];

<Funnel data={stages} title="Signup funnel" />`,
  },
};

export function Preview() {
  return <Funnel data={PIPE} summary={false} width={130} height={40} />;
}

export const showcase = {
  hint: "conversion",
  Node: () => <Funnel data={PIPE} title="Signup funnel" width={130} height={40} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["absolute", "rate"],
      init: "absolute",
    },
    { kind: "toggle", key: "connectors", label: "connectors", init: true },
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["none", "percent", "value"],
      init: "none",
    },
  ],
  render: (s) => (
    <Funnel
      data={PIPE}
      mode={s.mode as "absolute" | "rate"}
      connectors={s.connectors as boolean}
      label={s.label as "none" | "percent" | "value"}
      summary={false}
      width={260}
      height={78}
    />
  ),
  code: (s) =>
    [
      "<Funnel",
      "  data={stages}",
      s.mode !== "absolute" && `  mode="${s.mode}"`,
      !(s.connectors as boolean) && "  connectors={false}",
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<Funnel data={campaign.stages} width={60} height={18} />`,
    node: <Funnel data={PIPE} summary={false} width={60} height={18} />,
  },
  {
    label: "the leak",
    code: `<Funnel data={stages} highlight="Activated" />`,
    node: <Funnel data={PIPE} highlight="Activated" summary={false} width={90} height={26} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <Funnel
      data={props.data.slice(0, 4).map((v, i) => ({ label: `s${i + 1}`, value: v }))}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<Funnel data={stages} />`;
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
