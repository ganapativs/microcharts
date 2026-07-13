import { DualWindowMeter } from "@microcharts/react/dual-window-meter";
import { DualWindowMeter as DualWindowMeterInteractive } from "@microcharts/react/dual-window-meter/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const LOUDNESS = Array.from(
  { length: 60 },
  (_, i) => -22 + Math.sin(i / 3) * 4 + Math.sin(i / 11) * 2 - (i > 40 ? 2 : 0),
);

export const entry: ChartEntry = {
  name: "DualWindowMeter",
  slug: "dual-window-meter",
  status: "stable",
  collection: "frontier",
  tagline:
    "Is the level compliant against its target — right now and on average — spikes vs drift.",
  staticImport: `${PKG}/dual-window-meter`,
  interactiveImport: `${PKG}/dual-window-meter/interactive`,
  dataShape: "number[] raw series + target",
  encoding: { channel: "two co-plotted rolling means vs a target line", precision: "high" },
  nodeBudget: "≤ 6",
  bestFor: ["loudness / LUFS metering", "latency SLO or CPU-headroom compliance"],
  avoidFor: ["a single series (Sparkline)", "no target to compare against"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Raw samples; two rolling means are computed.",
    },
    {
      name: "target",
      type: "number",
      required: true,
      description: "The compliance line — required.",
    },
    {
      name: "windows",
      type: "[number, number]",
      required: false,
      description: "Fast/slow integration windows (samples).",
    },
    {
      name: "band",
      type: "[number, number]",
      required: false,
      description: "A compliance corridor instead of one line.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Fix the vertical scale instead of auto-fitting both traces.",
    },
  ],
  demo: [-22],
  example: {
    title: "Loudness",
    code: `import { DualWindowMeter } from "${PKG}/dual-window-meter";\n\n<DualWindowMeter\n  data={samples}\n  target={-23}\n  format={{ maximumFractionDigits: 1 }}\n  title="Loudness"\n/>`,
  },
  sampleData: [
    {
      name: "samples",
      code: `const samples = Array.from(
  { length: 60 },
  (_, i) => -22 + Math.sin(i / 3) * 4 + Math.sin(i / 11) * 2 - (i > 40 ? 2 : 0),
);`,
    },
  ],
};

export function Preview() {
  return (
    <DualWindowMeter
      data={LOUDNESS}
      target={-23}
      format={{ maximumFractionDigits: 1 }}
      summary={false}
      width={130}
      height={24}
    />
  );
}

export const showcase = {
  hint: "compliance",
  Node: () => (
    <DualWindowMeter
      data={LOUDNESS}
      target={-23}
      format={{ maximumFractionDigits: 1 }}
      title="Loudness"
      width={130}
      height={24}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "fast", label: "fast window", min: 2, max: 8, init: 3 },
    { kind: "range", key: "slow", label: "slow window", min: 12, max: 40, init: 30 },
    { kind: "toggle", key: "band", label: "corridor", init: false },
  ],
  render: (s) => (
    <DualWindowMeter
      data={LOUDNESS}
      target={-23}
      windows={[s.fast as number, s.slow as number]}
      band={s.band ? [-25, -21] : undefined}
      summary={false}
      width={320}
      height={28}
    />
  ),
  code: (s) =>
    [
      "<DualWindowMeter",
      "  data={samples}",
      "  target={-23}",
      `  windows={[${s.fast}, ${s.slow}]}`,
      s.band === true && "  band={[-25, -21]}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <DualWindowMeterInteractive
      data={LOUDNESS}
      target={-23}
      windows={[s.fast as number, s.slow as number]}
      band={s.band ? [-25, -21] : undefined}
      summary={false}
      animate={ui.animate}
      width={320}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<DualWindowMeter",
      "  data={samples}",
      "  target={-23}",
      `  windows={[${s.fast}, ${s.slow}]}`,
      s.band === true && "  band={[-25, -21]}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the samples — the thin fast window and thick slow window read against the target.",
};

export const recipes: Recipe[] = [
  {
    label: "latency SLO cell",
    code: `<DualWindowMeter data={samples} target={200} width={80} height={16} />`,
    node: (
      <DualWindowMeter
        data={LOUDNESS}
        target={-23}
        format={{ maximumFractionDigits: 1 }}
        summary={false}
        width={80}
        height={16}
      />
    ),
  },
  {
    label: "with corridor",
    code: `<DualWindowMeter data={samples} target={70} band={[60, 80]} />`,
    node: (
      <DualWindowMeter
        data={LOUDNESS}
        target={-23}
        band={[-25, -21]}
        summary={false}
        width={220}
        height={26}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = props.data.length >= 8 ? props.data : LOUDNESS;
  return (
    <DualWindowMeter
      data={data}
      target={data.reduce((a, b) => a + b, 0) / data.length}
      label="none"
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<DualWindowMeter data={samples} target={-23} />`;
}

export function PreviewLive() {
  return (
    <DualWindowMeterInteractive
      data={LOUDNESS}
      target={-23}
      format={{ maximumFractionDigits: 1 }}
      summary={false}
      width={130}
      height={24}
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
