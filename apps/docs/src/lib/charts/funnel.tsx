import { Funnel } from "@microcharts/react/funnel";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const PIPE = [
  { label: "Visitors", value: 12400 },
  { label: "Signups", value: 5704 },
  { label: "Activated", value: 2730 },
  { label: "Paid", value: 1116 },
];
const REFERRAL = [
  { label: "Visitors", value: 3200 },
  { label: "Signups", value: 2100 },
  { label: "Activated", value: 1400 },
  { label: "Paid", value: 690 },
];

export const entry: ChartEntry = {
  name: "Funnel",
  slug: "funnel",
  status: "stable",
  collection: "core",
  tagline: "Where does the pipeline leak? Stage-to-stage conversion in a cell.",
  staticImport: `${PKG}/funnel`,
  interactiveImport: `${PKG}/funnel/interactive`,
  dataShape: "{ label, value }[] (ordered stages)",
  encoding: {
    channel: "column height per stage, zero-anchored",
    precision: "high (rects, no trapezoid interpolation)",
  },
  nodeBudget: "2/stage − 1 (≤ 6 stages)",
  maxWidth: 260,
  maxHeight: 80,
  gotchas: [
    "`format` merges with this chart's own unit instead of replacing it, so changing notation or precision keeps the unit; an explicit `style` opts out of the unit and of the digit defaults calibrated for it.",
    "Past 6 stages the drops blur; the component dev-warns past the cap.",
  ],
  bestFor: ["per-campaign funnels in tables", "conversion in cards"],
  avoidFor: ["unordered categories (MiniBar)", "> 6 stages"],
  props: [
    { name: "data", type: "{ label; value }[]", required: true, description: "Ordered stages." },
    {
      name: "mode",
      type: '"absolute" | "rate"',
      required: false,
      description: "Rate = % of the FIRST stage (never the previous).",
    },
    {
      name: "connectors",
      type: "boolean",
      required: false,
      description: "Retained-share slats between stages.",
    },
    {
      name: "label",
      type: '"none" | "percent" | "value"',
      required: false,
      description: "Above each column (deterministic drop-out; default percent).",
    },
    {
      name: "highlight",
      type: "number | string",
      required: false,
      description: "Accent the leak stage.",
    },
  ],
  demo: PIPE.map((d) => d.value),
  example: {
    title: "Signup funnel",
    code: `import { Funnel } from "${PKG}/funnel";\n\n<Funnel data={stages} title="Signup funnel" />`,
  },
  sampleData: [
    {
      name: "stages",
      code: `const stages = [
  { label: "Visitors", value: 12400 },
  { label: "Signups", value: 5704 },
  { label: "Activated", value: 2730 },
  { label: "Paid", value: 1116 },
];`,
    },
  ],
};

export function Preview() {
  return <Funnel data={PIPE} summary={false} width={130} height={40} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["absolute", "rate"],
      init: "absolute",
    },
    { kind: "toggle", key: "connectors", label: "connectors", init: true },
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["none", "percent", "value"],
      init: "percent",
    },
    { kind: "toggle", key: "highlight", label: "highlight Activated", init: false },
  ],
  render: (s) => (
    <Funnel
      data={PIPE}
      mode={s.mode as "absolute" | "rate"}
      connectors={s.connectors as boolean}
      label={s.label as "none" | "percent" | "value"}
      highlight={(s.highlight as boolean) ? "Activated" : undefined}
      summary={false}
      width={260}
      height={78}
    />
  ),
  code: (s) =>
    [
      "<Funnel",
      "  data={stages}",
      s.mode !== "absolute" && `  mode="${s.mode}"`,
      !(s.connectors as boolean) && "  connectors={false}",
      s.label !== "percent" && `  label="${s.label}"`,
      (s.highlight as boolean) && '  highlight="Activated"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow through the stages — each announces its retained share of the first.",
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<Funnel data={campaign.stages} width={60} height={18} />`,
    node: <Funnel data={PIPE} summary={false} width={60} height={18} />,
  },
  {
    label: "the leak",
    code: `<Funnel data={stages} highlight="Activated" />`,
    node: <Funnel data={PIPE} highlight="Activated" summary={false} width={90} height={26} />,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        This week's signup funnel{" "}
        <span className="mc-inline">
          <Funnel data={PIPE} summary={false} width={64} height={20} />
        </span>{" "}
        converted 12,400 visitors to 1,116 paid — a 9% overall rate.
      </p>
    ),
    code: `<p>\n  This week's signup funnel{" "}\n  <span className="mc-inline">\n    <Funnel data={stages} width={64} height={20} summary={false} />\n  </span>{" "}\n  converted 12,400\n  visitors to 1,116 paid — a 9% overall rate.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <thead>
          <tr className="text-fd-muted-foreground text-xs">
            <th className="pb-1.5 pr-3 text-left font-normal">Campaign</th>
            <th className="pb-1.5 text-left font-normal">Funnel</th>
            <th className="pb-1.5 pl-3 text-right font-normal">Overall</th>
          </tr>
        </thead>
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {(
            [
              ["Organic", PIPE, "9%"],
              ["Referral", REFERRAL, "22%"],
            ] as const
          ).map(([name, stages, rate]) => (
            <tr key={name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{name}</td>
              <td className="py-1.5">
                <Funnel data={stages} summary={false} width={60} height={18} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{rate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <Funnel data={campaign.stages} width={60} height={18} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Signup → paid</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">9%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">12,400 → 1,116</span>
          </div>
        </div>
        <Funnel data={PIPE} highlight="Activated" summary={false} width={90} height={28} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">9%</span>\n  <span className="unit">12,400 → 1,116</span>\n  <Funnel data={stages} highlight="Activated" width={90} height={28} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Organic", PIPE],
            ["Referral", REFERRAL],
          ] as const
        ).map(([name, stages], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <Funnel data={stages} summary={false} width={64} height={16} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Organic <Funnel data={stages} width={64} height={16} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <Funnel
      data={props.data.slice(0, 4).map((v, i) => ({ label: `s${i + 1}`, value: v }))}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<Funnel data={stages} />`;
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
