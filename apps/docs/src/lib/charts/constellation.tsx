import { Constellation } from "@microcharts/react/constellation";
import { Constellation as ConstellationInteractive } from "@microcharts/react/constellation/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

const INCIDENTS = [
  { x: 0, y: 40, m: 2 },
  { x: 2, y: 90, m: 7 },
  { x: 5, y: 30, m: 3 },
  { x: 8, y: 65, m: 5 },
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const monthFmt = (x: number) => MONTHS[x] ?? String(x);

export const entry: ChartEntry = {
  name: "Constellation",
  slug: "constellation",
  status: "stable",
  collection: "expressive",
  tagline: "When the rare events happened, and how big.",
  staticImport: `${PKG}/constellation`,
  interactiveImport: `${PKG}/constellation/interactive`,
  dataShape: "{ x: number; y?: number; m?: number }[]",
  encoding: { channel: "position (x = time, y = value) + area-true dot size", precision: "medium" },
  nodeBudget: "n+1",
  bestFor: [
    "sparse incidents or outages on a timeline",
    "milestones with a magnitude (severity, size)",
    "rare events where sequence is the story",
  ],
  avoidFor: [
    "dense event streams (Seismogram / EventTimeline)",
    "a continuous trend (Sparkline)",
    "precise value comparison (dot area is low precision)",
  ],
  props: [
    {
      name: "data",
      type: "{ x: number; y?: number; m?: number }[]",
      required: true,
      description: "Events: x = time, y = value, m = magnitude (area-true size).",
    },
    {
      name: "connect",
      type: "boolean",
      required: false,
      description: "The faint chronology line (default true).",
    },
    {
      name: "label",
      type: '"max" | "none"',
      required: false,
      description: "Numeral at the largest event.",
    },
    {
      name: "xFormat",
      type: "(x: number) => string",
      required: false,
      description: "Formats time for the summary (e.g. a month name).",
    },
    {
      name: "xDomain",
      type: "[number, number]",
      required: false,
      description: "Time (x) extent (default: data extent).",
    },
    {
      name: "rBase",
      type: "number",
      required: false,
      description: "Base dot radius in viewBox units (default 1.6).",
    },
  ],
  demo: [40, 90, 30, 65],
  example: {
    title: "Incidents",
    code: `import { Constellation } from "${PKG}/constellation";\n\n<Constellation\n  data={[\n    { x: 0, y: 40, m: 2 },\n    { x: 2, y: 90, m: 7 },\n    { x: 5, y: 30, m: 3 },\n    { x: 8, y: 65, m: 5 },\n  ]}\n  title="Incidents"\n/>`,
  },
};

export function Preview() {
  return <Constellation data={INCIDENTS} summary={false} width={90} height={26} />;
}

export const showcase = {
  hint: "rare events",
  Node: () => (
    <Constellation data={INCIDENTS} xFormat={monthFmt} title="Incidents" width={110} height={30} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "spike", label: "biggest", min: 40, max: 100, step: 5, init: 90 },
    { kind: "segmented", key: "connect", label: "connect", options: ["on", "off"], init: "on" },
    { kind: "segmented", key: "label", label: "label", options: ["none", "max"], init: "none" },
  ],
  render: (s) => (
    <Constellation
      data={[
        { x: 0, y: 40, m: 2 },
        { x: 2, y: s.spike as number, m: 7 },
        { x: 5, y: 30, m: 3 },
        { x: 8, y: 65, m: 5 },
      ]}
      connect={s.connect === "on"}
      label={s.label as "none" | "max"}
      summary={false}
      width={140}
      height={44}
    />
  ),
  code: (s) =>
    [
      "<Constellation",
      "  data={events}",
      s.connect !== "on" && "  connect={false}",
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ConstellationInteractive
      data={[
        { x: 0, y: 40, m: 2 },
        { x: 2, y: s.spike as number, m: 7 },
        { x: 5, y: 30, m: 3 },
        { x: 8, y: 65, m: 5 },
      ]}
      connect={s.connect === "on"}
      label={s.label as "none" | "max"}
      animate={ui.animate}
      summary={false}
      width={140}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Constellation",
      "  data={events}",
      s.connect !== "on" && "  connect={false}",
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or focus and arrow through the events chronologically — each announces its time, value, and magnitude through a polite live region. The connector is chronology only; toggle it off for a pure scatter.",
};

export const recipes: Recipe[] = [
  {
    label: "month labels in the summary",
    code: `const monthFmt = (x: number) => ["Jan","Feb","Mar","Apr","May","Jun"][x];\n\n<Constellation data={events} xFormat={monthFmt} />`,
    node: (
      <Constellation data={INCIDENTS} xFormat={monthFmt} summary={false} width={100} height={28} />
    ),
  },
  {
    label: "pure scatter (no chronology line)",
    code: `<Constellation data={events} connect={false} />`,
    node: (
      <Constellation data={INCIDENTS} connect={false} summary={false} width={100} height={28} />
    ),
  },
];

const CTX_ROWS = [
  {
    name: "Q1",
    meta: "4 events",
    data: [
      { x: 0, y: 40, m: 2 },
      { x: 2, y: 90, m: 7 },
      { x: 5, y: 30, m: 3 },
      { x: 8, y: 65, m: 5 },
    ] as typeof INCIDENTS,
  },
  {
    name: "Q2",
    meta: "2 events",
    data: [
      { x: 1, y: 55, m: 4 },
      { x: 6, y: 70, m: 6 },
    ] as typeof INCIDENTS,
  },
  {
    name: "Q3",
    meta: "1 event",
    data: [{ x: 3, y: 80, m: 8 }] as typeof INCIDENTS,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Incidents this quarter{" "}
        <span className="mc-inline">
          <Constellation data={INCIDENTS} xFormat={monthFmt} height={16} summary={false} />
        </span>{" "}
        — four events, largest severity in February.
      </p>
    ),
    code: "<p>\n  Incidents this quarter <Constellation data={[{ x: 0, y: 40, m: 2 }, { x: 2, y: 90, m: 7 }]} /> — four events, largest severity in February.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <Constellation data={row.data} xFormat={monthFmt} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <Constellation data={[{ x: 0, y: 40, m: 2 }, { x: 2, y: 90, m: 7 }]} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Incidents</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">4</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">this quarter</span>
          </div>
        </div>
        <Constellation data={CTX_ROWS[0]!.data} xFormat={monthFmt} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">4</span>\n  <span className="unit">this quarter</span>\n  <Constellation data={[{ x: 0, y: 40, m: 2 }, { x: 2, y: 90, m: 7 }]} />\n</div>',
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
            <Constellation data={row.data} xFormat={monthFmt} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Prod <Constellation data={[{ x: 0, y: 40, m: 2 }, { x: 2, y: 90, m: 7 }]} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const pts = props.data.length
    ? props.data.map((v, i) => ({ x: i, y: Math.abs(v), m: (Math.abs(v) % 5) + 1 }))
    : INCIDENTS;
  return (
    <Constellation
      data={pts}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<Constellation data={[{ x: 0, y: 40, m: 2 }, { x: 2, y: 90, m: 7 }]} />`;
}

export function PreviewLive() {
  return (
    <ConstellationInteractive data={INCIDENTS} summary={false} width={90} height={26} animate />
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
