import { SproutRow } from "@microcharts/react/sprout-row";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
type Row = { label: string; value: number | null }[];
export const ACCTS: Row = [
  { label: "Acme", value: 3 },
  { label: "Beta", value: 2 },
  { label: "Gamma", value: 3 },
  { label: "Delta", value: 1 },
  { label: "Echo", value: 0 },
  { label: "Foxx", value: 2 },
];

export const entry: ChartEntry = {
  name: "SproutRow",
  slug: "sprout-row",
  status: "stable",
  collection: "expressive",
  tagline: "How mature or healthy is each item in a small set.",
  staticImport: `${PKG}/sprout-row`,
  interactiveImport: `${PKG}/sprout-row/interactive`,
  dataShape: "{ label: string; value: 0 | 1 | 2 | 3 }[]",
  encoding: { channel: "ordinal growth-stage glyph (height monotonic)", precision: "high" },
  nodeBudget: "n + 1 (+ n labels)",
  bestFor: [
    "account or project maturity across a small set",
    "a health column in a portfolio table",
    "per-item lifecycle in a KPI card",
  ],
  avoidFor: ["continuous values (MiniBar)", "trends (Sparkline)", "more than ~12 items"],
  props: [
    { name: "data", type: "{ label, value }[]", required: true, description: "value = stage 0–3." },
    {
      name: "labels",
      type: "boolean",
      required: false,
      description: "Category labels under the slots.",
    },
    {
      name: "label",
      type: '"none" | "value"',
      required: false,
      description: "Print the stage number above each glyph.",
    },
    {
      name: "step",
      type: "number",
      required: false,
      description: "Horizontal spacing between glyph slots (default 16; widens for labels).",
    },
  ],
  demo: [3, 2, 3, 1, 0, 2],
  example: {
    title: "Account health",
    code: `import { SproutRow } from "${PKG}/sprout-row";\n\n<SproutRow data={accounts} title="Account health" />`,
  },
  sampleData: [
    {
      name: "accounts",
      code: `const accounts = [
  { label: "Acme", value: 3 },  // 3 = bloom
  { label: "Beta", value: 2 },  // 2 = leaf
  { label: "Gamma", value: 3 },
  { label: "Delta", value: 1 }, // 1 = sprout
  { label: "Echo", value: 0 },  // 0 = seed
  { label: "Foxx", value: 2 },
];`,
    },
  ],
};

export function Preview() {
  return <SproutRow data={ACCTS} summary={false} height={22} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "labels", label: "labels", init: false },
    { kind: "toggle", key: "value", label: "stage #", init: false },
  ],
  render: (s) => (
    <SproutRow
      data={ACCTS}
      labels={s.labels as boolean}
      label={s.value ? "value" : "none"}
      summary={false}
      height={s.labels ? 46 : 26}
    />
  ),
  code: (s) =>
    ["<SproutRow", "  data={accounts}", s.labels && "  labels", s.value && '  label="value"', "/>"]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow ←/→ across the row — each item announces its stage (seed → sprout → leaf → bloom), and a ring lifts the focused glyph. Taller means further along, so the ordering reads without the key.",
};

export const recipes: Recipe[] = [
  {
    label: "with category labels",
    code: `<SproutRow data={accounts} labels />`,
    node: <SproutRow data={ACCTS} labels summary={false} height={44} />,
  },
  {
    label: "missing ≠ seed (null draws a soil tick only)",
    code: `<SproutRow data={[{ label: "A", value: 2 }, { label: "B", value: null }, { label: "C", value: 0 }]} />`,
    node: (
      <SproutRow
        data={[
          { label: "A", value: 2 },
          { label: "B", value: null },
          { label: "C", value: 0 },
        ]}
        summary={false}
        height={24}
        step={22}
      />
    ),
  },
];

const TRIALS: Row = [
  { label: "Nimbus", value: 1 },
  { label: "Orbit", value: 0 },
  { label: "Pixel", value: 2 },
  { label: "Quartz", value: 1 },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Account health this week{" "}
        <span className="mc-inline">
          <SproutRow data={ACCTS} summary={false} height={18} step={13} />
        </span>{" "}
        — two at bloom, one still seed.
      </p>
    ),
    code: `<p>\n  Account health this week{" "}\n  <SproutRow data={accounts} height={18} /> — two at bloom, one still seed.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {ACCTS.slice(0, 3).map((a) => (
            <tr key={a.label}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{a.label}</td>
              <td className="py-1.5">
                <SproutRow data={[a]} summary={false} height={18} step={13} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {["seed", "sprout", "leaf", "bloom"][a.value ?? 0]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <SproutRow data={[{ label: "Acme", value: 3 }]} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Portfolio health</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">4 / 6</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">at leaf or better</span>
          </div>
        </div>
        <SproutRow data={ACCTS} summary={false} height={30} step={22} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">4 / 6</span>\n  <span className="unit">at leaf or better</span>\n  <SproutRow data={accounts} height={30} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Accounts", ACCTS],
            ["Trials", TRIALS],
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
            <SproutRow data={rows} summary={false} height={14} step={10} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Accounts <SproutRow data={accounts} height={14} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const stages = props.data.length
    ? props.data.slice(0, 6).map((v, i) => ({ label: `#${i}`, value: Math.abs(Math.round(v)) % 4 }))
    : ACCTS;
  return <SproutRow data={stages} summary={false} height={props.height ?? 20} step={14} />;
}

export function markCode(): string {
  return `<SproutRow data={accounts} />`;
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
