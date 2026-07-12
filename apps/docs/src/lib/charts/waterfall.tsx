import { Waterfall } from "@microcharts/react/waterfall";
import { Waterfall as WaterfallInteractive } from "@microcharts/react/waterfall/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const PL = [
  { label: "Product", value: 42 },
  { label: "Services", value: 18 },
  { label: "Refunds", value: -12 },
  { label: "Opex", value: -26 },
  { label: "FX", value: 5 },
];

export const entry: ChartEntry = {
  name: "Waterfall",
  slug: "waterfall",
  status: "stable",
  collection: "core",
  tagline: "How the deltas compose into the total — P&L in a cell.",
  staticImport: `${PKG}/waterfall`,
  interactiveImport: `${PKG}/waterfall/interactive`,
  dataShape: "{ label, value }[] of signed deltas, in order",
  encoding: {
    channel: "bar position/length from a running level",
    precision: "medium — label='delta' or the interactive readout for exact steps",
  },
  nodeBudget: "≤ 15 (≤ 7 step rects + connectors + total bar)",
  bestFor: ["P&L bridges in table cells", "net-change decomposition in KPI cards"],
  avoidFor: ["unordered category comparison (MiniBar)", "more than ~8 steps"],
  props: [
    {
      name: "data",
      type: "{ label; value }[]",
      required: true,
      description: "Signed deltas in order.",
    },
    {
      name: "start",
      type: "number",
      required: false,
      description: "Opening level (prior-period close).",
    },
    {
      name: "total",
      type: "boolean",
      required: false,
      description: "Zero-anchored closing total bar (default on).",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: '"down" = decreases are good (cost breakdowns).',
    },
    {
      name: "label",
      type: '"none" | "delta"',
      required: false,
      description:
        '"delta" prints each step\'s signed value in a band below the plot; the biggest movers win when labels would collide.',
    },
  ],
  demo: PL.map((d) => d.value),
  example: {
    title: "Net income bridge",
    code: `import { Waterfall } from "${PKG}/waterfall";\n\n<Waterfall data={steps} start={60} title="Net income bridge" />`,
  },
  sampleData: [
    {
      name: "steps",
      code: `const steps = [
  { label: "Product", value: 42 },
  { label: "Services", value: 18 },
  { label: "Refunds", value: -12 },
  { label: "Opex", value: -26 },
  { label: "FX", value: 5 },
];`,
    },
  ],
};

export function Preview() {
  return <Waterfall data={PL} start={60} summary={false} width={130} height={24} />;
}

export const showcase = {
  hint: "bridge",
  Node: () => <Waterfall data={PL} start={60} title="Net income bridge" width={130} height={24} />,
};

// domain, format, locale, id, className, style, children: styling/formatting

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "start", label: "start", min: 0, max: 100, step: 5, init: 60 },
    { kind: "toggle", key: "total", label: "total bar", init: true },
    { kind: "toggle", key: "delta", label: "delta labels", init: false },
    {
      kind: "segmented",
      key: "positive",
      label: "positive",
      options: ["up", "down"],
      init: "up",
    },
  ],
  render: (s) => (
    <Waterfall
      data={PL}
      start={s.start as number}
      total={s.total as boolean}
      label={s.delta ? "delta" : "none"}
      positive={s.positive as "up" | "down"}
      summary={false}
      width={260}
      height={32}
    />
  ),
  code: (s) =>
    [
      "<Waterfall",
      "  data={steps}",
      `  start={${s.start}}`,
      s.total === false && "  total={false}",
      s.delta && '  label="delta"',
      s.positive !== "up" && `  positive="${s.positive}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <WaterfallInteractive
      data={PL}
      start={s.start as number}
      total={s.total as boolean}
      label={s.delta ? "delta" : "none"}
      positive={s.positive as "up" | "down"}
      animate={ui.animate}
      summary={false}
      width={260}
      height={32}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Waterfall",
      "  data={steps}",
      `  start={${s.start}}`,
      s.total === false && "  total={false}",
      s.delta && '  label="delta"',
      s.positive !== "up" && `  positive="${s.positive}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow through the steps — each announces its delta and the running level.",
};

export const recipes: Recipe[] = [
  {
    label: "signed step labels (biggest movers win collisions)",
    code: `<Waterfall data={steps} start={60} label="delta" />`,
    node: <Waterfall data={PL} start={60} label="delta" summary={false} width={220} height={26} />,
  },
  {
    label: "P&L rows",
    code: `{quarters.map((q) => (\n  <Waterfall key={q.id} data={q.steps} start={q.open} title={q.name} />\n))}`,
    node: <Waterfall data={PL} start={60} summary={false} width={160} height={20} />,
  },
  {
    label: "cost bridge (down is good)",
    code: `<Waterfall data={steps.map((d) => ({ label: d.label, value: -d.value }))} positive="down" />`,
    node: (
      <Waterfall
        data={PL.map((d) => ({ label: d.label, value: -d.value }))}
        start={60}
        positive="down"
        summary={false}
        width={160}
        height={20}
      />
    ),
  },
];

type Step = { label: string; value: number | null };

const UNITS: { name: string; start: number; steps: Step[] }[] = [
  { name: "Core", start: 60, steps: PL },
  {
    name: "Labs",
    start: 22,
    steps: [
      { label: "Product", value: 9 },
      { label: "Opex", value: -14 },
      { label: "FX", value: 2 },
    ],
  },
  {
    name: "Field",
    start: 15,
    steps: [
      { label: "Product", value: 4 },
      { label: "Refunds", value: -6 },
    ],
  },
];

const BRIDGES: { name: string; steps: Step[]; positive: "up" | "down" }[] = [
  { name: "Revenue", steps: PL, positive: "up" },
  { name: "Costs", steps: PL.map((d) => ({ label: d.label, value: -d.value })), positive: "down" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Net income bridged from $60k to $87k this quarter{" "}
        <span className="mc-inline">
          <Waterfall data={PL} start={60} summary={false} width={100} height={16} />
        </span>{" "}
        — Product and Services carried it past Refunds and Opex.
      </p>
    ),
    code: `<p>\n  Net income bridged from $60k to $87k this quarter{" "}\n  <Waterfall data={steps} start={60} width={100} height={16} /> — Product and\n  Services carried it past Refunds and Opex.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {UNITS.map((u) => {
            const net = u.steps.reduce((s, d) => s + (d.value ?? 0), 0);
            return (
              <tr key={u.name} className="border-t border-fd-border/60 first:border-0">
                <td className="py-1.5 pr-3 text-fd-muted-foreground">{u.name}</td>
                <td className="py-1.5">
                  <Waterfall
                    data={u.steps}
                    start={u.start}
                    summary={false}
                    width={70}
                    height={16}
                  />
                </td>
                <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                  {net >= 0 ? "+" : "−"}
                  {Math.abs(net)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    ),
    code: `<td>\n  <Waterfall data={unit.steps} start={unit.start} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Q2 net income</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">$87k</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">from $60k</span>
          </div>
        </div>
        <Waterfall data={PL} start={60} summary={false} width={200} height={26} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">$87k</span>\n  <span className="unit">from $60k</span>\n  <Waterfall data={steps} start={60} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {BRIDGES.map((b, i) => (
          <span
            key={b.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {b.name}
            <Waterfall
              data={b.steps}
              start={60}
              positive={b.positive}
              summary={false}
              width={44}
              height={14}
            />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Revenue <Waterfall data={steps} start={60} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <Waterfall
      data={props.data.slice(0, 6).map((v, i) => ({ label: `S${i + 1}`, value: v - 10 }))}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<Waterfall data={steps} start={open} />`;
}

export default {
  entry,
  Preview,
  showcase,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
