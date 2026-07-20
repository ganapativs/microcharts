import { Dumbbell } from "@microcharts/react/dumbbell";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const BANDS = [
  { label: "Paris", from: 52, to: 61 },
  { label: "Berlin", from: 48, to: 68 },
  { label: "Oslo", from: 66, to: 60 },
  { label: "Rome", from: 44, to: 50 },
];
const LEVELS = [
  { label: "L3", from: 58, to: 66 },
  { label: "L4", from: 68, to: 82 },
  { label: "L5", from: 84, to: 104 },
];

export const entry: ChartEntry = {
  name: "Dumbbell",
  slug: "dumbbell",
  status: "stable",
  collection: "core",
  tagline: "Where each row started and ended: hollow to filled, no legend.",
  staticImport: `${PKG}/dumbbell`,
  interactiveImport: `${PKG}/dumbbell/interactive`,
  dataShape: "{ label?, from, to }[]",
  encoding: { channel: "two dot positions + connecting span", precision: "high" },
  nodeBudget: "≤ 3 per row (rows ≤ 5)",
  bestFor: ["salary bands", "before/after per row", "ranges in tables"],
  avoidFor: ["many rows (Slope for crossings)", "the path between (Sparkline)"],
  props: [
    {
      name: "data",
      type: "{ label?; from; to }[]",
      required: true,
      description: "Start/end pairs.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Direction valence for CHANGES; drop it for ranges (no valence).",
    },
    {
      name: "label",
      type: '"value" | "none"',
      required: false,
      description: "From/to values outside the dots (drop when the span is tight).",
    },
    { name: "highlight", type: "number | string", required: false, description: "Accent one row." },
  ],
  demo: [48, 68],
  example: {
    title: "Salary band move",
    code: `import { Dumbbell } from "${PKG}/dumbbell";\n\n<Dumbbell data={[{ from: 62000, to: 84000 }]} title="Band move" />`,
  },
  sampleData: [
    {
      name: "bands",
      code: `const bands = [
  { label: "Paris", from: 52, to: 61 },
  { label: "Berlin", from: 48, to: 68 },
  { label: "Oslo", from: 66, to: 60 },
  { label: "Rome", from: 44, to: 50 },
];`,
    },
  ],
};

export function Preview() {
  return <Dumbbell data={BANDS} summary={false} width={130} height={52} />;
}
export const playground: PlaygroundSpec = {
  // domain/color/format/locale/strings are styling/formatting overrides,

  // (positive, label, highlight) has a control below.
  knobs: [
    { kind: "toggle", key: "positive", label: "valence", init: false },
    { kind: "toggle", key: "values", label: "value labels", init: false },
    { kind: "toggle", key: "highlight", label: "highlight Berlin", init: false },
  ],
  render: (s) => (
    <Dumbbell
      data={BANDS}
      positive={(s.positive as boolean) ? "up" : undefined}
      label={(s.values as boolean) ? "value" : "none"}
      highlight={(s.highlight as boolean) ? "Berlin" : undefined}
      summary={false}
      width={240}
      height={96}
    />
  ),
  code: (s) =>
    [
      "<Dumbbell",
      "  data={bands}",
      (s.positive as boolean) && '  positive="up"',
      (s.values as boolean) && '  label="value"',
      (s.highlight as boolean) && '  highlight="Berlin"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Rove rows with ↑/↓; ←/→ inspect the from/to ends of the active row.",
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<Dumbbell data={[row.band]} width={60} height={12} />`,
    node: <Dumbbell data={[{ from: 48, to: 68 }]} summary={false} width={60} height={12} />,
  },
  {
    label: "a range, not a change",
    code: `// no positive prop — a min→max range has no valence to color\n<Dumbbell data={[{ from: p5, to: p95 }]} />`,
    node: <Dumbbell data={[{ from: 12, to: 96 }]} summary={false} width={60} height={12} />,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Berlin&apos;s band moved{" "}
        <span className="mc-inline">
          <Dumbbell data={[{ from: 48, to: 68 }]} summary={false} width={70} height={14} />
        </span>{" "}
        from €48k to €68k after the review — up 42%.
      </p>
    ),
    code: `<p>\n  Berlin's band moved{" "}\n  <Dumbbell data={[{ from: 48, to: 68 }]} width={70} height={14} /> from €48k to €68k — up 42%.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {BANDS.map((b) => (
            <tr key={b.label}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{b.label}</td>
              <td className="py-1.5">
                <Dumbbell data={[b]} summary={false} width={70} height={14} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {b.to - b.from >= 0 ? "+" : ""}
                {b.to - b.from}k
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <Dumbbell data={[{ label: "Berlin", from: 48, to: 68 }]} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Largest band move</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">€48k → €68k</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">Berlin, up 42%</span>
          </div>
        </div>
        <Dumbbell data={BANDS} summary={false} positive="up" width={130} height={52} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">€48k → €68k</span>\n  <span className="unit">Berlin, up 42%</span>\n  <Dumbbell data={bands} positive="up" width={130} height={52} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Offices", BANDS],
            ["Levels", LEVELS],
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
            <Dumbbell data={rows} summary={false} width={60} height={12} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Offices <Dumbbell data={bands} width={60} height={12} />\n</button>`,
  },
};

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <Dumbbell data={[{ from: 48, to: 68 }]} summary={false} width={60} height={12} />;
}

export function markCode(): string {
  return `<Dumbbell data={[{ from: 48, to: 68 }]} />`;
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
