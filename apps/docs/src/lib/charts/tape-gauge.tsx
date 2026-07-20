import { TapeGauge } from "@microcharts/react/tape-gauge";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const ZONES = [
  { from: 100, to: 130, tone: "pos" as const },
  { from: 130, to: 150, tone: "warn" as const },
  { from: 150, to: 200, tone: "neg" as const },
];

export const entry: ChartEntry = {
  name: "TapeGauge",
  slug: "tape-gauge",
  status: "stable",
  collection: "frontier",
  tagline:
    "The level now, the zone it's in, and how fast it's moving, with the eye parked in one place.",
  staticImport: `${PKG}/tape-gauge`,
  interactiveImport: `${PKG}/tape-gauge/interactive`,
  picker: false,
  dataShape: "value: number, rate?: number, zones?: { from, to, tone }[]",
  encoding: {
    channel: "position on a moving scale = level; chevron count = rate (a separate channel)",
    precision: "high",
  },
  nodeBudget: "1 pointer + 1 tick path + ≤4 zone rects",
  bestFor: [
    "a live changing reading (airspeed, throughput, temp)",
    "value + trend + safe/caution band at a glance",
  ],
  avoidFor: ["a history you want to scan (Sparkline)", "a single static number (Delta)"],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "The current level; parked at the pointer.",
    },
    {
      name: "rate",
      type: "number",
      required: false,
      description: "Signed units/tick; drives the chevrons.",
    },
    {
      name: "zones",
      type: "{ from, to, tone }[]",
      required: false,
      description: "Semantic bands on the scale.",
    },
    {
      name: "span",
      type: "number",
      required: false,
      description: "Visible scale extent; fixed while live.",
    },
    {
      name: "rateTiers",
      type: "[number, number]",
      required: false,
      description: "Thresholds for 1 and 2 chevrons (default [span/60, span/15]).",
    },
    {
      name: "orientation",
      type: '"vertical" | "horizontal"',
      required: false,
      description: "Tape direction (default vertical).",
    },
    {
      name: "announceEvery",
      type: "number",
      required: false,
      interactive: true,
      description:
        "Minimum ms between live-region announcements as the value streams (default 5000).",
    },
  ],
  demo: [142],
  example: {
    title: "Airspeed",
    code: `import { TapeGauge } from "${PKG}/tape-gauge";\n\n<TapeGauge value={142} rate={1} zones={zones} span={60} title="Airspeed" />`,
  },
  sampleData: [
    {
      name: "zones",
      code: `const zones = [
  { from: 100, to: 130, tone: "pos" },
  { from: 130, to: 150, tone: "warn" },
  { from: 150, to: 200, tone: "neg" },
];`,
    },
  ],
};

export function Preview() {
  return (
    <TapeGauge
      value={142}
      rate={1}
      zones={ZONES}
      span={60}
      summary={false}
      width={46}
      height={60}
    />
  );
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value", min: 100, max: 200, step: 1, init: 142 },
    { kind: "range", key: "rate", label: "rate", min: -3, max: 3, step: 1, init: 1 },
    {
      kind: "segmented",
      key: "orientation",
      label: "orientation",
      options: ["vertical", "horizontal"],
      init: "vertical",
    },
  ],
  render: (s) => {
    const vertical = s.orientation !== "horizontal";
    return (
      <TapeGauge
        value={s.value as number}
        rate={s.rate as number}
        zones={ZONES}
        span={60}
        orientation={s.orientation as "vertical" | "horizontal"}
        summary={false}
        width={vertical ? 44 : 240}
        height={vertical ? 112 : 48}
      />
    );
  },
  code: (s) =>
    [
      "<TapeGauge",
      `  value={${s.value}}`,
      s.rate !== 0 && `  rate={${s.rate}}`,
      "  zones={zones}",
      s.orientation !== "vertical" && `  orientation="${s.orientation}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "A live reading: the scale scrolls while the value stays parked at the pointer; chevrons show how fast it's moving, and each change is announced politely.",
};

export const recipes: Recipe[] = [
  {
    label: "KPI card",
    code: `<TapeGauge value={142} rate={1} zones={zones} span={60} title="Airspeed" />`,
    node: (
      <TapeGauge
        value={142}
        rate={1}
        zones={ZONES}
        span={60}
        summary={false}
        width={46}
        height={68}
      />
    ),
  },
  {
    label: "horizontal cell",
    code: `<TapeGauge value={142} rate={-1} zones={zones} span={60} orientation="horizontal" />`,
    node: (
      <TapeGauge
        value={142}
        rate={-1}
        zones={ZONES}
        span={60}
        orientation="horizontal"
        summary={false}
        width={140}
        height={28}
      />
    ),
  },
];

const CTX_ROWS = [
  { name: "Eng 1", meta: "142", value: 142, rate: 1 },
  { name: "Eng 2", meta: "138", value: 138, rate: -1 },
  { name: "Eng 3", meta: "145", value: 145, rate: 2 },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Airspeed reading{" "}
        <span className="mc-inline">
          <TapeGauge
            value={142}
            rate={1}
            zones={ZONES}
            span={60}
            orientation="horizontal"
            width={88}
            height={14}
            summary={false}
          />
        </span>{" "}
        — 142 knots, rising into caution band.
      </p>
    ),
    code: '<p>\n  Airspeed reading <TapeGauge value={142} rate={1} zones={zones} span={60} orientation="horizontal" /> — 142 knots, rising into caution band.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <TapeGauge
                  value={row.value}
                  rate={row.rate}
                  zones={ZONES}
                  span={60}
                  orientation="horizontal"
                  width={100}
                  height={16}
                  summary={false}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: '<td>\n  <TapeGauge value={142} rate={1} zones={zones} span={60} orientation="horizontal" />\n</td>',
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Airspeed</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">142</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">knots ↑</span>
          </div>
        </div>
        <TapeGauge
          value={142}
          rate={1}
          zones={ZONES}
          span={60}
          orientation="horizontal"
          width={180}
          height={22}
          summary={false}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">142</span>\n  <span className="unit">knots ↑</span>\n  <TapeGauge value={142} rate={1} zones={zones} span={60} orientation="horizontal" />\n</div>',
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
            <TapeGauge
              value={row.value}
              rate={row.rate}
              zones={ZONES}
              span={60}
              orientation="horizontal"
              width={48}
              height={12}
              summary={false}
            />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Cruise <TapeGauge value={142} rate={1} zones={zones} span={60} orientation="horizontal" />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <TapeGauge
      value={props.data[0] ?? 142}
      rate={1}
      zones={ZONES}
      span={60}
      summary={false}
      width={props.width ?? 28}
      height={props.height ?? 48}
    />
  );
}

export function markCode(): string {
  return `<TapeGauge value={142} rate={1} zones={zones} span={60} />`;
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
