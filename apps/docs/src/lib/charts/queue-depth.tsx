import { QueueDepth } from "@microcharts/react/queue-depth";
import { QueueDepth as QueueDepthInteractive } from "@microcharts/react/queue-depth/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a support backlog growing through capacity (100) to 2.14× at the end
export const DATA = [42, 55, 70, 88, 96, 120, 150, 182, 214];
export const CAP = 100;

export const entry: ChartEntry = {
  name: "QueueDepth",
  slug: "queue-depth",
  status: "stable",
  collection: "decision",
  tagline: "Is the backlog draining or growing?",
  staticImport: `${PKG}/queue-depth`,
  interactiveImport: `${PKG}/queue-depth/interactive`,
  dataShape: "number[] — backlog depth per period (≥ 0)",
  encoding: {
    channel: "zero-anchored area (stock) + above-capacity spans re-stroked negative",
    precision: "high for the depth; the trend glyph is a low-precision direction cue",
  },
  nodeBudget: "≤ 7",
  bestFor: [
    "a support-queue backlog in a KPI card",
    "a work-in-progress stock vs its WIP limit",
    "will-it-drain in a tab header",
  ],
  avoidFor: ["a rate rather than a stock (Sparkline)", "a single count (Delta)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Backlog depth per period (≥ 0). null / NaN / ±Infinity are gaps.",
    },
    {
      name: "capacity",
      type: "number",
      required: false,
      description: "Steady-state capacity: a dashed hairline; spans above it re-stroke negative.",
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Endpoint value + trend glyph (▴/▾), default 'last', or nothing.",
    },
  ],
  demo: DATA,
  example: {
    title: "Support queue",
    code: `import { QueueDepth } from "${PKG}/queue-depth";\n\n<QueueDepth\n  data={[42, 55, 70, 88, 96, 120, 150, 182, 214]}\n  capacity={100}\n  title="Support queue"\n/>`,
  },
};

export function Preview() {
  return <QueueDepth data={DATA} capacity={CAP} summary={false} width={150} height={26} />;
}

export const showcase = {
  hint: "backlog vs capacity",
  Node: () => (
    <QueueDepth data={DATA} capacity={CAP} title="Support queue" width={150} height={26} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "capacity", label: "capacity", init: true },
    { kind: "segmented", key: "label", label: "label", options: ["none", "last"], init: "last" },
  ],
  render: (s) => (
    <QueueDepth
      data={DATA}
      capacity={s.capacity ? CAP : undefined}
      label={s.label as "last" | "none"}
      summary={false}
      width={280}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<QueueDepth",
      "  data={data}",
      s.capacity && "  capacity={100}",
      s.label !== "last" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <QueueDepthInteractive
      data={DATA}
      capacity={s.capacity ? CAP : undefined}
      label={s.label as "last" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<QueueDepth",
      "  data={data}",
      s.capacity && "  capacity={100}",
      s.label !== "last" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the periods — each announces the depth and whether it's above capacity.",
};

export const recipes: Recipe[] = [
  {
    label: "draining below capacity",
    code: `<QueueDepth data={[214, 190, 150, 120, 96, 70, 48]} capacity={100} />`,
    node: (
      <QueueDepth
        data={[214, 190, 150, 120, 96, 70, 48]}
        capacity={CAP}
        summary={false}
        width={170}
        height={26}
      />
    ),
  },
  {
    label: "no capacity reference",
    code: `<QueueDepth data={[42, 55, 70, 88, 96, 120, 150, 182, 214]} />`,
    node: <QueueDepth data={DATA} summary={false} width={170} height={26} />,
  },
];

const CTX_ROWS = [
  { name: "Tier 1", meta: "64", data: [46, 49, 51, 54, 56, 59, 61, 64] },
  { name: "Tier 2", meta: "28", data: [20, 21, 22, 24, 25, 26, 27, 28] },
  { name: "Tier 3", meta: "9", data: [6, 7, 7, 8, 8, 8, 9, 9] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Support queue backlog{" "}
        <span className="mc-inline">
          <QueueDepth data={DATA} capacity={CAP} height={16} summary={false} />
        </span>{" "}
        — 64 open, approaching capacity.
      </p>
    ),
    code: "<p>\n  Support queue backlog <QueueDepth data={data} capacity={100} /> — 64 open, approaching capacity.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <QueueDepth data={row.data} capacity={CAP} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <QueueDepth data={data} capacity={100} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Backlog</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">64</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">open tickets</span>
          </div>
        </div>
        <QueueDepth data={CTX_ROWS[0]!.data} capacity={CAP} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">64</span>\n  <span className="unit">open tickets</span>\n  <QueueDepth data={data} capacity={100} />\n</div>',
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
            <QueueDepth data={row.data} capacity={CAP} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Tier 1 <QueueDepth data={data} capacity={100} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const depth = (props.data.length ? props.data : DATA).map((v, k) =>
    Math.max(0, 40 + k * 12 + (Math.abs(v) % 20)),
  );
  return (
    <QueueDepth
      data={depth}
      label="none"
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<QueueDepth data={data} capacity={100} />`;
}

export function PreviewLive() {
  return (
    <QueueDepthInteractive
      data={DATA}
      capacity={CAP}
      summary={false}
      width={150}
      height={26}
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
