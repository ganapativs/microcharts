import { Thermometer } from "@microcharts/react/thermometer";
import { Thermometer as ThermometerInteractive } from "@microcharts/react/thermometer/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "Thermometer",
  slug: "thermometer",
  status: "stable",
  collection: "expressive",
  tagline: "Where a value sits on a calibrated range, and how close to the goal.",
  staticImport: `${PKG}/thermometer`,
  interactiveImport: `${PKG}/thermometer/interactive`,
  dataShape: "{ value: number; target?: number }",
  encoding: { channel: "column extent on a ticked calibrated scale", precision: "high" },
  nodeBudget: "≤ 6",
  bestFor: [
    "a fundraising or goal progress read",
    "a capacity or utilization gauge in a cell",
    "any value against a stated range",
  ],
  avoidFor: ["trends (Sparkline)", "proportions of a whole (SegmentedBar)", "many series"],
  props: [
    { name: "value", type: "number", required: true, description: "The reading." },
    {
      name: "target",
      type: "number",
      required: false,
      description: "A goal tick across the tube.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "The calibrated range (default [0, 100]).",
    },
    {
      name: "ticks",
      type: "number | number[]",
      required: false,
      description: "Tick count or explicit values.",
    },
    {
      name: "orientation",
      type: '"vertical" | "horizontal"',
      required: false,
      description: "Horizontal fits table cells.",
    },
    {
      name: "bulb",
      type: "boolean",
      required: false,
      description: "Draw the reservoir bulb (default true).",
    },
  ],
  demo: [72],
  example: {
    title: "Fundraiser",
    code: `import { Thermometer } from "${PKG}/thermometer";\n\n<Thermometer value={72} target={80} title="Fundraiser" />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-end gap-3">
      <Thermometer value={72} target={80} summary={false} />
      <Thermometer value={40} summary={false} />
      <Thermometer value={95} summary={false} />
    </span>
  );
}

export const showcase = {
  hint: "toward the goal",
  Node: () => <Thermometer value={72} target={80} title="Fundraiser" height={52} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value", min: 0, max: 100, step: 1, init: 72 },
    { kind: "range", key: "target", label: "target", min: 0, max: 100, step: 5, init: 80 },
    {
      kind: "segmented",
      key: "orientation",
      label: "orientation",
      options: ["vertical", "horizontal"],
      init: "vertical",
    },
    { kind: "toggle", key: "bulb", label: "bulb", init: true },
  ],
  render: (s) => (
    <Thermometer
      value={s.value as number}
      target={s.target as number}
      orientation={s.orientation as "vertical" | "horizontal"}
      bulb={s.bulb as boolean}
      summary={false}
      {...(s.orientation === "horizontal" ? { width: 120 } : { height: 72 })}
    />
  ),
  code: (s) =>
    [
      "<Thermometer",
      `  value={${s.value}}`,
      `  target={${s.target}}`,
      s.orientation !== "vertical" && `  orientation="${s.orientation}"`,
      s.bulb === false && "  bulb={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ThermometerInteractive
      value={s.value as number}
      target={s.target as number}
      orientation={s.orientation as "vertical" | "horizontal"}
      bulb={s.bulb as boolean}
      summary={false}
      animate={ui.animate}
      {...(s.orientation === "horizontal" ? { width: 120 } : { height: 72 })}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Thermometer",
      `  value={${s.value}}`,
      `  target={${s.target}}`,
      s.orientation !== "vertical" && `  orientation="${s.orientation}"`,
      s.bulb === false && "  bulb={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Tap to raise the level — the fill glides to its new reading (reduced-motion → it jumps), hover reveals the exact value, and each change is announced against the calibrated scale and target.",
};

export const recipes: Recipe[] = [
  {
    label: "horizontal, in a table cell",
    code: `<Thermometer value={62} orientation="horizontal" bulb={false} />`,
    node: (
      <Thermometer value={62} orientation="horizontal" bulb={false} summary={false} width={110} />
    ),
  },
  {
    label: "explicit calibration ticks",
    code: `<Thermometer value={72} domain={[32, 100]} ticks={[32, 50, 68, 86, 100]} />`,
    node: (
      <Thermometer
        value={72}
        domain={[32, 100]}
        ticks={[32, 50, 68, 86, 100]}
        summary={false}
        height={64}
      />
    ),
  },
];

const CTX_ROWS = [
  { name: "Annual", meta: "$72K" },
  { name: "Q4", meta: "$42K" },
  { name: "Emergency", meta: "$18K" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Fundraiser progress{" "}
        <span className="mc-inline">
          <Thermometer value={72} target={80} height={16} summary={false} />
        </span>{" "}
        — $72K raised, $8K from goal.
      </p>
    ),
    code: "<p>\n  Fundraiser progress <Thermometer value={72} target={80} /> — $72K raised, $8K from goal.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <Thermometer value={72} target={80} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <Thermometer value={72} target={80} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Fundraiser</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">$72K</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">of $80K goal</span>
          </div>
        </div>
        <Thermometer value={72} target={80} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">$72K</span>\n  <span className="unit">of $80K goal</span>\n  <Thermometer value={72} target={80} />\n</div>',
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
            <Thermometer value={72} target={80} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Annual <Thermometer value={72} target={80} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? Math.abs(props.data[0]!) % 100 : 72;
  return <Thermometer value={v} target={80} summary={false} height={props.height ?? 40} />;
}

export function markCode(): string {
  return `<Thermometer value={72} target={80} />`;
}

export function PreviewLive() {
  return (
    <span className="inline-flex items-end gap-3">
      <ThermometerInteractive value={72} target={80} summary={false} animate />
      <ThermometerInteractive value={40} summary={false} animate />
      <ThermometerInteractive value={95} summary={false} animate />
    </span>
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
