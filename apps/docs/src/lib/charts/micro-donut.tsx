import { MicroDonut } from "@microcharts/react/micro-donut";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 20 },
];
// Same total as MIX for a fair Desktop vs Mobile comparison.
const MOBILE = [
  { label: "Safari", value: 540 },
  { label: "Chrome", value: 380 },
  { label: "Firefox", value: 50 },
  { label: "Edge", value: 20 },
  { label: "Arc", value: 10 },
];
const SEGMENTS: { name: string; sessions: number; mix: typeof MIX }[] = [
  { name: "Desktop", sessions: 1000, mix: MIX },
  { name: "Mobile", sessions: 1000, mix: MOBILE },
];

export const entry: ChartEntry = {
  name: "MicroDonut",
  slug: "micro-donut",
  status: "stable",
  collection: "core",
  tagline: "Roughly what is this made of? An honest, capped concession at icon size.",
  staticImport: `${PKG}/micro-donut`,
  interactiveImport: `${PKG}/micro-donut/interactive`,
  dataShape: "{ label, value }[]",
  encoding: { channel: "wedge angle", precision: "LOW — SegmentedBar for any comparative read" },
  nodeBudget: "≤ 5 (4 wedges + Other)",
  bestFor: ["mix icon beside a printed number", "KPI card corners"],
  avoidFor: ["comparative reads (SegmentedBar)", "precision of any kind"],
  props: [
    {
      name: "data",
      type: "{ label; value }[]",
      required: true,
      description: "Parts of the whole.",
    },
    {
      name: "maxWedges",
      type: "number",
      required: false,
      description: "Rollup threshold (default 4).",
    },
    {
      name: "decorative",
      type: "boolean",
      required: false,
      description: "Redundant ornament beside a printed value → aria-hidden.",
    },
    {
      name: "weight",
      type: "number",
      required: false,
      description: "Annulus thickness (shared with ProgressRing).",
    },
    {
      name: "label",
      type: '"none" | "total"',
      required: false,
      description: 'Center total when the hole has room (default "none").',
    },
    {
      name: "colors",
      type: "string[]",
      required: false,
      description: "Per-wedge colours, cycled; overrides --mc-cat-N. Other stays neutral.",
    },
    {
      name: "size",
      type: "number",
      required: false,
      description: "Donut square edge in viewBox units (default 24).",
    },
  ],
  demo: MIX.map((d) => d.value),
  example: {
    title: "Traffic mix",
    code: `import { MicroDonut } from "${PKG}/micro-donut";

<MicroDonut data={mix} title="Traffic mix" />`,
  },
  sampleData: [
    {
      name: "mix",
      code: `const mix = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 20 },
];`,
    },
  ],
};

export function Preview() {
  return <MicroDonut data={MIX} summary={false} style={{ width: 40, height: 40 }} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "maxWedges", label: "max wedges", min: 2, max: 4, init: 4 },
    { kind: "range", key: "weight", label: "weight", min: 3, max: 10, init: 5 },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["none", "total"],
      init: "none",
    },
    { kind: "toggle", key: "decorative", label: "decorative (aria-hidden)", init: false },
  ],
  render: (s) => (
    <MicroDonut
      data={MIX}
      maxWedges={s.maxWedges as number}
      weight={s.weight as number}
      label={s.label as "none" | "total"}
      decorative={s.decorative as boolean}
      size={48}
      summary={false}
      style={{ width: 96, height: 96 }}
    />
  ),
  code: (s) =>
    [
      "<MicroDonut",
      "  data={mix}",
      s.maxWedges !== 4 && `  maxWedges={${s.maxWedges}}`,
      s.weight !== 5 && `  weight={${s.weight}}`,
      s.label !== "none" && `  label="${s.label}"`,
      (s.decorative as boolean) && "  decorative",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover a wedge (angle lookup) or arrow through them — Other announces its members.",
};

export const recipes: Recipe[] = [
  {
    label: "beside the printed number",
    code: `// the number is the datum; the donut repeats it — declare it decorative\n<span>62% Chrome <MicroDonut data={mix} decorative /></span>`,
    node: (
      <span>
        62% Chrome <MicroDonut data={MIX} decorative style={{ width: "1em", height: "1em" }} />
      </span>
    ),
  },
  {
    label: "accessible mix icon",
    code: `<MicroDonut data={mix} title="Traffic mix" />`,
    node: <MicroDonut data={MIX} summary={false} style={{ width: 24, height: 24 }} />,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Chrome carried 62% of this week&rsquo;s sessions{" "}
        <span className="mc-inline">
          <MicroDonut data={MIX} decorative style={{ width: 16, height: 16 }} />
        </span>{" "}
        — Safari, Firefox, Edge, and Arc split the rest.
      </p>
    ),
    code: `// the number is the datum; the donut repeats it — declare it decorative\n<p>\n  Chrome carried 62% of this week's sessions{" "}\n  <span className="mc-inline">\n    <MicroDonut data={mix} decorative summary={false} />\n  </span>{" "}\n  — the rest split across four browsers.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {SEGMENTS.map((s) => (
            <tr key={s.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{s.name}</td>
              <td className="py-1.5">
                <MicroDonut data={s.mix} summary={false} style={{ width: 18, height: 18 }} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {s.mix[0]!.label} {Math.round((s.mix[0]!.value / s.sessions) * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <MicroDonut data={mix} style={{ width: 18, height: 18 }} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Sessions this week</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">1,000</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">62% Chrome</span>
          </div>
        </div>
        <MicroDonut data={MIX} title="Traffic mix" style={{ width: 32, height: 32 }} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">1,000</span>\n  <span className="unit">62% Chrome</span>\n  <MicroDonut data={mix} title="Traffic mix" />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {SEGMENTS.map((s, i) => (
          <span
            key={s.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {s.name}
            <MicroDonut data={s.mix} summary={false} style={{ width: 14, height: 14 }} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Desktop <MicroDonut data={mix} style={{ width: 14, height: 14 }} />\n</button>`,
  },
};

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <MicroDonut data={MIX.slice(0, 3)} summary={false} style={{ width: 18, height: 18 }} />;
}

export function markCode(): string {
  return `<MicroDonut data={mix} />`;
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
