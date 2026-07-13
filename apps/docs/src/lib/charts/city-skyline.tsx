import { CitySkyline } from "@microcharts/react/city-skyline";
import { CitySkyline as CitySkylineInteractive } from "@microcharts/react/city-skyline/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
type Team = { label: string; value: number; lit?: number };
const TEAMS: Team[] = [
  { label: "Platform", value: 46, lit: 0.7 },
  { label: "Core", value: 32, lit: 0.5 },
  { label: "Web", value: 28, lit: 0.9 },
  { label: "API", value: 40, lit: 0.3 },
  { label: "Data", value: 18, lit: 0.6 },
];

export const entry: ChartEntry = {
  name: "CitySkyline",
  slug: "city-skyline",
  status: "stable",
  collection: "expressive",
  tagline: "How groups compare on size, and how activated each is.",
  staticImport: `${PKG}/city-skyline`,
  interactiveImport: `${PKG}/city-skyline/interactive`,
  dataShape: "{ label: string; value: number; lit?: number }[]",
  encoding: {
    channel: "building height (primary) + lit-window fraction (secondary)",
    precision: "high height / low lit",
  },
  nodeBudget: "2 per building + 1 (n ≤ 8)",
  bestFor: [
    "team or region size plus an activation read",
    "an org KPI where two variables are the story",
    "a per-BU comparison with utilization",
  ],
  avoidFor: ["a single variable (MiniBar)", "precise activation reads", "more than ~8 groups"],
  props: [
    {
      name: "data",
      type: "{ label, value, lit? }[]",
      required: true,
      description: "value = height; lit = 0–1 window fraction.",
    },
    {
      name: "labels",
      type: "boolean",
      required: false,
      description: "Category labels under the buildings.",
    },
    {
      name: "ground",
      type: "boolean",
      required: false,
      description: "The baseline hairline (default true).",
    },
    {
      name: "label",
      type: '"none" | "value"',
      required: false,
      description: "Numeral above each building.",
    },
  ],
  demo: [46, 32, 28, 40, 18],
  example: {
    title: "Team sizes",
    code: `import { CitySkyline } from "${PKG}/city-skyline";\n\n<CitySkyline data={teams} unit="teams" title="Team sizes" />`,
  },
  sampleData: [
    {
      name: "teams",
      code: `const teams = [
  { label: "Platform", value: 46, lit: 0.7 },
  { label: "Core", value: 32, lit: 0.5 },
  { label: "Web", value: 28, lit: 0.9 },
  { label: "API", value: 40, lit: 0.3 },
  { label: "Data", value: 18, lit: 0.6 },
];`,
    },
  ],
};

export function Preview() {
  return <CitySkyline data={TEAMS} summary={false} height={26} />;
}

export const showcase = {
  hint: "size + activation",
  Node: () => <CitySkyline data={TEAMS} labels unit="teams" title="Team sizes" height={32} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "labels", label: "labels", init: false },
    { kind: "toggle", key: "value", label: "values", init: false },
    { kind: "toggle", key: "ground", label: "ground", init: true },
  ],
  render: (s) => (
    <CitySkyline
      data={TEAMS}
      labels={s.labels as boolean}
      label={s.value ? "value" : "none"}
      ground={s.ground as boolean}
      unit="teams"
      summary={false}
      bw={16}
      gap={6}
      height={s.labels || s.value ? 52 : 44}
    />
  ),
  code: (s) =>
    [
      "<CitySkyline",
      "  data={teams}",
      s.labels && "  labels",
      s.value && '  label="value"',
      s.ground === false && "  ground={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <CitySkylineInteractive
      data={TEAMS}
      labels={s.labels as boolean}
      label={s.value ? "value" : "none"}
      ground={s.ground as boolean}
      unit="teams"
      animate={ui.animate}
      summary={false}
      bw={16}
      gap={6}
      height={s.labels || s.value ? 52 : 44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CitySkyline",
      "  data={teams}",
      s.labels && "  labels",
      s.value && '  label="value"',
      s.ground === false && "  ground={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow ←/→ across the buildings — each announces its size and its lit fraction. Height is the precise read; the lit windows are impressionistic (mostly lit / half lit / dark).",
};

export const recipes: Recipe[] = [
  {
    label: "omit lit for a plain bar row",
    code: `<CitySkyline data={teams.map(({ label, value }) => ({ label, value }))} />`,
    node: (
      <CitySkyline
        data={TEAMS.map(({ label, value }) => ({ label, value }))}
        summary={false}
        height={28}
      />
    ),
  },
  {
    label: "labelled, the two-variable read",
    code: `<CitySkyline data={teams} labels />`,
    node: <CitySkyline data={TEAMS} labels summary={false} height={34} bw={14} gap={5} />,
  },
];

const CTX_ROWS = [
  {
    name: "Platform",
    meta: "46",
    data: [
      { label: "Platform", value: 46, lit: 0.7 },
      { label: "Core", value: 28, lit: 0.5 },
      { label: "Web", value: 22, lit: 0.4 },
    ] as Team[],
  },
  {
    name: "Core",
    meta: "32",
    data: [
      { label: "Platform", value: 38, lit: 0.6 },
      { label: "Core", value: 32, lit: 0.8 },
      { label: "Web", value: 20, lit: 0.5 },
    ] as Team[],
  },
  {
    name: "Web",
    meta: "28",
    data: [
      { label: "Platform", value: 36, lit: 0.5 },
      { label: "Core", value: 24, lit: 0.6 },
      { label: "Web", value: 28, lit: 0.9 },
    ] as Team[],
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Team sizes across eng{" "}
        <span className="mc-inline">
          <CitySkyline data={TEAMS} labels unit="teams" height={16} summary={false} />
        </span>{" "}
        — Platform is largest at 46, 70% activated.
      </p>
    ),
    code: "<p>\n  Team sizes across eng <CitySkyline data={teams} /> — Platform is largest at 46, 70% activated.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <CitySkyline data={row.data} labels unit="teams" height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <CitySkyline data={teams} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Platform</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">46</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">heads · 70% lit</span>
          </div>
        </div>
        <CitySkyline data={CTX_ROWS[0]!.data} labels unit="teams" height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">46</span>\n  <span className="unit">heads · 70% lit</span>\n  <CitySkyline data={teams} />\n</div>',
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
            <CitySkyline data={row.data} labels unit="teams" height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Platform <CitySkyline data={teams} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = (props.data.length ? props.data.slice(0, 5) : [46, 32, 28, 40, 18]).map((v, i) => ({
    label: `#${i}`,
    value: Math.abs(v),
    lit: ((i * 3) % 10) / 10,
  }));
  return <CitySkyline data={data} summary={false} height={props.height ?? 22} bw={7} gap={3} />;
}

export function markCode(): string {
  return `<CitySkyline data={teams} />`;
}

export function PreviewLive() {
  return <CitySkylineInteractive data={TEAMS} summary={false} height={26} animate />;
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
