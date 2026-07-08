import { Sparkline } from "@microcharts/react/sparkline";
import { Sparkline as SparklineInteractive } from "@microcharts/react/sparkline/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { wave } from "./demo-data";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "Sparkline",
  slug: "sparkline",
  status: "stable",
  collection: "core",
  tagline: "A trend over ordered values, small enough to sit in a sentence.",
  staticImport: `${PKG}/sparkline`,
  interactiveImport: `${PKG}/sparkline/interactive`,
  dataShape: "number[]",
  encoding: { channel: "position (length along a line)", precision: "high" },
  nodeBudget: "≤ 6",
  bestFor: ["inline trend", "table-cell trend", "KPI sparkline", "dense dashboards"],
  avoidFor: ["part-to-whole", "exact category comparison"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "The series. null/NaN are gaps.",
    },
    {
      name: "curve",
      type: '"linear" | "smooth" | "step"',
      required: false,
      description: "Line shape.",
    },
    {
      name: "fill",
      type: "boolean",
      required: false,
      description: "Zero-anchored area under the line.",
    },
    {
      name: "band",
      type: "[number, number]",
      required: false,
      description: "Constant normal-range band.",
    },
    {
      name: "dots",
      type: '"auto" | "minmax" | "none"',
      required: false,
      description: "Endpoint or min/max dots.",
    },
    {
      name: "label",
      type: '"none" | "last"',
      required: false,
      description: "Direct endpoint value label.",
    },
    {
      name: "title",
      type: "string",
      required: false,
      description: "Accessible name; joins the auto summary.",
    },
    {
      name: "summary",
      type: "string | false",
      required: false,
      description: "Override or disable the auto summary.",
    },
  ],
  demo: [3, 5, 4, 8, 6, 9, 7, 11, 10, 14],
  example: {
    title: "Weekly revenue",
    code: `import { Sparkline } from "${PKG}/sparkline";\n\n<Sparkline data={[3, 5, 4, 8, 6, 9]} title="Weekly revenue" />`,
  },
};

export function Preview() {
  return <Sparkline data={entry.demo} width={180} height={48} dots="minmax" summary={false} />;
}

export const showcase = {
  hint: "trend",
  Node: () => (
    <SparklineInteractive
      data={[8, 11, 9, 14, 12, 18, 15, 21, 19, 26, 24, 30]}
      width={150}
      height={44}
      dots="minmax"
      title="Revenue trend"
    />
  ),
};

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover the line, or focus it and walk points with ← →.">
      <SparklineInteractive
        data={[12, 15, 13, 18, 16, 22, 19, 24, 21, 28, 25, 31, 29, 36]}
        width={360}
        height={96}
        curve="smooth"
        dots="minmax"
        className="w-full max-w-md"
        title="Monthly active developers"
      />
    </DemoPanel>
  );
}

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "curve", options: ["linear", "smooth", "step"], init: "smooth" },
    { kind: "segmented", key: "dots", options: ["auto", "minmax", "none"], init: "minmax" },
    { kind: "toggle", key: "fill", init: false },
    { kind: "toggle", key: "band", init: false },
    { kind: "toggle", key: "label", init: true },
  ],
  data: wave(0),
  shuffle: wave,
  render: (s, data) => (
    <Sparkline
      data={data}
      width={340}
      height={92}
      curve={s.curve as "linear" | "smooth" | "step"}
      dots={s.dots as "auto" | "minmax" | "none"}
      fill={s.fill as boolean}
      band={s.band ? [10, 26] : undefined}
      label={s.label ? "last" : "none"}
      className="w-full max-w-md"
      title="Playground"
    />
  ),
  code: (s, data) =>
    [
      "<Sparkline",
      `  data={[${data.join(", ")}]}`,
      `  curve="${s.curve}"`,
      `  dots="${s.dots}"`,
      s.fill && "  fill",
      s.band && "  band={[10, 26]}",
      s.label && '  label="last"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "default",
    code: `// data alone → an intrinsic 80×20 box\n<Sparkline data={[3, 5, 4, 8, 6, 9]} />`,
    node: <Sparkline data={[3, 5, 4, 8, 6, 9]} summary={false} />,
  },
  {
    label: "fixed size",
    code: `// width & height are viewBox units — they also set the pixel box\n<Sparkline data={[3, 5, 4, 8, 6, 9]} width={200} height={48} />`,
    node: <Sparkline data={[3, 5, 4, 8, 6, 9]} width={200} height={48} summary={false} />,
  },
  {
    label: "responsive",
    code: `// omit width/height, let CSS drive the width — the viewBox keeps the ratio\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <Sparkline data={[3, 5, 4, 8, 6, 9]} style={{ width: "100%", height: "auto" }} />\n</div>`,
    fluid: true,
    node: (
      <Sparkline
        data={[3, 5, 4, 8, 6, 9]}
        style={{ width: "100%", height: "auto" }}
        summary={false}
      />
    ),
  },
];

export function Mark({ data, width, height }: { data: number[]; width?: number; height?: number }) {
  return <Sparkline data={data} width={width ?? 64} height={height ?? 18} summary={false} />;
}

export function markCode(width?: number, height?: number): string {
  const size = width && height ? ` width={${width}} height={${height}}` : "";
  return `<Sparkline data={data}${size} />`;
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
