import { StreakSpark } from "@microcharts/react/streak-spark";
import { StreakSpark as StreakSparkInteractive } from "@microcharts/react/streak-spark/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

// runs: 9 passing, 1 fail, 4 passing, 2 fail, 3 passing → current 3, record 9.
export const STREAK = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1];

export const entry: ChartEntry = {
  name: "StreakSpark",
  slug: "streak-spark",
  status: "stable",
  collection: "decision",
  tagline: "The current run against the record, with the texture of every streak and break.",
  staticImport: `${PKG}/streak-spark`,
  interactiveImport: `${PKG}/streak-spark/interactive`,
  dataShape: "(boolean | number | null)[]",
  encoding: {
    channel: "width = run length; height + opacity = run type; current run accented",
    precision: "high",
  },
  nodeBudget: "1 rect per run, cap 40",
  bestFor: [
    "pass/fail run histories",
    "uptime & incident-free streaks",
    "current vs record streaks",
  ],
  avoidFor: ["a continuous magnitude (SparkBar)", "a single ratio (Progress)"],
  props: [
    {
      name: "data",
      type: "(boolean | number | null)[]",
      required: true,
      description: "Outcomes; null is a gap that breaks the run. Numbers pass on > 0.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which outcome is the streak: pass (up) or fail (down).",
    },
    {
      name: "threshold",
      type: "number",
      required: false,
      description: "With numeric data, values ≥ threshold pass.",
    },
    {
      name: "label",
      type: '"current" | "both" | "none"',
      required: false,
      description: "Count labels: the current run, the record too, or neither.",
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
  demo: STREAK,
  example: {
    title: "Deploy streak",
    code: `import { StreakSpark } from "${PKG}/streak-spark";

// 1 = passing build, 0 = failing build
<StreakSpark
  data={[1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1]}
  title="Deploy streak"
/>`,
  },
};

export function Preview() {
  return <StreakSpark data={STREAK} width={180} height={48} summary={false} />;
}

export const showcase = {
  hint: "current vs record",
  Node: () => (
    <StreakSpark data={STREAK} label="both" title="Deploy streak" width={180} height={48} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "positive", label: "streak is", options: ["up", "down"], init: "up" },
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["current", "both", "none"],
      init: "current",
    },
  ],
  data: STREAK,
  shuffle: (seed) =>
    Array.from({ length: 22 }, (_, i) => (Math.sin((i + seed) * 1.7) > -0.3 ? 1 : 0)),
  render: (s, data) => (
    <StreakSpark
      data={data}
      positive={s.positive as "up" | "down"}
      label={s.label as "current" | "both" | "none"}
      width={340}
      height={92}
      className="w-full max-w-md"
      style={{ height: "auto" }}
      title="Playground"
    />
  ),
  code: (s, data) =>
    [
      "<StreakSpark",
      `  data={[${data.join(", ")}]}`,
      s.positive !== "up" && `  positive="${s.positive}"`,
      s.label !== "current" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, data, ui) => (
    <StreakSparkInteractive
      data={data}
      positive={s.positive as "up" | "down"}
      label={s.label as "current" | "both" | "none"}
      animate={ui.animate}
      width={340}
      height={92}
      className="w-full max-w-md"
      title="Playground"
    />
  ),
  codeInteractive: (s, data, ui) =>
    [
      "<StreakSpark",
      `  data={[${data.join(", ")}]}`,
      s.positive !== "up" && `  positive="${s.positive}"`,
      s.label !== "current" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover a run, or focus and step through with ← → — each run announces its length, outcome, and whether it is the record.",
};

export const recipes: Recipe[] = [
  {
    label: "default",
    code: `// data alone → an intrinsic 96×20 box\n<StreakSpark data={[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]} />`,
    node: <StreakSpark data={[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]} summary={false} />,
  },
  {
    label: "fixed size",
    code: `// width & height are viewBox units — they also set the pixel box\n<StreakSpark data={[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]} width={200} height={48} label="both" />`,
    node: (
      <StreakSpark
        data={[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]}
        width={200}
        height={48}
        label="both"
        summary={false}
      />
    ),
  },
  {
    label: "responsive",
    code: `// omit width/height, let CSS drive the width — the viewBox keeps the ratio\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <StreakSpark data={[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]} style={{ width: "100%", height: "auto" }} />\n</div>`,
    fluid: true,
    node: (
      <StreakSpark
        data={[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]}
        style={{ width: "100%", height: "auto" }}
        summary={false}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <StreakSpark
      data={STREAK}
      label="none"
      summary={false}
      width={props.width ?? 72}
      height={props.height ?? 18}
    />
  );
}

export function markCode(width?: number, height?: number): string {
  const size = width && height ? ` width={${width}} height={${height}}` : "";
  return `<StreakSpark data={data}${size} />`;
}

export function PreviewLive() {
  return <StreakSparkInteractive data={STREAK} width={180} height={48} summary={false} animate />;
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
