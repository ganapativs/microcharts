import { Delta } from "@microcharts/react/delta";
import { Delta as DeltaInteractive } from "@microcharts/react/delta/interactive";
import { InteractiveDemo } from "./delta.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "Delta",
  slug: "delta",
  status: "stable",
  collection: "core",
  tagline: "A signed change, double-encoded by glyph and color.",
  staticImport: `${PKG}/delta`,
  interactiveImport: `${PKG}/delta/interactive`,
  dataShape: "number (+ optional from)",
  encoding: { channel: "text + direction glyph (▲/▼)", precision: "high — it is the number" },
  nodeBudget: "2 (glyph + value, HTML)",
  bestFor: ["KPI change", "period-over-period %", "inline metric movement"],
  avoidFor: ["showing a series", "magnitude across many items"],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "The change, or current value when from is set.",
    },
    {
      name: "from",
      type: "number",
      required: false,
      description: "Prior value; Delta shows the percent change.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which direction is good (colors only).",
    },
    {
      name: "format",
      type: "Intl.NumberFormatOptions | fn",
      required: false,
      description: "Number formatting.",
    },
    {
      name: "summary",
      type: "string | false",
      required: false,
      description: "Override or disable the auto summary.",
    },
  ],
  demo: [0.124],
  example: {
    title: "Revenue change",
    code: `import { Delta } from "${PKG}/delta";\n\n<Delta value={0.124} title="Revenue vs last week" />`,
  },
};

export function Preview() {
  return (
    <span className="text-2xl">
      <Delta value={0.184} summary={false} />
    </span>
  );
}

export const showcase = {
  hint: "change",
  Node: () => (
    <span className="text-lg">
      <DeltaInteractive value={0.184} title="Growth vs last week" live />
    </span>
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "pct", label: "change %", min: -50, max: 50, init: 12 },
    { kind: "segmented", key: "positive", label: "good dir", options: ["up", "down"], init: "up" },
  ],
  render: (s) => (
    <span className="text-3xl">
      <Delta
        value={(s.pct as number) / 100}
        positive={s.positive as "up" | "down"}
        summary={false}
      />
    </span>
  ),
  code: (s) =>
    [
      "<Delta",
      `  value={${(s.pct as number) / 100}}`,
      s.positive === "down" && '  positive="down"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "inherits text size",
    code: `// Delta is text — it takes the font-size of whatever wraps it\n<span style={{ fontSize: "1rem" }}>\n  Revenue <Delta value={0.124} />\n</span>`,
    node: (
      <span style={{ fontSize: "1rem" }}>
        Revenue <Delta value={0.124} summary={false} />
      </span>
    ),
  },
  {
    label: "larger",
    code: `// scale it up beside a KPI figure by lifting the font-size\n<span style={{ fontSize: "1.75rem" }}>\n  <Delta value={0.124} />\n</span>`,
    node: (
      <span style={{ fontSize: "1.75rem" }}>
        <Delta value={0.124} summary={false} />
      </span>
    ),
  },
];

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <Delta value={0.124} summary={false} />;
}

export function markCode(): string {
  return `<Delta value={0.124} />`;
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
