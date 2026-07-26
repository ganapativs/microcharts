import { TreeRings } from "@microcharts/react/tree-rings";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const YEARS = [8, 12, 10, 18, 22, 15, 20, 14];

export const entry: ChartEntry = {
  name: "TreeRings",
  slug: "tree-rings",
  status: "stable",
  collection: "expressive",
  tagline: "How growth accumulated, period over period, from the centre out.",
  staticImport: `${PKG}/tree-rings`,
  interactiveImport: `${PKG}/tree-rings/interactive`,
  dataShape: "number[] (oldest first)",
  encoding: { channel: "radial ring thickness ∝ per-period value", precision: "medium" },
  nodeBudget: "≤ 4 (merged ring path + highlighted ring + centre dot + label)",
  bestFor: [
    "account or company age at a glance",
    "a cohort-age marker in a table cell",
    "a per-period growth story in a KPI card",
  ],
  avoidFor: ["exact per-period reads (SparkBar)", "many periods (> 24)", "non-cumulative series"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Per-period growth, oldest first.",
    },
    {
      name: "highlight",
      type: '"last" | "none" | number',
      required: false,
      description: "Which period's ring to pick out.",
    },
    {
      name: "total",
      type: "number",
      required: false,
      description: "Expected lifetime Σ — the disc fills only Σdata/total.",
    },
    {
      name: "rings",
      type: '"stroke" | "fill"',
      required: false,
      description: "Boundary rings (default) or filled annuli.",
    },
    {
      name: "periodWord",
      type: "string",
      required: false,
      description: 'Singular period noun for the summary (default "period").',
    },
    {
      name: "unit",
      type: "string",
      required: false,
      description: 'Plural period noun for the summary (default "periods").',
    },
    {
      name: "size",
      type: "number",
      required: false,
      description: "Rings box edge in viewBox units (default 24).",
    },
    {
      name: "fontSize",
      type: "number",
      required: false,
      description: "Type size of the gutter label, in viewBox units. Defaults from `size`.",
    },
  ],
  demo: YEARS,
  example: {
    title: "Account age",
    code: `import { TreeRings } from "${PKG}/tree-rings";\n\n<TreeRings data={years} unit="years" periodWord="year" title="Account age" />`,
  },
  sampleData: [
    {
      name: "years",
      code: `const years = [8, 12, 10, 18, 22, 15, 20, 14];`,
    },
  ],
};

export function Preview() {
  return <TreeRings data={YEARS} summary={false} size={28} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "rings",
      label: "rings",
      options: ["stroke", "fill"],
      init: "stroke",
    },
    {
      kind: "segmented",
      key: "highlight",
      label: "highlight",
      options: ["last", "none"],
      init: "last",
    },
    { kind: "toggle", key: "label", label: "last value", init: false },
  ],
  render: (s) => (
    <TreeRings
      data={YEARS}
      rings={s.rings as "stroke" | "fill"}
      highlight={s.highlight as "last" | "none"}
      label={s.label ? "last" : "none"}
      unit="years"
      periodWord="year"
      summary={false}
      size={56}
    />
  ),
  code: (s) =>
    [
      "<TreeRings",
      "  data={years}",
      s.rings !== "stroke" && `  rings="${s.rings}"`,
      s.highlight !== "last" && `  highlight="${s.highlight}"`,
      s.label && '  label="last"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover a ring, or arrow ←/→ from the centre out — each period announces its value. The channel is ring thickness, not area: equal thickness at a larger radius spans more area, so read thicknesses, not wedges.",
};

export const recipes: Recipe[] = [
  {
    label: "filled annuli for print / e-ink",
    code: `<TreeRings data={years} rings="fill" />`,
    node: <TreeRings data={YEARS} rings="fill" summary={false} size={40} />,
  },
  {
    label: "cohort age — total sets the expected lifetime",
    code: `<TreeRings data={years} total={200} />  // this account is part-grown`,
    node: <TreeRings data={YEARS} total={200} summary={false} size={40} />,
  },
];

const CTX_ROWS = [
  { name: "Acme", meta: "8 yr", data: [6, 6, 6, 7, 7, 7, 8, 8] },
  { name: "Globex", meta: "5 yr", data: [4, 4, 4, 4, 4, 5, 5, 5] },
  { name: "Initech", meta: "3 yr", data: [2, 2, 2, 3, 3, 3, 3, 3] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Account age{" "}
        <span className="mc-inline">
          <TreeRings data={YEARS} unit="years" periodWord="year" size={20} summary={false} />
        </span>{" "}
        — 8 years, last year the thickest ring.
      </p>
    ),
    code: '<p>\n  Account age{" "}\n  <span className="mc-inline">\n    <TreeRings data={years} summary={false} />\n  </span>{" "}\n  — 8 years, last year the thickest ring.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <TreeRings
                  data={row.data}
                  unit="years"
                  periodWord="year"
                  size={22}
                  summary={false}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <TreeRings data={years} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Age</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">8 yr</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">account tenure</span>
          </div>
        </div>
        <TreeRings
          data={CTX_ROWS[0]!.data}
          label="last"
          unit="years"
          periodWord="year"
          size={48}
          summary={false}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">8 yr</span>\n  <span className="unit">account tenure</span>\n  <TreeRings data={years} />\n</div>',
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
            <TreeRings data={row.data} unit="years" periodWord="year" size={18} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Acme <TreeRings data={years} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = props.data.length ? props.data.slice(0, 10).map((v) => Math.abs(v)) : YEARS;
  return <TreeRings data={data} summary={false} size={props.height ?? 20} />;
}

export function markCode(): string {
  return `<TreeRings data={years} />`;
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
