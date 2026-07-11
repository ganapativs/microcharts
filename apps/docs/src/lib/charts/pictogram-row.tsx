import { PictogramRow } from "@microcharts/react/pictogram-row";
import { InteractiveDemo } from "./pictogram-row.client";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "PictogramRow",
  slug: "pictogram-row",
  status: "stable",
  collection: "core",
  tagline: "Counts a human can verify by counting — ●●●○○.",
  staticImport: `${PKG}/pictogram-row`,
  interactiveImport: `${PKG}/pictogram-row/interactive`,
  dataShape: "value of total (units)",
  encoding: { channel: "filled-unit count", precision: "high — it is the number" },
  nodeBudget: "1 per unit (total ≤ 20 documented)",
  bestFor: ["seats and slots in a sentence", "ratings", "capacity rows"],
  avoidFor: ["> 20 units (Progress)", "continuous ratios (Progress)"],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "Filled units (may be fractional).",
    },
    { name: "total", type: "number", required: true, description: "Unit count." },
    {
      name: "shape",
      type: '"dot" | "square"',
      required: false,
      description: "Squares pack tighter in table cells.",
    },
    {
      name: "fractional",
      type: '"clip" | "round"',
      required: false,
      description: "Clip shows the true partial unit; round for seat-like units.",
    },
    {
      name: "renderPoint",
      type: "(unit) => ReactNode",
      required: false,
      description: "Custom unit glyph (star ratings) — the one sanctioned customization.",
    },
  ],
  demo: [5],
  example: {
    title: "Committee seats",
    code: `import { PictogramRow } from "${PKG}/pictogram-row";\n\n<PictogramRow value={5} total={8} title="Committee seats held" />`,
  },
};

export function Preview() {
  return <PictogramRow value={5} total={8} summary={false} width={110} height={16} />;
}

export const showcase = {
  hint: "count",
  Node: () => <PictogramRow value={6.5} total={8} title="Capacity used" width={110} height={16} />,
};

// renderPoint is a render-prop escape hatch (custom unit glyph), not a knob.
// color, format, locale, strings, title, summary, id, className, style,
// children: styling/formatting/accessible-name overrides, not chart-shape
// knobs — no interactive control (consistent with every other chart's
// playground).
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value", min: 0, max: 8, step: 0.5, init: 5 },
    { kind: "range", key: "total", label: "total", min: 2, max: 12, init: 8 },
    { kind: "segmented", key: "shape", label: "shape", options: ["dot", "square"], init: "dot" },
    {
      kind: "segmented",
      key: "fractional",
      label: "fractional",
      options: ["clip", "round"],
      init: "clip",
    },
  ],
  render: (s) => (
    <PictogramRow
      value={s.value as number}
      total={s.total as number}
      shape={s.shape as "dot" | "square"}
      fractional={s.fractional as "clip" | "round"}
      summary={false}
      width={240}
      height={28}
    />
  ),
  code: (s) =>
    [
      "<PictogramRow",
      `  value={${s.value}}`,
      `  total={${s.total}}`,
      s.shape !== "dot" && `  shape="${s.shape}"`,
      s.fractional !== "clip" && `  fractional="${s.fractional}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "inline in a sentence",
    code: `holds <PictogramRow value={5} total={8}\n  style={{ width: "4.5em", height: "0.8em" }} /> of the seats`,
    node: (
      <span>
        holds{" "}
        <PictogramRow
          value={5}
          total={8}
          summary={false}
          style={{ width: "4.5em", height: "0.8em" }}
        />{" "}
        of the seats
      </span>
    ),
  },
  {
    label: "star rating via renderPoint",
    code: `<PictogramRow value={3.5} total={5}\n  renderPoint={(u) => <path key={u.index} d={starPath(u)} … />} />`,
    node: <PictogramRow value={3.5} total={5} summary={false} width={90} height={16} />,
  },
];

const ROOMS: { label: string; value: number; total: number }[] = [
  { label: "Studio A", value: 3, total: 6 },
  { label: "Studio B", value: 6, total: 6 },
  { label: "Studio C", value: 1, total: 4 },
];

const PRODUCTS: { label: string; value: number; total: number }[] = [
  { label: "Aria Desk", value: 4, total: 5 },
  { label: "Aria Lite", value: 2, total: 5 },
];

/* The four homes — PictogramRow always doing the one thing it's for: a count
   a reader can verify by counting. Every host is a seats/slots/ratings
   surface, never a generic "signups" template. */
export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        The oversight committee holds{" "}
        <span className="mx-1 inline-flex align-middle">
          <PictogramRow value={5} total={8} summary={false} width={90} height={16} />
        </span>{" "}
        of its 8 seats — a working majority.
      </p>
    ),
    code: `<p>\n  The oversight committee holds{" "}\n  <PictogramRow value={5} total={8} height={16} /> of its 8 seats — a working majority.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {ROOMS.map((r) => (
            <tr key={r.label} className="border-t border-fd-border/60 first:border-0">
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{r.label}</td>
              <td className="py-1.5">
                <PictogramRow
                  value={r.value}
                  total={r.total}
                  shape="square"
                  summary={false}
                  width={56}
                  height={13}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {r.value} of {r.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <PictogramRow value={6} total={6} shape="square" />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Rack capacity</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">14 / 20</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">slots filled</span>
          </div>
        </div>
        <PictogramRow value={14} total={20} summary={false} width={160} height={16} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">14 / 20</span>\n  <span className="unit">slots filled</span>\n  <PictogramRow value={14} total={20} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {PRODUCTS.map((p, i) => (
          <span
            key={p.label}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {p.label}
            <PictogramRow value={p.value} total={p.total} summary={false} width={42} height={10} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Aria Desk <PictogramRow value={4} total={5} height={10} />\n</button>`,
  },
};

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <PictogramRow value={3} total={5} summary={false} width={56} height={12} />;
}

export function markCode(): string {
  return `<PictogramRow value={3} total={5} />`;
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
