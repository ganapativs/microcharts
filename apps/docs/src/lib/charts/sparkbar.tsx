import { SparkBar } from "@microcharts/react/sparkbar";
import { SparkBar as SparkBarInteractive } from "@microcharts/react/sparkbar/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { wave } from "./demo-data";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "SparkBar",
  slug: "sparkbar",
  status: "stable",
  collection: "core",
  tagline: "Compact bars for magnitude, or a win–loss streak of outcomes.",
  staticImport: `${PKG}/sparkbar`,
  interactiveImport: `${PKG}/sparkbar/interactive`,
  dataShape: "number[]",
  encoding: { channel: "length (bar height from a zero baseline)", precision: "high" },
  nodeBudget: "1 per bar",
  bestFor: ["discrete magnitudes", "win–loss streaks", "period-over-period counts"],
  avoidFor: ["continuous trend shape", "many hundreds of points"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Values; negatives dip below the baseline.",
    },
    {
      name: "mode",
      type: '"bar" | "winloss"',
      required: false,
      description: "Magnitude bars, or a win/loss/tie streak (sign only).",
    },
    {
      name: "gap",
      type: "number",
      required: false,
      description: "Empty fraction of each slot (0–0.9).",
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
  demo: [4, 6, 2, 8, 5, 9, 3, 7],
  example: {
    title: "Deploys per day",
    code: `import { SparkBar } from "${PKG}/sparkbar";\n\n<SparkBar data={[4, 6, 2, 8, 5, 9]} title="Deploys per day" />`,
  },
};

export function Preview() {
  return <SparkBar data={entry.demo} width={180} height={48} summary={false} />;
}

export const showcase = {
  hint: "magnitude",
  Node: () => (
    <SparkBarInteractive
      data={[5, 8, 3, 9, 6, 11, 4, 10, 7, 12]}
      width={150}
      height={44}
      title="Deploys per day"
    />
  ),
};

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover a bar, or focus and step through with ← →.">
      <SparkBarInteractive
        data={[5, 8, 3, 9, 6, 11, 4, 10, 7, 12, 8, 6]}
        width={340}
        height={92}
        label="last"
        className="w-full max-w-md"
        title="Deploys per day"
      />
    </DemoPanel>
  );
}

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "mode", options: ["bar", "winloss"], init: "bar" },
    { kind: "toggle", key: "label", init: false },
  ],
  data: [4, 6, 2, 8, 5, 9, 3, 7, 6, 10],
  shuffle: wave,
  render: (s, data) => {
    const shown = s.mode === "winloss" ? data.map((n) => (n % 2 === 0 ? 1 : -1)) : data;
    return (
      <SparkBar
        data={shown}
        width={340}
        height={92}
        mode={s.mode as "bar" | "winloss"}
        label={s.label ? "last" : "none"}
        className="w-full max-w-md"
        title="Playground"
      />
    );
  },
  code: (s, data) => {
    const shown = s.mode === "winloss" ? data.map((n) => (n % 2 === 0 ? 1 : -1)) : data;
    return [
      "<SparkBar",
      `  data={[${shown.join(", ")}]}`,
      `  mode="${s.mode}"`,
      s.label && '  label="last"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n");
  },
};

export const recipes: Recipe[] = [
  {
    label: "default",
    code: `// data alone → an intrinsic 80×20 box\n<SparkBar data={[4, 6, 2, 8, 5, 9]} />`,
    node: <SparkBar data={[4, 6, 2, 8, 5, 9]} summary={false} />,
  },
  {
    label: "fixed size",
    code: `// width & height are viewBox units — they also set the pixel box\n<SparkBar data={[4, 6, 2, 8, 5, 9]} width={200} height={48} />`,
    node: <SparkBar data={[4, 6, 2, 8, 5, 9]} width={200} height={48} summary={false} />,
  },
  {
    label: "responsive",
    code: `// omit width/height, let CSS drive the width — the viewBox keeps the ratio\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <SparkBar data={[4, 6, 2, 8, 5, 9]} style={{ width: "100%", height: "auto" }} />\n</div>`,
    fluid: true,
    node: (
      <SparkBar
        data={[4, 6, 2, 8, 5, 9]}
        style={{ width: "100%", height: "auto" }}
        summary={false}
      />
    ),
  },
];

export function Mark({ data, width, height }: { data: number[]; width?: number; height?: number }) {
  return <SparkBar data={data} width={width ?? 64} height={height ?? 18} summary={false} />;
}

export function markCode(width?: number, height?: number): string {
  const size = width && height ? ` width={${width}} height={${height}}` : "";
  return `<SparkBar data={data}${size} />`;
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
