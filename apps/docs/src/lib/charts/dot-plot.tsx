import { DotPlot } from "@microcharts/react/dot-plot";
import { InteractiveDemo } from "./dot-plot.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const TEAM = [
  { label: "Ada", value: 96 },
  { label: "Kim", value: 41 },
  { label: "Sam", value: 88 },
  { label: "Noor", value: 73 },
  { label: "Lee", value: 60 },
];

export const entry: ChartEntry = {
  name: "DotPlot",
  slug: "dot-plot",
  status: "stable",
  collection: "core",
  tagline: "A few named values on one scale — minimum ink per comparison.",
  staticImport: `${PKG}/dot-plot`,
  interactiveImport: `${PKG}/dot-plot/interactive`,
  dataShape: "{ label, value }[]",
  encoding: { channel: "dot position on a common scale", precision: "high" },
  nodeBudget: "≤ 2 per row + text (rows ≤ 7)",
  bestFor: ["KPI leaderboards", "named comparisons in cards", "rows where bars would lie"],
  avoidFor: ["> 7 rows", "time series (Sparkline)"],
  props: [
    { name: "data", type: "{ label; value }[]", required: true, description: "Named values." },
    {
      name: "stem",
      type: "boolean",
      required: false,
      description: "Hairline from zero — flips to a magnitude read (zero-anchored domain forced).",
    },
    {
      name: "highlight",
      type: "number | string",
      required: false,
      description: "Accent one category.",
    },
    {
      name: "label",
      type: '"value" | "none"',
      required: false,
      description: "Value text beside each dot (drops out under 8-unit rows).",
    },
  ],
  demo: TEAM.map((d) => d.value),
  example: {
    title: "Team leaderboard",
    code: `import { DotPlot } from "${PKG}/dot-plot";\n\n<DotPlot data={team} title="Review scores" />`,
  },
};

export function Preview() {
  return <DotPlot data={TEAM} summary={false} style={{ width: 130, height: 70 }} />;
}

export const showcase = {
  hint: "comparison",
  Node: () => (
    <DotPlot data={TEAM} highlight="Ada" title="Review scores" style={{ width: 130, height: 70 }} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "stem", label: "stems", init: false },
    { kind: "toggle", key: "values", label: "value labels", init: false },
    { kind: "toggle", key: "highlight", label: "highlight Ada", init: false },
  ],
  render: (s) => (
    <DotPlot
      data={TEAM}
      stem={s.stem as boolean}
      label={(s.values as boolean) ? "value" : "none"}
      highlight={(s.highlight as boolean) ? "Ada" : undefined}
      summary={false}
      style={{ width: 220, height: 110 }}
    />
  ),
  code: (s) =>
    [
      "<DotPlot",
      "  data={team}",
      (s.stem as boolean) && "  stem",
      (s.values as boolean) && '  label="value"',
      (s.highlight as boolean) && '  highlight="Ada"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "KPI leaderboard",
    code: `<DotPlot data={team} label="value" highlight="Ada"\n  style={{ width: 140, height: 56 }} />`,
    node: (
      <DotPlot
        data={TEAM}
        label="value"
        highlight="Ada"
        summary={false}
        style={{ width: 140, height: 56 }}
      />
    ),
  },
  {
    label: "magnitude read (stems)",
    code: `// stems force a zero-anchored domain — position becomes magnitude\n<DotPlot data={team} stem />`,
    node: <DotPlot data={TEAM} stem summary={false} style={{ width: 140, height: 56 }} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <DotPlot
      data={props.data.slice(0, 4).map((v, i) => ({ label: `c${i + 1}`, value: v }))}
      summary={false}
      style={{ width: props.width ?? 60, height: props.height ?? 32 }}
    />
  );
}

export function markCode(): string {
  return `<DotPlot data={team} />`;
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
