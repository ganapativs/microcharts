import { QuadrantDot } from "@microcharts/react/quadrant-dot";
import { QuadrantDot as QuadrantDotInteractive } from "@microcharts/react/quadrant-dot/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a prioritization backlog — effort (x) vs impact (y)
export const FOCAL = { x: 3, y: 9 };
export const FIELD = [
  { x: 2, y: 8 },
  { x: 8, y: 9 },
  { x: 3, y: 7 },
  { x: 9, y: 2 },
  { x: 7, y: 3 },
  { x: 1, y: 1 },
  { x: 5, y: 6 },
  { x: 6, y: 8 },
  { x: 4, y: 3 },
  { x: 8, y: 5 },
  { x: 2, y: 4 },
  { x: 7, y: 7 },
  { x: 3, y: 2 },
  { x: 6, y: 1 },
];
const AXES = {
  xLabel: "effort",
  yLabel: "impact",
  xDomain: [0, 10] as const,
  domain: [0, 10] as const,
};

export const entry: ChartEntry = {
  name: "QuadrantDot",
  slug: "quadrant-dot",
  status: "stable",
  collection: "decision",
  tagline: "Where does it sit in the 2×2?",
  staticImport: `${PKG}/quadrant-dot`,
  interactiveImport: `${PKG}/quadrant-dot/interactive`,
  dataShape: "{ x: number; y: number } + field?: { x; y }[]",
  encoding: { channel: "2-D position vs a quadrant split", precision: "medium" },
  nodeBudget: "≤ 5 + 1 per ghost (cap 30)",
  bestFor: [
    "a table cell per initiative — the classic prioritization 2×2",
    "an effort vs impact read in a KPI card",
    "any 'which quadrant, against the field' decision",
  ],
  avoidFor: ["a full scatter plot (MicroScatter)", "a single ranked list (MiniBar)"],
  props: [
    {
      name: "data",
      type: "{ x; y }",
      required: true,
      description: "The focal item's 2-D position.",
    },
    {
      name: "field",
      type: "{ x; y }[]",
      required: false,
      description: "The peer set — omit for a lone glyph.",
    },
    {
      name: "xDomain",
      type: "[number, number]",
      required: false,
      description: "The x-axis range (default: derived from the data); domain stays the y-axis.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "The y-axis range (default: derived from the data).",
    },
    {
      name: "split",
      type: "[number, number]",
      required: false,
      description: "The quadrant boundary (default domain midpoints) — never hidden.",
    },
    {
      name: "quadrants",
      type: "[TL, TR, BL, BR]",
      required: false,
      description: "Names in reading order — summaries only, never rendered.",
    },
    {
      name: "xLabel / yLabel",
      type: "string",
      required: false,
      description: "Axis nouns for the summary — pass them, the axes are unlabeled at glyph size.",
    },
    {
      name: "region",
      type: "boolean",
      required: false,
      description: "Faint tint on the focal's quadrant (default true; false for dense grids).",
    },
  ],
  demo: FIELD.map((p) => p.y - p.x),
  example: {
    title: "Effort vs impact",
    code: `import { QuadrantDot } from "${PKG}/quadrant-dot";\n\n<QuadrantDot data={item} field={backlog} xLabel="effort" yLabel="impact" title="Effort vs impact" />`,
  },
  sampleData: [
    {
      name: "item",
      code: `// a prioritization backlog — effort (x) vs impact (y)
const item = { x: 3, y: 9 };`,
    },
    {
      name: "backlog",
      code: `const backlog = [
  { x: 2, y: 8 },
  { x: 8, y: 9 },
  { x: 3, y: 7 },
  { x: 9, y: 2 },
  { x: 7, y: 3 },
  { x: 1, y: 1 },
  { x: 5, y: 6 },
  { x: 6, y: 8 },
  { x: 4, y: 3 },
  { x: 8, y: 5 },
  { x: 2, y: 4 },
  { x: 7, y: 7 },
  { x: 3, y: 2 },
  { x: 6, y: 1 },
];`,
    },
  ],
};

export function Preview() {
  return (
    <QuadrantDot data={FOCAL} field={FIELD} {...AXES} summary={false} width={48} height={48} />
  );
}

export const showcase = {
  hint: "the focal, against the field",
  Node: () => (
    <QuadrantDot
      data={FOCAL}
      field={FIELD}
      {...AXES}
      title="Effort vs impact"
      width={72}
      height={72}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "splitX", label: "split x", min: 2, max: 8, step: 1, init: 5 },
    { kind: "range", key: "splitY", label: "split y", min: 2, max: 8, step: 1, init: 5 },
    { kind: "toggle", key: "region", label: "tint", init: true },
    { kind: "toggle", key: "named", label: "named quadrants", init: false },
  ],
  render: (s) => (
    <QuadrantDot
      data={FOCAL}
      field={FIELD}
      {...AXES}
      split={[s.splitX as number, s.splitY as number]}
      region={s.region as boolean}
      quadrants={s.named ? ["quick win", "big bet", "skip", "time sink"] : undefined}
      title="Effort vs impact"
      summary={false}
      width={120}
      height={120}
    />
  ),
  code: (s) =>
    [
      "<QuadrantDot",
      "  data={item}",
      "  field={backlog}",
      `  split={[${s.splitX}, ${s.splitY}]}`,
      s.region === false && "  region={false}",
      s.named && `  quadrants={["quick win", "big bet", "skip", "time sink"]}`,
      '  xLabel="effort" yLabel="impact"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <QuadrantDotInteractive
      data={FOCAL}
      field={FIELD}
      {...AXES}
      split={[s.splitX as number, s.splitY as number]}
      region={s.region as boolean}
      quadrants={s.named ? ["quick win", "big bet", "skip", "time sink"] : undefined}
      title="Effort vs impact"
      summary={false}
      animate={ui.animate}
      width={120}
      height={120}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<QuadrantDot",
      "  data={item}",
      "  field={backlog}",
      `  split={[${s.splitX}, ${s.splitY}]}`,
      s.region === false && "  region={false}",
      s.named && `  quadrants={["quick win", "big bet", "skip", "time sink"]}`,
      '  xLabel="effort" yLabel="impact"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the peers — each announces its coords and quadrant, nearest-first from the focal dot.",
};

export const recipes: Recipe[] = [
  {
    label: "lone glyph (no field)",
    code: `<QuadrantDot data={item} xLabel="effort" yLabel="impact" />`,
    node: <QuadrantDot data={FOCAL} {...AXES} summary={false} width={64} height={64} />,
  },
  {
    label: "named quadrants",
    code: `<QuadrantDot data={item} field={backlog} quadrants={["quick win", "big bet", "skip", "time sink"]} />`,
    node: (
      <QuadrantDot
        data={FOCAL}
        field={FIELD}
        {...AXES}
        quadrants={["quick win", "big bet", "skip", "time sink"]}
        summary={false}
        width={72}
        height={72}
      />
    ),
  },
];

const CTX_ROWS = [
  { name: "Auth refactor", meta: "quick win", data: { x: 2, y: 9 } as typeof FOCAL },
  { name: "Mobile app", meta: "big bet", data: { x: 8, y: 9 } as typeof FOCAL },
  { name: "Docs", meta: "fill-in", data: { x: 3, y: 2 } as typeof FOCAL },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Effort vs impact{" "}
        <span className="mc-inline">
          <QuadrantDot data={FOCAL} field={FIELD} {...AXES} height={16} summary={false} />
        </span>{" "}
        — one high-impact, low-effort outlier.
      </p>
    ),
    code: "<p>\n  Effort vs impact <QuadrantDot data={item} field={backlog} /> — one high-impact, low-effort outlier.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <QuadrantDot data={row.data} field={FIELD} {...AXES} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <QuadrantDot data={item} field={backlog} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Quick win</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">1</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">initiative flagged</span>
          </div>
        </div>
        <QuadrantDot data={CTX_ROWS[0]!.data} field={FIELD} {...AXES} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">1</span>\n  <span className="unit">initiative flagged</span>\n  <QuadrantDot data={item} field={backlog} />\n</div>',
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
            <QuadrantDot data={row.data} field={FIELD} {...AXES} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Auth <QuadrantDot data={item} field={backlog} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const field = (props.data.length ? props.data : FIELD.map((p) => p.y - p.x))
    .slice(0, 8)
    .map((v, i) => ({ x: (i * 3) % 10, y: (Math.abs(v) + i) % 10 }));
  return (
    <QuadrantDot
      data={{ x: 3, y: 8 }}
      field={field}
      xDomain={[0, 10]}
      domain={[0, 10]}
      summary={false}
      width={props.width ?? 40}
      height={props.height ?? 40}
    />
  );
}

export function markCode(): string {
  return `<QuadrantDot data={item} field={backlog} />`;
}

export function PreviewLive() {
  return (
    <QuadrantDotInteractive
      data={FOCAL}
      field={FIELD}
      {...AXES}
      summary={false}
      width={48}
      height={48}
      animate
    />
  );
}

export default {
  entry,
  Preview,
  PreviewLive,
  showcase,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
