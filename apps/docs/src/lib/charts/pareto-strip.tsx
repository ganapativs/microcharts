import { ParetoStrip } from "@microcharts/react/pareto-strip";
import { ParetoStrip as ParetoStripInteractive } from "@microcharts/react/pareto-strip/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// incident causes by count — a few dominate
export const CAUSES = [
  { label: "Timeouts", value: 38 },
  { label: "OOM", value: 24 },
  { label: "Deploy", value: 15 },
  { label: "Config", value: 9 },
  { label: "Network", value: 7 },
  { label: "Auth", value: 4 },
  { label: "Disk", value: 3 },
  { label: "DNS", value: 3 },
  { label: "Other bug", value: 2 },
];

export const entry: ChartEntry = {
  name: "ParetoStrip",
  slug: "pareto-strip",
  status: "stable",
  collection: "decision",
  tagline: "What should we fix first?",
  staticImport: `${PKG}/pareto-strip`,
  interactiveImport: `${PKG}/pareto-strip/interactive`,
  dataShape: "{ label: string; value: number }[]",
  encoding: {
    channel: "descending bar magnitude + cumulative-share line on a fixed 0–100% scale",
    precision: "high",
  },
  nodeBudget: "1 per bar + 4",
  bestFor: [
    'a "fix these three" read in a KPI card',
    "incident causes or support tags in a tab header",
    "any long-tail composition where a few dominate",
  ],
  avoidFor: ["a plain ranking (MiniBar)", "parts of a single whole (SegmentedBar)"],
  props: [
    {
      name: "data",
      type: "{ label; value }[]",
      required: true,
      description: "Categories with magnitudes — the component sorts descending.",
    },
    {
      name: "threshold",
      type: "number | false",
      required: false,
      description: "Cumulative reference line % (default 80 — a working reference, not a law).",
    },
    {
      name: "max",
      type: "number",
      required: false,
      description: "Categories beyond max roll up into Other (default 8, always last).",
    },
    {
      name: "label",
      type: '"count" | "none"',
      required: false,
      description: "'K of N → cum%' in a right gutter.",
    },
  ],
  demo: CAUSES.map((c) => c.value),
  example: {
    title: "Incident causes",
    code: `import { ParetoStrip } from "${PKG}/pareto-strip";\n\n<ParetoStrip data={causes} unit="causes" metric="incidents" title="Incident causes" />`,
  },
  sampleData: [
    {
      name: "causes",
      code: `// incident causes by count — a few dominate
const causes = [
  { label: "Timeouts", value: 38 },
  { label: "OOM", value: 24 },
  { label: "Deploy", value: 15 },
  { label: "Config", value: 9 },
  { label: "Network", value: 7 },
  { label: "Auth", value: 4 },
  { label: "Disk", value: 3 },
  { label: "DNS", value: 3 },
  { label: "Other bug", value: 2 },
];`,
    },
  ],
};

export function Preview() {
  return <ParetoStrip data={CAUSES} summary={false} width={160} height={22} />;
}

export const showcase = {
  hint: "the vital few",
  Node: () => (
    <ParetoStrip
      data={CAUSES}
      unit="causes"
      metric="incidents"
      title="Incident causes"
      width={160}
      height={22}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "threshold", label: "threshold", min: 50, max: 95, step: 5, init: 80 },
    { kind: "segmented", key: "max", label: "max", options: ["4", "6", "8"], init: "8" },
    { kind: "segmented", key: "label", label: "label", options: ["none", "count"], init: "count" },
  ],
  render: (s) => (
    <ParetoStrip
      data={CAUSES}
      threshold={s.threshold as number}
      max={Number(s.max)}
      unit="causes"
      metric="incidents"
      label={s.label as "count" | "none"}
      summary={false}
      width={280}
      height={28}
    />
  ),
  code: (s) =>
    [
      "<ParetoStrip",
      "  data={causes}",
      s.threshold !== 80 && `  threshold={${s.threshold}}`,
      s.max !== "8" && `  max={${s.max}}`,
      s.label !== "count" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ParetoStripInteractive
      data={CAUSES}
      threshold={s.threshold as number}
      max={Number(s.max)}
      unit="causes"
      metric="incidents"
      label={s.label as "count" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ParetoStrip",
      "  data={causes}",
      s.threshold !== 80 && `  threshold={${s.threshold}}`,
      s.max !== "8" && `  max={${s.max}}`,
      s.label !== "count" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the bars — each announces its share and the running cumulative; T jumps to the 80% crossing.",
};

export const recipes: Recipe[] = [
  {
    label: "roll the tail into Other",
    code: `<ParetoStrip data={causes} max={4} />`,
    node: <ParetoStrip data={CAUSES} max={4} summary={false} width={180} height={22} />,
  },
  {
    label: "no threshold line",
    code: `<ParetoStrip data={causes} threshold={false} />`,
    node: <ParetoStrip data={CAUSES} threshold={false} summary={false} width={180} height={22} />,
  },
];

const CTX_ROWS = [
  {
    name: "deploy",
    meta: "42%",
    data: [
      { label: "deploy", value: 42 },
      { label: "config", value: 18 },
      { label: "network", value: 12 },
      { label: "auth", value: 8 },
      { label: "other", value: 6 },
    ] as typeof CAUSES,
  },
  {
    name: "config",
    meta: "28%",
    data: [
      { label: "config", value: 28 },
      { label: "deploy", value: 22 },
      { label: "network", value: 14 },
      { label: "auth", value: 10 },
      { label: "other", value: 8 },
    ] as typeof CAUSES,
  },
  {
    name: "network",
    meta: "18%",
    data: [
      { label: "network", value: 18 },
      { label: "deploy", value: 16 },
      { label: "config", value: 12 },
      { label: "dns", value: 9 },
      { label: "other", value: 7 },
    ] as typeof CAUSES,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Incident causes{" "}
        <span className="mc-inline">
          <ParetoStrip data={CAUSES} unit="causes" metric="incidents" height={16} summary={false} />
        </span>{" "}
        — top 3 causes account for 80%.
      </p>
    ),
    code: "<p>\n  Incident causes <ParetoStrip data={causes} /> — top 3 causes account for 80%.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <ParetoStrip
                  data={row.data}
                  unit="causes"
                  metric="incidents"
                  height={18}
                  summary={false}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <ParetoStrip data={causes} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Top cause</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">deploy</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">42% of incidents</span>
          </div>
        </div>
        <ParetoStrip
          data={CTX_ROWS[0]!.data}
          unit="causes"
          metric="incidents"
          height={36}
          summary={false}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">deploy</span>\n  <span className="unit">42% of incidents</span>\n  <ParetoStrip data={causes} />\n</div>',
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
            <ParetoStrip
              data={row.data}
              unit="causes"
              metric="incidents"
              height={14}
              summary={false}
            />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  deploy <ParetoStrip data={causes} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = (props.data.length ? props.data : CAUSES.map((c) => c.value))
    .slice(0, 6)
    .map((v, i) => ({ label: `c${i}`, value: 40 - i * 6 + (Math.abs(v) % 4) }));
  return (
    <ParetoStrip
      data={data}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<ParetoStrip data={causes} />`;
}

export function PreviewLive() {
  return <ParetoStripInteractive data={CAUSES} summary={false} width={160} height={22} animate />;
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
