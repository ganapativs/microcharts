import { HeatStrip } from "@microcharts/react/heat-strip";
import { HeatStrip as HeatStripInteractive } from "@microcharts/react/heat-strip/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const LOAD = Array.from({ length: 30 }, (_, i) => Math.round(Math.sin(i / 4) * 40 + 50));
const D: [number, number] = [0, 100];
// Matches the top-of-page demo series.
const HOURLY_LOAD = [
  12, 25, 38, 52, 66, 79, 88, 90, 84, 71, 55, 40, 28, 45, 62, 78, 85, 74, 58, 35,
];
const TENANTS: { name: string; load: number[] }[] = [
  { name: "Acme", load: HOURLY_LOAD },
  { name: "Globex", load: HOURLY_LOAD.map((v) => Math.round(v * 0.4)) },
];

export const entry: ChartEntry = {
  name: "HeatStrip",
  slug: "heat-strip",
  status: "stable",
  collection: "core",
  tagline: "How intensity evolved, glanceably — the 1×N sibling of ActivityGrid.",
  staticImport: `${PKG}/heat-strip`,
  interactiveImport: `${PKG}/heat-strip/interactive`,
  dataShape: "(number | null)[]",
  encoding: {
    channel: "discrete color step per time cell",
    precision: "low — Sparkline when shape matters",
  },
  nodeBudget: "1 per cell (≤ 60 documented)",
  bestFor: ["per-tenant load rows", "intensity ribbons in tables", "dense time context"],
  avoidFor: ["exact shape (Sparkline)", "calendar rhythm (ActivityGrid)"],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "Time-ordered values; null = no record (≠ zero).",
    },
    {
      name: "steps",
      type: "number",
      required: false,
      description: "Shared step-scale granularity (default 5).",
    },
    {
      name: "shape",
      type: '"square" | "round" | "dot"',
      required: false,
      description: "Shared cell vocabulary.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Cross-row calibration — share one domain per table.",
    },
  ],
  demo: LOAD,
  example: {
    title: "Load per hour",
    code: `import { HeatStrip } from "${PKG}/heat-strip";\n\n<HeatStrip data={hourlyLoad} domain={[0, 100]} title="Load per hour" />`,
  },
  sampleData: [
    {
      name: "hourlyLoad",
      code: `const hourlyLoad = [12, 25, 38, 52, 66, 79, 88, 90, 84, 71, 55, 40, 28, 45, 62, 78, 85, 74, 58, 35];`,
    },
  ],
};

export function Preview() {
  return <HeatStrip data={LOAD} domain={D} summary={false} width={130} height={18} />;
}

export const showcase = {
  hint: "intensity strip",
  Node: () => <HeatStrip data={LOAD} domain={D} title="CPU pressure" width={130} height={18} />,
};

export const playground: PlaygroundSpec = {
  // shared domain across rows (see "shared-domain rows" below) — a slider
  // that rescales just this one strip would demo the anti-pattern the page
  // warns against. `data` gets the shuffle button instead of a knob.
  knobs: [
    { kind: "range", key: "steps", label: "steps", min: 2, max: 9, init: 5 },
    {
      kind: "segmented",
      key: "shape",
      label: "shape",
      options: ["square", "round", "dot"],
      init: "square",
    },
  ],
  data: LOAD,
  shuffle: (seed) =>
    Array.from({ length: 30 }, (_, i) => Math.round(Math.sin((i + seed * 3) / 4) * 40 + 50)),
  render: (s, data) => (
    <HeatStrip
      data={data}
      domain={D}
      steps={s.steps as number}
      shape={s.shape as "square" | "round" | "dot"}
      summary={false}
      width={260}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<HeatStrip",
      "  data={hourlyLoad}",
      "  domain={[0, 100]}",
      s.steps !== 5 && `  steps={${s.steps}}`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, data, ui) => (
    <HeatStripInteractive
      data={data}
      domain={D}
      steps={s.steps as number}
      shape={s.shape as "square" | "round" | "dot"}
      summary={false}
      animate={ui.animate}
      width={260}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<HeatStrip",
      "  data={hourlyLoad}",
      "  domain={[0, 100]}",
      s.steps !== 5 && `  steps={${s.steps}}`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow through the cells — each announces its position and value.",
};

export const recipes: Recipe[] = [
  {
    label: "shared-domain rows",
    code: `// one domain per table — rows stay comparable\n{tenants.map((t) => (\n  <HeatStrip key={t.id} data={t.load} domain={[0, 100]} />\n))}`,
    node: (
      <span className="inline-flex flex-col gap-1">
        <HeatStrip data={LOAD} domain={D} summary={false} width={160} height={12} />
        <HeatStrip
          data={LOAD.map((v) => Math.round(v * 0.4))}
          domain={D}
          summary={false}
          width={160}
          height={12}
        />
      </span>
    ),
  },
  {
    label: "nulls hold their slot",
    code: `// a missing record is visibly different from zero\n<HeatStrip data={[3, null, 8, null, 5]} />`,
    node: <HeatStrip data={[3, null, 8, null, 5]} summary={false} width={90} height={14} />,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        API load over the last 20 minutes{" "}
        <span className="mc-inline">
          <HeatStrip data={HOURLY_LOAD} domain={D} summary={false} width={110} height={14} />
        </span>{" "}
        — peaked at 90% by minute 8, dipped to 28%, spiked again, then closed at 35%.
      </p>
    ),
    code: `<p>\n  API load over the last 20 minutes{" "}\n  <HeatStrip data={hourlyLoad} domain={[0, 100]} height={14} /> — peaked at 90%, closed at 35%.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {TENANTS.map((t) => (
            <tr key={t.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{t.name}</td>
              <td className="py-1.5">
                <HeatStrip data={t.load} domain={D} summary={false} width={90} height={14} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {Math.max(...t.load)}% peak
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `// one shared domain — rows stay comparable\n{tenants.map((t) => (\n  <tr key={t.name}>\n    <td>{t.name}</td>\n    <td><HeatStrip data={t.load} domain={[0, 100]} /></td>\n  </tr>\n))}`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Load, last 20 min</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">90%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">peak, minute 8</span>
          </div>
        </div>
        <HeatStrip data={HOURLY_LOAD} domain={D} summary={false} width={200} height={30} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">90%</span>\n  <span className="unit">peak, minute 8</span>\n  <HeatStrip data={hourlyLoad} domain={[0, 100]} width={200} height={30} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {TENANTS.map((t, i) => (
          <span
            key={t.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {t.name}
            <HeatStrip data={t.load} domain={D} summary={false} width={44} height={12} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Acme <HeatStrip data={hourlyLoad} domain={[0, 100]} height={12} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <HeatStrip
      data={props.data}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 10}
    />
  );
}

export function markCode(): string {
  return `<HeatStrip data={data} />`;
}

export function PreviewLive() {
  return (
    <HeatStripInteractive data={LOAD} domain={D} summary={false} width={130} height={18} animate />
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
