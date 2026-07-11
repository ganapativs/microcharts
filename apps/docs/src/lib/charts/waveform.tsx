import { Waveform } from "@microcharts/react/waveform";
import { Waveform as WaveformInteractive } from "@microcharts/react/waveform/interactive";
import { InteractiveDemo } from "./waveform.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
export const WAVE = Array.from(
  { length: 200 },
  (_, i) =>
    (i === 126 ? 0.82 : Math.sin(i / 3) * 0.15 + Math.sin(i / 11) * 0.35) *
    (1 - Math.abs(i - 100) / 260),
);

export const entry: ChartEntry = {
  name: "Waveform",
  slug: "waveform",
  status: "stable",
  collection: "frontier",
  tagline:
    "The shape of a high-frequency signal — where its spikes and silences are — at word width.",
  staticImport: `${PKG}/waveform`,
  interactiveImport: `${PKG}/waveform/interactive`,
  dataShape: "number[] (amplitude samples, may be long)",
  encoding: { channel: "mirrored bar height = per-bucket max amplitude", precision: "medium" },
  nodeBudget: "≤ 3",
  bestFor: ["voice-memo / audio scrubbers", "high-frequency log volume"],
  avoidFor: ["exact values (Sparkline)", "categorical state (Hypnogram)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Amplitude samples; negatives allowed.",
    },
    {
      name: "progress",
      type: "number",
      required: false,
      description: "0–1 played fraction; left buckets tint accent.",
    },
    {
      name: "variant",
      type: '"bars" | "envelope"',
      required: false,
      description: "Envelope draws the min/max area.",
    },
    {
      name: "mirror",
      type: "boolean",
      required: false,
      description: "Mirror around center; false for magnitude-only.",
    },
  ],
  demo: [0.82],
  example: {
    title: "Voice memo",
    code: `import { Waveform } from "${PKG}/waveform";\n\n<Waveform data={samples} title="Voice memo" />`,
  },
  sampleData: [
    {
      name: "samples",
      code: `const samples = Array.from(
  { length: 200 },
  (_, i) =>
    (i === 126 ? 0.82 : Math.sin(i / 3) * 0.15 + Math.sin(i / 11) * 0.35) *
    (1 - Math.abs(i - 100) / 260),
);`,
    },
  ],
};

export function Preview() {
  return <Waveform data={WAVE} summary={false} width={130} height={26} />;
}

export const showcase = {
  hint: "signal",
  Node: () => <Waveform data={WAVE} progress={0.63} title="Voice memo" width={130} height={26} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "variant",
      label: "variant",
      options: ["bars", "envelope"],
      init: "bars",
    },
    { kind: "toggle", key: "mirror", label: "mirror", init: true },
    { kind: "range", key: "progress", label: "progress %", min: 0, max: 100, init: 63 },
  ],
  render: (s) => (
    <Waveform
      data={WAVE}
      variant={s.variant as "bars" | "envelope"}
      mirror={s.mirror as boolean}
      progress={(s.progress as number) / 100}
      summary={false}
      width={320}
      height={32}
    />
  ),
  code: (s) =>
    [
      "<Waveform",
      "  data={samples}",
      s.variant !== "bars" && `  variant="${s.variant}"`,
      s.mirror === false && "  mirror={false}",
      `  progress={${((s.progress as number) / 100).toFixed(2)}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <WaveformInteractive
      data={WAVE}
      variant={s.variant as "bars" | "envelope"}
      mirror={s.mirror as boolean}
      progress={(s.progress as number) / 100}
      animate={ui.animate}
      summary={false}
      width={320}
      height={32}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Waveform",
      "  data={samples}",
      s.variant !== "bars" && `  variant="${s.variant}"`,
      s.mirror === false && "  mirror={false}",
      `  progress={${((s.progress as number) / 100).toFixed(2)}}`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the buckets — each announces its position and peak amplitude.",
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<Waveform data={row.samples} width={60} height={14} />`,
    node: <Waveform data={WAVE} summary={false} width={60} height={14} />,
  },
  {
    label: "envelope",
    code: `<Waveform data={samples} variant="envelope" />`,
    node: <Waveform data={WAVE} variant="envelope" summary={false} width={200} height={28} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = props.data.length ? props.data : WAVE;
  return (
    <Waveform data={data} summary={false} width={props.width ?? 60} height={props.height ?? 14} />
  );
}

export function markCode(): string {
  return `<Waveform data={samples} />`;
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
