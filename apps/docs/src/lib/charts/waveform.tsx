import { Waveform } from "@microcharts/react/waveform";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const WAVE = Array.from(
  { length: 200 },
  (_, i) =>
    (i === 126 ? 0.82 : Math.sin(i / 3) * 0.15 + Math.sin(i / 11) * 0.35) *
    (1 - Math.abs(i - 100) / 260),
);
const QUIET = WAVE.map((v, i) => v * (0.35 + (i % 7) * 0.04));
const LOUD = WAVE.map((v, i) => Math.min(1, v * (1.1 + (i % 5) * 0.06)));
const CLIPS: { name: string; samples: number[]; meta: string }[] = [
  { name: "Standup memo", samples: WAVE, meta: "peak 0.82 · 63%" },
  { name: "Support call", samples: LOUD, meta: "peak 0.91 · 41%" },
  { name: "Ambient room", samples: QUIET, meta: "peak 0.29 · 72%" },
];

export const entry: ChartEntry = {
  name: "Waveform",
  slug: "waveform",
  status: "stable",
  collection: "frontier",
  tagline:
    "The shape of a high-frequency signal, where its spikes and silences are, at word width.",
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

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Voice memo amplitude{" "}
        <span className="mc-inline">
          <Waveform data={WAVE} progress={0.63} summary={false} width={90} height={16} />
        </span>{" "}
        — peak 0.82 at 63%, 200 samples compressed to word width.
      </p>
    ),
    code: `<p>\n  Voice memo amplitude{" "}\n  <Waveform data={samples} progress={0.63} width={90} height={16} /> — peak 0.82 at 63%.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CLIPS.map((clip) => (
            <tr key={clip.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{clip.name}</td>
              <td className="py-1.5">
                <Waveform data={clip.samples} summary={false} width={72} height={16} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{clip.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <Waveform data={row.samples} width={72} height={16} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Voice memo</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">0.82</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">
              peak amplitude · 63% through
            </span>
          </div>
        </div>
        <Waveform data={WAVE} progress={0.63} summary={false} width={200} height={30} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">0.82</span>\n  <span className="unit">peak · 63% through</span>\n  <Waveform data={samples} progress={0.63} width={200} height={30} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {CLIPS.map((clip, i) => (
          <span
            key={clip.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {clip.name}
            <Waveform data={clip.samples} summary={false} width={54} height={14} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Standup memo <Waveform data={samples} width={54} height={14} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = props.data.length >= 16 ? props.data : WAVE;
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
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModuleStatic;
