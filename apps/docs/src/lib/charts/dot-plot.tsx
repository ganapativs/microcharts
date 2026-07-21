import { DotPlot } from "@microcharts/react/dot-plot";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const TEAM = [
  { label: "Ada", value: 96 },
  { label: "Kim", value: 41 },
  { label: "Sam", value: 88 },
  { label: "Noor", value: 73 },
  { label: "Lee", value: 60 },
];
const DESIGN = [
  { label: "Mira", value: 84 },
  { label: "Theo", value: 62 },
  { label: "Zoe", value: 77 },
];

export const entry: ChartEntry = {
  name: "DotPlot",
  slug: "dot-plot",
  status: "stable",
  collection: "core",
  tagline: "A few named values on one scale: minimum ink per comparison.",
  staticImport: `${PKG}/dot-plot`,
  interactiveImport: `${PKG}/dot-plot/interactive`,
  dataShape: "{ label, value }[]",
  encoding: { channel: "dot position on a common scale", precision: "high" },
  nodeBudget: "≤ 2 per row + text (rows ≤ 7)",
  bestFor: ["KPI leaderboards", "named comparisons in cards", "rows where bars would lie"],
  avoidFor: ["> 7 rows", "time series (Sparkline)"],
  props: [
    { name: "data", type: "{ label; value }[]", required: true, description: "Named values." },
    {
      name: "stem",
      type: "boolean",
      required: false,
      description: "Hairline from zero — flips to a magnitude read (zero-anchored domain forced).",
    },
    {
      name: "highlight",
      type: "number | string",
      required: false,
      description: "Accent one category.",
    },
    {
      name: "label",
      type: '"value" | "none"',
      required: false,
      description: "Value text beside each dot (drops out under 8-unit rows).",
    },
  ],
  demo: TEAM.map((d) => d.value),
  example: {
    title: "Team leaderboard",
    code: `import { DotPlot } from "${PKG}/dot-plot";\n\n<DotPlot data={team} title="Review scores" />`,
  },
  sampleData: [
    {
      name: "team",
      code: `const team = [
  { label: "Ada", value: 96 },
  { label: "Kim", value: 41 },
  { label: "Sam", value: 88 },
  { label: "Noor", value: 73 },
  { label: "Lee", value: 60 },
];`,
    },
  ],
};

export function Preview() {
  return <DotPlot data={TEAM} summary={false} width={130} height={70} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "stem", label: "stems", init: false },
    { kind: "toggle", key: "values", label: "value labels", init: false },
    { kind: "toggle", key: "highlight", label: "highlight Ada", init: false },
  ],
  render: (s) => (
    <DotPlot
      data={TEAM}
      stem={s.stem as boolean}
      label={(s.values as boolean) ? "value" : "none"}
      highlight={(s.highlight as boolean) ? "Ada" : undefined}
      summary={false}
      width={220}
      height={110}
    />
  ),
  code: (s) =>
    [
      "<DotPlot",
      "  data={team}",
      (s.stem as boolean) && "  stem",
      (s.values as boolean) && '  label="value"',
      (s.highlight as boolean) && '  highlight="Ada"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover a row or rove with ↑/↓ — each announces its name, value, and rank.",
};

export const recipes: Recipe[] = [
  {
    label: "KPI leaderboard",
    code: `<DotPlot data={team} label="value" highlight="Ada"\n  width={140} height={56} />`,
    node: (
      <DotPlot data={TEAM} label="value" highlight="Ada" summary={false} width={140} height={56} />
    ),
  },
  {
    label: "magnitude read (stems)",
    code: `// stems force a zero-anchored domain — position becomes magnitude\n<DotPlot data={team} stem />`,
    node: <DotPlot data={TEAM} stem summary={false} width={140} height={56} />,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        This cycle's review scores{" "}
        <span className="mc-inline">
          <DotPlot data={TEAM} summary={false} width={76} height={34} />
        </span>{" "}
        spread from Kim's 41 to Ada's 96 — a 55-point range.
      </p>
    ),
    code: `<p>\n  This cycle's review scores{" "}\n  <span className="mc-inline">\n    <DotPlot data={team} width={76} height={34} summary={false} />\n  </span>{" "}\n  spread from Kim's 41\n  to Ada's 96 — a 55-point range.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <thead>
          <tr className="text-fd-muted-foreground text-xs">
            <th className="pb-1.5 pr-3 text-left font-normal">Pod</th>
            <th className="pb-1.5 text-left font-normal">Scores</th>
            <th className="pb-1.5 pl-3 text-right font-normal">Range</th>
          </tr>
        </thead>
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {(
            [
              ["Engineering", TEAM, "41–96"],
              ["Design", DESIGN, "62–84"],
            ] as const
          ).map(([name, rows, range]) => (
            <tr key={name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{name}</td>
              <td className="py-1.5">
                <DotPlot data={rows} summary={false} width={70} height={24} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{range}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <DotPlot data={pod.scores} width={70} height={24} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Review-cycle high</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">96</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">Ada, of 5 reviewed</span>
          </div>
        </div>
        <DotPlot
          data={TEAM}
          label="value"
          highlight="Ada"
          summary={false}
          width={110}
          height={46}
        />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">96</span>\n  <span className="unit">Ada, of 5 reviewed</span>\n  <DotPlot data={team} label="value" highlight="Ada" width={110} height={46} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Engineering", TEAM.slice(0, 3)],
            ["Design", DESIGN],
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
            <DotPlot data={rows} summary={false} width={44} height={20} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Engineering <DotPlot data={pod.scores.slice(0, 3)} width={44} height={20} summary={false} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <DotPlot
      data={props.data.slice(0, 4).map((v, i) => ({ label: `c${i + 1}`, value: v }))}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 32}
    />
  );
}

export function markCode(): string {
  return `<DotPlot data={team} />`;
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
