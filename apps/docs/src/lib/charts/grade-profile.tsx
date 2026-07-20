import { GradeProfile } from "@microcharts/react/grade-profile";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const m = (n: number) => `${n} m`;
export const TRAIL = [
  { d: 0, elev: 800 },
  { d: 100, elev: 809 },
  { d: 250, elev: 812 },
  { d: 350, elev: 817 },
  { d: 500, elev: 835 },
  { d: 700, elev: 833 },
  { d: 900, elev: 865 },
];

export const entry: ChartEntry = {
  name: "GradeProfile",
  slug: "grade-profile",
  status: "stable",
  collection: "expressive",
  tagline: "How hard the route is, and where: pitches coloured by grade, the steepest called out.",
  staticImport: `${PKG}/grade-profile`,
  interactiveImport: `${PKG}/grade-profile/interactive`,
  dataShape: "{ d, elev }[], distance + elevation in the same unit",
  encoding: {
    channel: "colour = quantized grade bin; area = elevation ridge; x = distance",
    precision: "medium — a difficulty read; the readout gives the exact grade",
  },
  nodeBudget: "1 quad per segment + ridge (+ seat-gated summit tick)",
  bestFor: ["route / climb profiles (cycling, running, hiking)", "where the hard pitches fall"],
  avoidFor: ["a single elevation series (Sparkline)", "non-monotone tracks (needs distance order)"],
  props: [
    {
      name: "data",
      type: "{ d: number; elev: number }[]",
      required: true,
      description: "Distance + elevation, monotonic in d, same unit so grade is a true percent.",
    },
    {
      name: "bins",
      type: "[number, number, number]",
      required: false,
      description:
        "Ascending grade-% thresholds (always percent) that quantize the four difficulty bins.",
    },
    {
      name: "format",
      type: "Intl.NumberFormatOptions | (n) => string",
      required: false,
      description:
        "Formats distance and elevation in the summary and readout; grades always render as percent.",
    },
    {
      name: "label",
      type: '"max" | "none"',
      required: false,
      description: "Mark the steepest pitch, or render the profile alone.",
    },
  ],
  demo: [800, 865],
  example: {
    title: "Queen stage",
    code: `import { GradeProfile } from "${PKG}/grade-profile";\n\n<GradeProfile data={trail} format={(n) => \`\${n} m\`} title="Queen stage" />`,
  },
  sampleData: [
    {
      name: "trail",
      code: `const trail = [
  { d: 0, elev: 800 },
  { d: 100, elev: 809 },
  { d: 250, elev: 812 },
  { d: 350, elev: 817 },
  { d: 500, elev: 835 },
  { d: 700, elev: 833 },
  { d: 900, elev: 865 },
];`,
    },
  ],
};

export function Preview() {
  return <GradeProfile data={TRAIL} summary={false} width={150} height={44} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "label", label: "summit label", init: true },
    {
      kind: "range",
      key: "hard",
      label: "brutal ≥",
      min: 8,
      max: 16,
      step: 1,
      init: 10,
    },
  ],
  render: (s) => (
    <GradeProfile
      data={TRAIL}
      label={s.label ? "max" : "none"}
      bins={[3, 6, Number(s.hard)]}
      format={m}
      summary={false}
      width={280}
      height={48}
    />
  ),
  code: (s) =>
    [
      "<GradeProfile",
      "  data={trail}",
      s.label === false && '  label="none"',
      s.hard !== 10 && `  bins={[3, 6, ${s.hard}]}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover, or use ←/→ — each pitch announces its distance, true grade, and cumulative climb.",
};

export const recipes: Recipe[] = [
  {
    label: "stage cell",
    code: `<GradeProfile data={stage.profile} label="none" width={80} height={24} />`,
    node: <GradeProfile data={TRAIL} label="none" summary={false} width={80} height={24} />,
  },
  {
    label: "call out the wall",
    code: `<GradeProfile data={trail} bins={[4, 8, 12]} />`,
    node: (
      <GradeProfile
        data={TRAIL}
        bins={[4, 8, 12]}
        format={m}
        summary={false}
        width={200}
        height={46}
      />
    ),
  },
];

const mkTrail = (peak: number) =>
  [
    { d: 0, elev: Math.round(peak * 0.93) },
    { d: 200, elev: Math.round(peak * 0.94) },
    { d: 400, elev: Math.round(peak * 0.95) },
    { d: 600, elev: Math.round(peak * 0.97) },
    { d: 800, elev: peak },
  ] as typeof TRAIL;

const CTX_ROWS = [
  { name: "Stage 12", meta: "865 m", data: TRAIL },
  { name: "Stage 11", meta: "420 m", data: mkTrail(420) },
  { name: "Stage 10", meta: "210 m", data: mkTrail(210) },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Queen stage elevation{" "}
        <span className="mc-inline">
          <GradeProfile data={TRAIL} format={m} height={16} summary={false} />
        </span>{" "}
        — 865 m gain over 800 km.
      </p>
    ),
    code: "<p>\n  Queen stage elevation <GradeProfile data={trail} /> — 865 m gain over 800 km.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <GradeProfile data={row.data} format={m} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <GradeProfile data={trail} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Elevation</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">865 m</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">total gain</span>
          </div>
        </div>
        <GradeProfile data={CTX_ROWS[0]!.data} format={m} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">865 m</span>\n  <span className="unit">total gain</span>\n  <GradeProfile data={trail} />\n</div>',
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
            <GradeProfile data={row.data} format={m} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Stage 12 <GradeProfile data={trail} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <GradeProfile
      data={TRAIL}
      label="none"
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 24}
    />
  );
}

export function markCode(): string {
  return `<GradeProfile data={trail} />`;
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
