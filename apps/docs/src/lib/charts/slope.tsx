import { Slope } from "@microcharts/react/slope";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const RANKS = [
  { label: "East", from: 40, to: 47 },
  { label: "West", from: 55, to: 41 },
  { label: "South", from: 30, to: 33 },
  { label: "North", from: 50, to: 44 },
  { label: "Mid", from: 20, to: 35 },
];
const PLANS = [
  { label: "Starter", from: 12, to: 18 },
  { label: "Team", from: 28, to: 44 },
  { label: "Enterprise", from: 60, to: 52 },
];

export const entry: ChartEntry = {
  name: "Slope",
  slug: "slope",
  status: "stable",
  collection: "core",
  tagline: "Who rose and who fell between two moments: crossings read instantly.",
  staticImport: `${PKG}/slope`,
  interactiveImport: `${PKG}/slope/interactive`,
  dataShape: "{ label, from, to }[]",
  encoding: { channel: "line slope between two aligned columns", precision: "medium-high" },
  nodeBudget: "≤ 3 per category (≤ 7)",
  bestFor: ["before/after experiments", "rank shuffles", "two-moment comparisons"],
  avoidFor: ["the path between (Sparkline)", "> 7 categories"],
  props: [
    {
      name: "data",
      type: "{ label; from; to }[]",
      required: true,
      description: "Two aligned moments per category.",
    },
    {
      name: "label",
      type: '"none" | "value" | "label" | "both"',
      required: false,
      description: "End labels; dropped deterministically when rows collide.",
    },
    {
      name: "highlight",
      type: "number | string",
      required: false,
      description: "The one-vs-field editorial read.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Direction valence; unset = neutral ink.",
    },
  ],
  demo: [40, 47],
  example: {
    title: "Before vs after",
    code: `import { Slope } from "${PKG}/slope";\n\n<Slope data={cohorts} title="Before vs after" />`,
  },
  sampleData: [
    {
      name: "cohorts",
      code: `const cohorts = [
  { label: "East", from: 40, to: 47 },
  { label: "West", from: 55, to: 41 },
  { label: "South", from: 30, to: 33 },
  { label: "North", from: 50, to: 44 },
  { label: "Mid", from: 20, to: 35 },
];`,
    },
  ],
};

export function Preview() {
  return <Slope data={RANKS} summary={false} width={90} height={70} />;
}
export const playground: PlaygroundSpec = {
  // domain/color/format/locale/strings are styling/formatting overrides,

  // (label, positive, highlight) has a control below.
  knobs: [
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["none", "value", "label", "both"],
      init: "none",
    },
    { kind: "toggle", key: "positive", label: "valence", init: false },
    { kind: "toggle", key: "highlight", label: "highlight West", init: false },
  ],
  render: (s) => (
    <Slope
      data={RANKS}
      label={s.label as "none" | "value" | "label" | "both"}
      positive={(s.positive as boolean) ? "up" : undefined}
      highlight={(s.highlight as boolean) ? "West" : undefined}
      summary={false}
      width={200}
      height={130}
    />
  ),
  code: (s) =>
    [
      "<Slope",
      "  data={cohorts}",
      s.label !== "none" && `  label="${s.label}"`,
      (s.positive as boolean) && '  positive="up"',
      (s.highlight as boolean) && '  highlight="West"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover near a line or rove with ↑/↓ (ordered by the after value) — each announces its slope.",
};

export const recipes: Recipe[] = [
  {
    label: "KPI before/after",
    code: `<Slope data={cohorts} label="both"\n  width={140} height={96} />`,
    node: <Slope data={RANKS} label="both" summary={false} width={140} height={96} />,
  },
  {
    label: "one vs the field",
    code: `<Slope data={cohorts} highlight="West" />`,
    node: <Slope data={RANKS} highlight="West" summary={false} width={90} height={60} />,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        West&apos;s renewal rate slid from best to worst region{" "}
        <span className="mc-inline">
          <Slope
            data={[{ label: "West", from: 55, to: 41 }]}
            summary={false}
            width={40}
            height={18}
          />
        </span>{" "}
        after the March price change — down 25%.
      </p>
    ),
    code: `<p>\n  West's renewal rate slid from best to worst region{" "}\n  <Slope data={[{ label: "West", from: 55, to: 41 }]} width={40} height={18} /> — down 25%.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {RANKS.map((r) => (
            <tr key={r.label}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{r.label}</td>
              <td className="py-1.5">
                <Slope data={[r]} summary={false} width={40} height={18} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {r.to - r.from >= 0 ? "+" : ""}
                {r.to - r.from}pt
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <Slope data={[{ label: "East", from: 40, to: 47 }]} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Biggest renewal swing</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">20 → 35</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">Mid region, up 75%</span>
          </div>
        </div>
        <Slope data={RANKS} summary={false} positive="up" highlight="Mid" width={140} height={90} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">20% → 35%</span>\n  <span className="unit">Mid region, up 75%</span>\n  <Slope data={cohorts} positive="up" highlight="Mid" width={140} height={90} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Regions", RANKS],
            ["Plans", PLANS],
          ] as const
        ).map(([name, rows], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <Slope data={rows} summary={false} width={64} height={20} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Regions <Slope data={cohorts} width={64} height={20} />\n</button>`,
  },
};

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <Slope data={RANKS.slice(0, 3)} summary={false} width={40} height={26} />;
}

export function markCode(): string {
  return `<Slope data={cohorts} />`;
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
