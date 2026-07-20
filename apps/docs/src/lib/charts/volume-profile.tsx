import { VolumeProfile } from "@microcharts/react/volume-profile";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const PROFILE = [
  { level: 134, weight: 3 },
  { level: 136, weight: 6 },
  { level: 138, weight: 11 },
  { level: 140, weight: 18 },
  { level: 142, weight: 26 },
  { level: 144, weight: 20 },
  { level: 146, weight: 12 },
  { level: 148, weight: 7 },
  { level: 150, weight: 4 },
];

export const entry: ChartEntry = {
  name: "VolumeProfile",
  slug: "volume-profile",
  status: "stable",
  collection: "frontier",
  tagline: "At which level did activity concentrate, not when.",
  staticImport: `${PKG}/volume-profile`,
  interactiveImport: `${PKG}/volume-profile/interactive`,
  dataShape: "{ level, weight }[] or raw levels: number[]",
  encoding: {
    channel: "horizontal bar = mass at level (level axis vertical)",
    precision: "medium",
  },
  nodeBudget: "≤ 4",
  bestFor: ["volume-at-price / level-of-activity", "load by tier"],
  avoidFor: ["a time series (Sparkline)", "when timing matters (use a trend chart)"],
  props: [
    {
      name: "data",
      type: "{ level, weight }[] | number[]",
      required: true,
      description: "Activity mass per level, or raw levels.",
    },
    {
      name: "valueArea",
      type: "number",
      required: false,
      description: "Mass fraction of the shaded value area (0.7).",
    },
    {
      name: "align",
      type: '"left" | "right"',
      required: false,
      description: "Which way bars grow.",
    },
    {
      name: "label",
      type: '"poc" | "none"',
      required: false,
      description: "The POC level beside the accent bar.",
    },
    {
      name: "bins",
      type: "number",
      required: false,
      description: "Number of histogram bins (default 12).",
    },
  ],
  demo: [142],
  example: {
    title: "Volume by price",
    code: `import { VolumeProfile } from "${PKG}/volume-profile";\n\n<VolumeProfile data={profile} title="Volume by price" />`,
  },
  sampleData: [
    {
      name: "profile",
      code: `const profile = [
  { level: 134, weight: 3 },
  { level: 136, weight: 6 },
  { level: 138, weight: 11 },
  { level: 140, weight: 18 },
  { level: 142, weight: 26 },
  { level: 144, weight: 20 },
  { level: 146, weight: 12 },
  { level: 148, weight: 7 },
  { level: 150, weight: 4 },
];`,
    },
  ],
};

export function Preview() {
  return <VolumeProfile data={PROFILE} summary={false} width={60} height={40} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "align", label: "align", options: ["left", "right"], init: "left" },
    { kind: "segmented", key: "label", label: "label", options: ["poc", "none"], init: "poc" },
    { kind: "range", key: "valueArea", label: "value area %", min: 50, max: 90, step: 5, init: 70 },
  ],
  render: (s) => (
    <VolumeProfile
      data={PROFILE}
      align={s.align as "left" | "right"}
      label={s.label as "poc" | "none"}
      valueArea={(s.valueArea as number) / 100}
      summary={false}
      width={200}
      height={132}
    />
  ),
  code: (s) =>
    [
      "<VolumeProfile",
      "  data={profile}",
      s.align !== "left" && `  align="${s.align}"`,
      s.label !== "poc" && `  label="${s.label}"`,
      s.valueArea !== 70 && `  valueArea={${((s.valueArea as number) / 100).toFixed(2)}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or use ↑/↓ across the levels — each announces its share of total activity, and the POC is flagged.",
};

export const recipes: Recipe[] = [
  {
    label: "level-activity cell",
    code: `<VolumeProfile data={profile} label="none" width={32} height={32} />`,
    node: <VolumeProfile data={PROFILE} label="none" summary={false} width={32} height={32} />,
  },
  {
    label: "right side (pair with trend)",
    code: `<VolumeProfile data={profile} align="right" />`,
    node: <VolumeProfile data={PROFILE} align="right" summary={false} width={80} height={56} />,
  },
];

const TICKERS = [
  { name: "AAPL", data: PROFILE, meta: "POC 142" },
  {
    name: "MSFT",
    data: [
      { level: 380, weight: 4 },
      { level: 385, weight: 12 },
      { level: 390, weight: 22 },
      { level: 395, weight: 18 },
    ],
    meta: "POC 390",
  },
  {
    name: "NVDA",
    data: [
      { level: 820, weight: 6 },
      { level: 825, weight: 14 },
      { level: 830, weight: 28 },
      { level: 835, weight: 16 },
    ],
    meta: "POC 830",
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Trades concentrated at{" "}
        <span className="mc-inline">
          <VolumeProfile data={PROFILE} label="none" summary={false} width={28} height={28} />
        </span>{" "}
        — point of control at 142, value area spans 138–146.
      </p>
    ),
    code: '<p>\n  Trades at <VolumeProfile data={profile} label="none" width={28} height={28} /> — POC 142.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {TICKERS.map((t) => (
            <tr key={t.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground">{t.name}</td>
              <td className="py-1.5">
                <VolumeProfile data={t.data} label="none" summary={false} width={32} height={32} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{t.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: '<td><VolumeProfile data={profile} label="none" width={32} height={32} /></td>',
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Volume by price</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">142</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">point of control</span>
          </div>
        </div>
        <VolumeProfile data={PROFILE} summary={false} width={80} height={56} />
      </>
    ),
    code: '<div className="kpi"><span className="figure">142</span><VolumeProfile data={profile} width={80} height={56} /></div>',
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {TICKERS.map((t, i) => (
          <span
            key={t.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${i === 0 ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground" : "border-fd-border text-fd-muted-foreground"}`}
          >
            {t.name}
            <VolumeProfile data={t.data} label="none" summary={false} width={28} height={28} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">AAPL <VolumeProfile data={profile} label="none" width={28} height={28} /></button>',
  },
  note: "Best at KPI/card scale — profile needs a near-square seat.",
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <VolumeProfile
      data={PROFILE}
      label="none"
      summary={false}
      width={props.width ?? 32}
      height={props.height ?? 32}
    />
  );
}

export function markCode(): string {
  return `<VolumeProfile data={profile} />`;
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
