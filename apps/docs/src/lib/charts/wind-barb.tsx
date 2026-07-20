import { WindBarb } from "@microcharts/react/wind-barb";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "WindBarb",
  slug: "wind-barb",
  status: "stable",
  collection: "frontier",
  tagline: "Which way it's flowing and roughly how hard, in one character.",
  staticImport: `${PKG}/wind-barb`,
  dataShape: "{ direction, magnitude }",
  encoding: { channel: "shaft angle + quantized barb count", precision: "medium" },
  nodeBudget: "≤ 3",
  bestFor: ["wind / current direction + strength", "traffic flow, net migration, request routing"],
  avoidFor: ["exact magnitude (label it)", "a time series (Sparkline)"],
  props: [
    {
      name: "direction",
      type: "number",
      required: true,
      description: "Degrees; 0 = up/north, clockwise.",
    },
    {
      name: "magnitude",
      type: "number",
      required: true,
      description: "Any unit; quantized into barbs.",
    },
    {
      name: "step",
      type: "number",
      required: false,
      description: "Full-barb quantum (each barb = step).",
    },
    {
      name: "label",
      type: '"value" | "none"',
      required: false,
      description: "Numeric magnitude beside the glyph.",
    },
    {
      name: "mode",
      type: '"barb" | "arrow"',
      required: false,
      description: '"arrow" swaps quantized barbs for a plain direction arrow + label.',
    },
  ],
  demo: [32],
  example: {
    title: "Wind",
    code: `import { WindBarb } from "${PKG}/wind-barb";\n\n<WindBarb direction={225} magnitude={32} step={10} title="Wind" />`,
  },
};

export function Preview() {
  return <WindBarb direction={225} magnitude={32} summary={false} size={32} />;
}

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "range",
      key: "direction",
      label: "direction °",
      min: 0,
      max: 359,
      step: 15,
      init: 225,
    },
    { kind: "range", key: "magnitude", label: "magnitude", min: 0, max: 90, init: 32 },
    { kind: "range", key: "step", label: "each barb =", min: 5, max: 20, step: 5, init: 10 },
    { kind: "segmented", key: "label", label: "label", options: ["none", "value"], init: "none" },
  ],
  render: (s) => (
    <WindBarb
      direction={s.direction as number}
      magnitude={s.magnitude as number}
      step={s.step as number}
      label={s.label as "none" | "value"}
      summary={false}
      size={64}
    />
  ),
  code: (s) =>
    [
      "<WindBarb",
      `  direction={${s.direction}}`,
      `  magnitude={${s.magnitude}}`,
      s.step !== 10 && `  step={${s.step}}`,
      s.label === "value" && '  label="value"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<WindBarb direction={row.dir} magnitude={row.speed} size={18} />`,
    node: <WindBarb direction={225} magnitude={32} summary={false} size={18} />,
  },
  {
    label: "with label",
    code: `<WindBarb direction={45} magnitude={25} label="value" />`,
    node: <WindBarb direction={45} magnitude={25} label="value" summary={false} size={32} />,
  },
];

const CTX_ROWS = [
  { name: "KSFO", meta: "225° 32", direction: 225, magnitude: 32 },
  { name: "KJFK", meta: "180° 18", direction: 180, magnitude: 18 },
  { name: "KORD", meta: "270° 24", direction: 270, magnitude: 24 },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Wind at KSFO{" "}
        <span className="mc-inline">
          <WindBarb direction={225} magnitude={32} size={20} summary={false} />
        </span>{" "}
        — SW 32 kt, three full barbs.
      </p>
    ),
    code: "<p>\n  Wind at KSFO <WindBarb direction={225} magnitude={32} /> — SW 32 kt, three full barbs.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <WindBarb
                  direction={row.direction}
                  magnitude={row.magnitude}
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
    code: "<td>\n  <WindBarb direction={225} magnitude={32} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Wind</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">225°</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">· 32 kt</span>
          </div>
        </div>
        <WindBarb direction={225} magnitude={32} size={48} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">225°</span>\n  <span className="unit">· 32 kt</span>\n  <WindBarb direction={225} magnitude={32} />\n</div>',
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
            <WindBarb
              direction={row.direction}
              magnitude={row.magnitude}
              size={18}
              summary={false}
            />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Coastal <WindBarb direction={225} magnitude={32} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <WindBarb
      direction={225}
      magnitude={Math.abs(props.data[0] ?? 32) || 32}
      summary={false}
      size={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<WindBarb direction={225} magnitude={32} />`;
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
