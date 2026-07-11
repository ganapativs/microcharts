import { HeatCell } from "@microcharts/react/heat-cell";
import { InteractiveDemo } from "./heat-cell.client";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const D = [0, 100] as const;

/* Shared demo matrix for the four homes — a tiny shard × hour load grid, the
   exact "table-cell matrix" HeatCell exists for. One domain (D) throughout,
   never per-cell auto-scaled. */
const HOURS = ["00:00", "06:00", "12:00", "18:00"] as const;
const SHARDS = [
  { label: "shard-a", load: [18, 42, 76, 55] },
  { label: "shard-b", load: [30, 61, 88, 40] },
  { label: "shard-c", load: [12, 25, 48, 33] },
] as const;

export const entry: ChartEntry = {
  name: "HeatCell",
  slug: "heat-cell",
  status: "stable",
  collection: "core",
  tagline: "One calibrated color step — the building block for host-owned grids.",
  staticImport: `${PKG}/heat-cell`,
  interactiveImport: `${PKG}/heat-cell/interactive`,
  dataShape: "number (+ shared domain)",
  encoding: {
    channel: "discrete color step",
    precision: "low — use MiniBar/DotPlot for precise comparison",
  },
  nodeBudget: "≤ 2 (cell + optional value label)",
  bestFor: ["table-cell matrices", "calendar-like grids you lay out yourself", "intensity chips"],
  avoidFor: ["precise value comparison", "per-cell auto-scaling (share one domain!)"],
  props: [
    { name: "value", type: "number", required: true, description: "The value to calibrate." },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Calibration scale — defaults to [0, 1]; every cell in a grid must share one.",
    },
    {
      name: "steps",
      type: "number",
      required: false,
      description: "Discrete perceptual steps (default 5, shared with ActivityGrid).",
    },
    {
      name: "shape",
      type: '"square" | "round" | "dot"',
      required: false,
      description: "Shared cell vocabulary.",
    },
    {
      name: "label",
      type: '"value" | "none"',
      required: false,
      description: "Centered number when the cell doubles as a chip.",
    },
  ],
  demo: [42],
  example: {
    title: "Load cell",
    code: `import { HeatCell } from "${PKG}/heat-cell";\n\n<HeatCell value={42} domain={[0, 100]} title="Load" />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-center gap-1.5">
      {[12, 35, 58, 79, 96].map((v) => (
        <HeatCell key={v} value={v} domain={D} summary={false} style={{ width: 16, height: 16 }} />
      ))}
    </span>
  );
}

export const showcase = {
  hint: "intensity",
  Node: () => <HeatCell value={72} domain={D} title="Load" style={{ width: 20, height: 20 }} />,
};

export const playground: PlaygroundSpec = {
  // `domain` is deliberately not a knob: it's fixed to [0, 100] here because
  // the entire point of HeatCell is calibrating against ONE shared domain —
  // letting readers drag it per-cell would demo the anti-pattern the
  // "shared-domain rule" section on this page warns against.
  knobs: [
    { kind: "range", key: "value", label: "value", min: 0, max: 100, init: 42 },
    { kind: "range", key: "steps", label: "steps", min: 2, max: 9, init: 5 },
    {
      kind: "segmented",
      key: "shape",
      label: "shape",
      options: ["square", "round", "dot"],
      init: "square",
    },
    { kind: "toggle", key: "label", label: "value label", init: false },
  ],
  render: (s) => (
    <HeatCell
      value={s.value as number}
      domain={D}
      steps={s.steps as number}
      shape={s.shape as "square" | "round" | "dot"}
      label={(s.label as boolean) ? "value" : "none"}
      summary={false}
      style={{ width: 48, height: 48 }}
    />
  ),
  code: (s) =>
    [
      "<HeatCell",
      `  value={${s.value}}`,
      "  domain={[0, 100]}",
      s.steps !== 5 && `  steps={${s.steps}}`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      (s.label as boolean) && '  label="value"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "a shared-domain row",
    code: `// every cell calibrates against ONE domain — never per-cell auto-scale\n{[12, 40, 62, 88].map((v) => (\n  <HeatCell key={v} value={v} domain={[0, 100]} />\n))}`,
    node: (
      <span className="inline-flex items-center gap-1">
        {[12, 40, 62, 88].map((v) => (
          <HeatCell
            key={v}
            value={v}
            domain={D}
            summary={false}
            style={{ width: 14, height: 14 }}
          />
        ))}
      </span>
    ),
  },
  {
    label: "value chip",
    code: `// wider cells can carry their number\n<HeatCell value={8} domain={[0, 9]} label="value" style={{ width: 28, height: 28 }} />`,
    node: (
      <HeatCell
        value={8}
        domain={[0, 9]}
        label="value"
        summary={false}
        style={{ width: 28, height: 28 }}
      />
    ),
  },
];

/* The four homes — HeatCell always doing the one thing it's for: a single
   calibrated step, laid out by the host, sharing one domain. Every host is an
   ops/load surface, never a generic "signups" template. */
export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        shard-a load just crossed{" "}
        <span className="mx-1 inline-flex align-middle">
          <HeatCell value={76} domain={D} summary={false} style={{ width: 14, height: 14 }} />
        </span>{" "}
        76% — level 4 of 5, its hottest slot today.
      </p>
    ),
    code: `<p>\n  shard-a load just crossed{" "}\n  <HeatCell value={76} domain={[0, 100]} /> 76% — level 4 of 5.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-fd-muted-foreground text-xs">
            <th className="pb-1.5 pr-3 text-left font-normal" />
            {HOURS.map((h) => (
              <th key={h} className="px-1 pb-1.5 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHARDS.map((s) => (
            <tr key={s.label} className="border-t border-fd-border/60 first:border-0">
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{s.label}</td>
              {s.load.map((v, i) => (
                <td key={HOURS[i]} className="px-1 py-1.5">
                  <HeatCell
                    value={v}
                    domain={D}
                    summary={false}
                    style={{ width: 16, height: 16 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `// every cell in the grid shares ONE domain\n<tr>\n  <td>shard-a</td>\n  {[18, 42, 76, 55].map((v) => (\n    <td key={v}><HeatCell value={v} domain={[0, 100]} /></td>\n  ))}\n</tr>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">shard-a load</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">76%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">peak this cycle</span>
          </div>
        </div>
        <span className="inline-flex gap-1">
          {SHARDS[0].load.map((v, i) => (
            <HeatCell
              key={HOURS[i]}
              value={v}
              domain={D}
              summary={false}
              style={{ width: 14, height: 14 }}
            />
          ))}
        </span>
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">76%</span>\n  <span className="unit">peak this cycle</span>\n  {[18, 42, 76, 55].map((v) => (\n    <HeatCell key={v} value={v} domain={[0, 100]} />\n  ))}\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {SHARDS.map((s, i) => (
          <span
            key={s.label}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {s.label}
            <HeatCell
              value={Math.max(...s.load)}
              domain={D}
              summary={false}
              style={{ width: 12, height: 12 }}
            />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  shard-a <HeatCell value={76} domain={[0, 100]} />\n</button>`,
  },
};

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <HeatCell value={72} domain={D} summary={false} style={{ width: 12, height: 12 }} />;
}

export function markCode(): string {
  return `<HeatCell value={72} domain={[0, 100]} />`;
}

export default {
  entry,
  Preview,
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
