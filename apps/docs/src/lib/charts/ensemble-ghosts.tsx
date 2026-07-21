import { EnsembleGhosts } from "@microcharts/react/ensemble-ghosts";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// 24 simulated futures — a fan of walks with diverse shapes (deterministic)
export const FUTURES: number[][] = Array.from({ length: 24 }, (_m, i) =>
  Array.from({ length: 10 }, (_, t) =>
    Math.round(40 + (i - 12) * 0.55 * t * 0.4 + 3 * Math.sin(i + t) + t * 0.5),
  ),
);

export const entry: ChartEntry = {
  name: "EnsembleGhosts",
  slug: "ensemble-ghosts",
  status: "stable",
  collection: "decision",
  tagline: "What could happen, across the futures?",
  staticImport: `${PKG}/ensemble-ghosts`,
  interactiveImport: `${PKG}/ensemble-ghosts/interactive`,
  dataShape: "number[][] (2–50 members)",
  encoding: { channel: "path-bundle spread + one emphasized representative", precision: "low" },
  nodeBudget: "≤ 14 at cap",
  bestFor: [
    "a KPI card — the futures, not the average",
    "Monte-Carlo / simulation output where paths disagree in shape",
    "showing that outcomes fan out, not just their endpoint range",
  ],
  avoidFor: ["interval precision (ForecastCone)", "a single path (Sparkline)"],
  props: [
    {
      name: "data",
      type: "number[][]",
      required: true,
      description: "Ensemble members — 2–50 simulated paths.",
    },
    {
      name: "ghosts",
      type: "number",
      required: false,
      description:
        "Rendered member count (deterministic endpoint-rank selection). Default 8, cap 12.",
    },
    {
      name: "emphasis",
      type: '"nearest-median" | "median" | number',
      required: false,
      description: "A real median-like member, the synthetic median, or a pinned member.",
    },
    {
      name: "endpoints",
      type: "boolean",
      required: false,
      description: "Ghost endpoint dots — makes the final-value spread countable.",
    },
    {
      name: "label",
      type: '"end" | "none"',
      required: false,
      description: "Emphasised path endpoint in a right gutter (default end).",
    },
  ],
  demo: FUTURES.map((m) => m[m.length - 1]!),
  example: {
    title: "Simulated futures",
    code: `import { EnsembleGhosts } from "${PKG}/ensemble-ghosts";\n\n<EnsembleGhosts data={futures} title="Simulated futures" />`,
  },
  sampleData: [
    {
      name: "futures",
      code: `// 24 simulated futures — a fan of walks with diverse shapes
const futures = Array.from({ length: 24 }, (_m, i) =>
  Array.from({ length: 10 }, (_, t) =>
    Math.round(40 + (i - 12) * 0.55 * t * 0.4 + 3 * Math.sin(i + t) + t * 0.5),
  ),
);`,
    },
  ],
};

export function Preview() {
  return <EnsembleGhosts data={FUTURES} summary={false} width={120} height={28} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "ghosts", label: "ghosts", min: 3, max: 12, step: 1, init: 8 },
    {
      kind: "segmented",
      key: "emphasis",
      label: "emphasis",
      options: ["nearest-median", "median"],
      init: "nearest-median",
    },
    { kind: "toggle", key: "endpoints", label: "endpoints", init: false },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["end", "none"],
      init: "end",
    },
  ],
  render: (s) => (
    <EnsembleGhosts
      data={FUTURES}
      ghosts={s.ghosts as number}
      emphasis={s.emphasis as "nearest-median" | "median"}
      endpoints={s.endpoints as boolean}
      label={s.label as "end" | "none"}
      summary={false}
      width={280}
      height={44}
    />
  ),
  code: (s) =>
    [
      "<EnsembleGhosts",
      "  data={futures}",
      s.ghosts !== 8 && `  ghosts={${s.ghosts}}`,
      s.emphasis !== "nearest-median" && `  emphasis="${s.emphasis}"`,
      s.endpoints && "  endpoints",
      s.label !== "end" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover to flip through the futures one at a time (the HOP loop); with reduced motion, arrow keys step them instead — each member is announced.",
};

export const recipes: Recipe[] = [
  {
    label: "endpoint dots (countable spread)",
    code: `<EnsembleGhosts data={futures} endpoints />`,
    node: <EnsembleGhosts data={FUTURES} endpoints summary={false} width={200} height={40} />,
  },
  {
    label: "synthetic median path",
    code: `<EnsembleGhosts data={futures} emphasis="median" />`,
    node: (
      <EnsembleGhosts data={FUTURES} emphasis="median" summary={false} width={200} height={40} />
    ),
  },
];

const CTX_ROWS = [
  { name: "Base", meta: "70%", data: FUTURES.slice(0, 12) as typeof FUTURES },
  {
    name: "Upside",
    meta: "42%",
    data: Array.from({ length: 12 }, (_, i) =>
      Array.from({ length: 8 }, (_, t) => Math.round(30 + i * 0.8 + t * 1.5)),
    ) as typeof FUTURES,
  },
  {
    name: "Downside",
    meta: "88%",
    data: Array.from({ length: 12 }, (_, i) =>
      Array.from({ length: 8 }, (_, t) => Math.round(50 + (i - 4) * 2.5 + t * 3.2)),
    ) as typeof FUTURES,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Simulated futures{" "}
        <span className="mc-inline">
          <EnsembleGhosts data={FUTURES} height={16} summary={false} />
        </span>{" "}
        — 70% of paths finish above target.
      </p>
    ),
    code: '<p>\n  Simulated futures{" "}\n  <span className="mc-inline">\n    <EnsembleGhosts data={futures} summary={false} />\n  </span>{" "}\n  — 70% of paths finish above target.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <EnsembleGhosts data={row.data} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <EnsembleGhosts data={futures} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Q4 revenue</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">70%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">paths above target</span>
          </div>
        </div>
        <EnsembleGhosts data={CTX_ROWS[0]!.data} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">70%</span>\n  <span className="unit">paths above target</span>\n  <EnsembleGhosts data={futures} />\n</div>',
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
            <EnsembleGhosts data={row.data} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Base <EnsembleGhosts data={futures} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = Array.from({ length: 6 }, (_m, i) =>
    Array.from({ length: 6 }, (_, t) => 30 + (i - 3) * t + ((props.data[i] ?? 0) % 5)),
  );
  return (
    <EnsembleGhosts
      data={data}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<EnsembleGhosts data={futures} />`;
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
