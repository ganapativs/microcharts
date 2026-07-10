import { RugStrip } from "@microcharts/react/rug-strip";
import { InteractiveDemo } from "./rug-strip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const FIELD = [42, 48, 51, 53, 55, 58, 61, 63, 66, 71, 55, 52, 49, 58, 62, 75, 83, 58, 54, 60];

export const entry: ChartEntry = {
  name: "RugStrip",
  slug: "rug-strip",
  status: "stable",
  collection: "core",
  tagline: "Where the raw observations actually sit — distribution without binning.",
  staticImport: `${PKG}/rug-strip`,
  interactiveImport: `${PKG}/rug-strip/interactive`,
  dataShape: "number[] (raw observations)",
  encoding: {
    channel: "tick position; density via ink accumulation",
    precision: "high per observation, medium for density",
  },
  nodeBudget: "≤ 4 (opacity-tiered tick paths + markValue)",
  bestFor: ['"you are here" in a band', "distribution beside a stat", "margin composition"],
  avoidFor: ["> 400 observations (HistogramStrip)", "trends over time (Sparkline)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Raw observations — position = value.",
    },
    {
      name: "markValue",
      type: "number",
      required: false,
      description: "One value emphasized against the field.",
    },
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      required: false,
      description: "Vertical rugs sit beside distributions.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Fix the scale across rows (rugs mislead worst under per-row autoscale).",
    },
  ],
  demo: FIELD,
  example: {
    title: "Salary band",
    code: `import { RugStrip } from "${PKG}/rug-strip";\n\n<RugStrip data={salaries} markValue={yourOffer} title="Pay band" />`,
  },
};

export function Preview() {
  return <RugStrip data={FIELD} markValue={62} summary={false} width={120} height={16} />;
}

export const showcase = {
  hint: "distribution",
  Node: () => <RugStrip data={FIELD} markValue={62} title="Pay band" width={120} height={16} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "markValue", label: "markValue", init: true },
    {
      kind: "segmented",
      key: "orientation",
      label: "orientation",
      options: ["horizontal", "vertical"],
      init: "horizontal",
    },
  ],
  data: FIELD,
  shuffle: (seed) => Array.from({ length: 24 }, (_, i) => 40 + ((i * (13 + seed)) % 47)),
  render: (s, data) => (
    <RugStrip
      data={data}
      markValue={(s.markValue as boolean) ? data[Math.floor(data.length / 2)] : undefined}
      orientation={s.orientation as "horizontal" | "vertical"}
      summary={false}
      style={s.orientation === "vertical" ? { width: 20, height: 140 } : { width: 220, height: 22 }}
    />
  ),
  code: (s) =>
    [
      "<RugStrip",
      "  data={observations}",
      (s.markValue as boolean) && "  markValue={you}",
      s.orientation === "vertical" && '  orientation="vertical"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "you vs the field",
    code: `<RugStrip data={salaries} markValue={78000}\n  domain={[40000, 120000]} />`,
    node: <RugStrip data={FIELD} markValue={75} summary={false} width={160} height={14} />,
  },
  {
    label: "fixed domain across rows",
    code: `// same scale per row or the rugs lie\n<RugStrip data={p50} domain={[0, 200]} />\n<RugStrip data={p95} domain={[0, 200]} />`,
    node: (
      <span className="inline-flex flex-col gap-1">
        <RugStrip data={FIELD} domain={[0, 200]} summary={false} width={160} height={10} />
        <RugStrip
          data={FIELD.map((v) => v * 1.9)}
          domain={[0, 200]}
          summary={false}
          width={160}
          height={10}
        />
      </span>
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <RugStrip
      data={props.data}
      summary={false}
      style={{ width: props.width ?? 60, height: props.height ?? 10 }}
    />
  );
}

export function markCode(): string {
  return `<RugStrip data={data} />`;
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
