import { TrendArrow } from "@microcharts/react/trend-arrow";
import { InteractiveDemo } from "./trend-arrow.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const PCT = { style: "percent", maximumFractionDigits: 0 } as const;

export const entry: ChartEntry = {
  name: "TrendArrow",
  slug: "trend-arrow",
  status: "stable",
  collection: "core",
  tagline: "Which way is this moving — at glyph size, before any number.",
  staticImport: `${PKG}/trend-arrow`,
  interactiveImport: `${PKG}/trend-arrow/interactive`,
  dataShape: "number (signed change)",
  encoding: {
    channel: "glyph orientation (up / down / flat)",
    precision: "low — use Delta when the magnitude matters",
  },
  nodeBudget: "≤ 2 (glyph + optional value)",
  bestFor: ["table direction columns", "dense dashboards", "inline movement cues"],
  avoidFor: ["exact magnitudes (use Delta)", "series shape (use Sparkline)"],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "Signed change; sign → direction, magnitude only via showValue/summary.",
    },
    {
      name: "flatBand",
      type: "number",
      required: false,
      description: "Noise floor: |value| ≤ flatBand renders the flat glyph.",
    },
    {
      name: "glyph",
      type: '"arrow" | "triangle" | "chevron"',
      required: false,
      description: "Mark weight: default legibility, dense cells, inline text.",
    },
    {
      name: "showValue",
      type: "boolean",
      required: false,
      description: "Append the formatted value in a right gutter.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which direction is good (colors only, never the glyph).",
    },
  ],
  demo: [0.12],
  example: {
    title: "Latency direction",
    code: `import { TrendArrow } from "${PKG}/trend-arrow";\n\n<TrendArrow value={-0.08} positive="down" title="Latency vs last week" />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-center gap-3">
      <TrendArrow value={0.3} summary={false} />
      <TrendArrow value={0} summary={false} />
      <TrendArrow value={-0.3} summary={false} />
    </span>
  );
}

export const showcase = {
  hint: "direction",
  Node: () => (
    <TrendArrow
      value={0.12}
      showValue
      format={PCT}
      title="WAU change"
      style={{ width: 40, height: 22 }}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "pct", label: "change %", min: -50, max: 50, init: 12 },
    { kind: "range", key: "flatBand", label: "flat band %", min: 0, max: 20, init: 0 },
    {
      kind: "segmented",
      key: "glyph",
      label: "glyph",
      options: ["arrow", "triangle", "chevron"],
      init: "arrow",
    },
    { kind: "toggle", key: "showValue", label: "show value", init: false },
    { kind: "segmented", key: "positive", label: "good dir", options: ["up", "down"], init: "up" },
  ],
  render: (s) => (
    <TrendArrow
      value={(s.pct as number) / 100}
      flatBand={(s.flatBand as number) / 100}
      glyph={s.glyph as "arrow" | "triangle" | "chevron"}
      showValue={s.showValue as boolean}
      positive={s.positive as "up" | "down"}
      format={PCT}
      summary={false}
      style={{ width: (s.showValue as boolean) ? 96 : 48, height: 48 }}
    />
  ),
  code: (s) =>
    [
      "<TrendArrow",
      `  value={${(s.pct as number) / 100}}`,
      (s.flatBand as number) > 0 && `  flatBand={${(s.flatBand as number) / 100}}`,
      s.glyph !== "arrow" && `  glyph="${s.glyph}"`,
      (s.showValue as boolean) && "  showValue",
      s.positive === "down" && '  positive="down"',
      '  format={{ style: "percent", maximumFractionDigits: 0 }}',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "matches the text",
    code: `// size the glyph in em so it rides the surrounding type\n<span>\n  Errors <TrendArrow value={0.4} positive="down" style={{ width: "1em", height: "1em" }} />\n</span>`,
    node: (
      <span>
        Errors{" "}
        <TrendArrow
          value={0.4}
          positive="down"
          summary={false}
          style={{ width: "1em", height: "1em" }}
        />
      </span>
    ),
  },
  {
    label: "with the number",
    code: `// showValue widens the viewBox for the formatted value\n<TrendArrow value={0.12} showValue format={{ style: "percent" }}\n  style={{ height: 22 }} />`,
    node: <TrendArrow value={0.12} showValue format={PCT} summary={false} style={{ height: 22 }} />,
  },
];

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <TrendArrow value={0.12} summary={false} />;
}

export function markCode(): string {
  return `<TrendArrow value={0.12} />`;
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
