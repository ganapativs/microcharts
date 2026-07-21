import { DualWindowMeter } from "@microcharts/react/dual-window-meter";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

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
  tagline: "Is the level compliant against its target, right now and on average: spikes vs drift.",
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

// Default windows are [3, 30] — each home needs ≥30 samples or the slow
// trace never fills and the mark reads as an empty hairline.
const CTX_ROWS = [
  { name: "Track 1", meta: "−22", data: LOUDNESS },
  { name: "Track 2", meta: "−19", data: LOUDNESS.map((v) => v + 3) },
  { name: "Track 3", meta: "−24", data: LOUDNESS.map((v) => v - 2) },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Integrated loudness{" "}
        <span className="mc-inline">
          <DualWindowMeter
            data={LOUDNESS}
            target={-23}
            format={{ maximumFractionDigits: 1 }}
            height={16}
            summary={false}
          />
        </span>{" "}
        — −22 LUFS, within broadcast target.
      </p>
    ),
    code: '<p>\n  Integrated loudness{" "}\n  <span className="mc-inline">\n    <DualWindowMeter data={samples} target={-23} summary={false} />\n  </span>{" "}\n  — −22 LUFS, within broadcast target.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <DualWindowMeter
                  data={row.data}
                  target={-23}
                  format={{ maximumFractionDigits: 1 }}
                  height={18}
                  summary={false}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <DualWindowMeter data={samples} target={-23} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Loudness</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">−22</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">LUFS integrated</span>
          </div>
        </div>
        <DualWindowMeter
          data={CTX_ROWS[0]!.data}
          target={-23}
          format={{ maximumFractionDigits: 1 }}
          height={36}
          summary={false}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">−22</span>\n  <span className="unit">LUFS integrated</span>\n  <DualWindowMeter data={samples} target={-23} />\n</div>',
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {CTX_ROWS.map((row, i) => (
          <span
            key={row.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${i === 0 ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground" : "border-fd-border text-fd-muted-foreground"}`}
          >
            {row.name}
            <DualWindowMeter
              data={row.data}
              target={-23}
              format={{ maximumFractionDigits: 1 }}
              height={14}
              summary={false}
            />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Track 1 <DualWindowMeter data={samples} target={-23} />\n</button>',
  },
};

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
export default {
  entry,
  Preview,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModuleStatic;
