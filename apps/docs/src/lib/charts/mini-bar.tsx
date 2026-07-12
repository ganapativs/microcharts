import { MiniBar } from "@microcharts/react/mini-bar";
import { MiniBar as MiniBarInteractive } from "@microcharts/react/mini-bar/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const MIX = [
  { label: "East", value: 940 },
  { label: "West", value: 410 },
  { label: "South", value: 620 },
  { label: "North", value: 120 },
];
const SIGNED = [
  { label: "Mon", value: 4 },
  { label: "Tue", value: -2 },
  { label: "Wed", value: 6 },
  { label: "Thu", value: -1 },
];
const CHANNELS = [
  { label: "Email", value: 380 },
  { label: "Chat", value: 260 },
  { label: "Phone", value: 90 },
];
const REPS = [
  {
    name: "Ortiz",
    mix: [
      { label: "East", value: 520 },
      { label: "West", value: 180 },
      { label: "South", value: 240 },
      { label: "North", value: 60 },
    ],
  },
  {
    name: "Haines",
    mix: [
      { label: "East", value: 200 },
      { label: "West", value: 350 },
      { label: "South", value: 150 },
      { label: "North", value: 300 },
    ],
  },
  {
    name: "Kwan",
    mix: [
      { label: "East", value: 100 },
      { label: "West", value: 80 },
      { label: "South", value: 740 },
      { label: "North", value: 80 },
    ],
  },
];

export const entry: ChartEntry = {
  name: "MiniBar",
  slug: "mini-bar",
  status: "stable",
  collection: "core",
  tagline: "Which category is biggest, and by roughly how much.",
  staticImport: `${PKG}/mini-bar`,
  interactiveImport: `${PKG}/mini-bar/interactive`,
  dataShape: "{ label, value }[]",
  encoding: { channel: "bar length, zero-anchored", precision: "high" },
  nodeBudget: "1 per bar (≤ 8 documented)",
  bestFor: ["per-row category mix in tables", "small comparisons in cards"],
  avoidFor: ["> 8 categories (full bar chart)", "time series (SparkBar)"],
  props: [
    {
      name: "data",
      type: "{ label; value }[]",
      required: true,
      description: "Categories in meaningful order.",
    },
    {
      name: "sort",
      type: '"none" | "desc" | "asc"',
      required: false,
      description: "Ranking read vs positional read — data-facing, not styling.",
    },
    {
      name: "highlight",
      type: "number | string",
      required: false,
      description: "Index or label to emphasize.",
    },
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      required: false,
      description: "Rows for wider, shorter cells.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Engages pos/neg tokens on signed data.",
    },
  ],
  demo: MIX.map((d) => d.value),
  example: {
    title: "Regional mix",
    code: `import { MiniBar } from "${PKG}/mini-bar";\n\n<MiniBar data={regions} title="Sales by region" />`,
  },
  sampleData: [
    {
      name: "regions",
      code: `const regions = [
  { label: "East", value: 940 },
  { label: "West", value: 410 },
  { label: "South", value: 620 },
  { label: "North", value: 120 },
];`,
    },
    {
      name: "signed",
      code: `const signed = [
  { label: "Mon", value: 4 },
  { label: "Tue", value: -2 },
  { label: "Wed", value: 6 },
  { label: "Thu", value: -1 },
];`,
    },
  ],
};

export function Preview() {
  return <MiniBar data={MIX} summary={false} width={100} height={32} />;
}

export const showcase = {
  hint: "categories",
  Node: () => (
    <MiniBar data={MIX} highlight="East" title="Sales by region" width={100} height={32} />
  ),
};

// domain/color/format/locale/strings/id/className/style/children: styling/
// formatting escape hatches, not chart-shape knobs — no interactive control

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "sort",
      label: "sort",
      options: ["none", "desc", "asc"],
      init: "none",
    },
    { kind: "toggle", key: "highlight", label: "highlight", init: false },
    {
      kind: "segmented",
      key: "orientation",
      label: "orientation",
      options: ["vertical", "horizontal"],
      init: "vertical",
    },
    { kind: "toggle", key: "positive", label: "signed + valence", init: false },
  ],
  render: (s) => {
    const signed = s.positive as boolean;
    const rows = signed ? SIGNED : MIX;
    return (
      <MiniBar
        data={rows}
        sort={s.sort as "none" | "desc" | "asc"}
        highlight={(s.highlight as boolean) ? rows[0]!.label : undefined}
        orientation={s.orientation as "horizontal" | "vertical"}
        positive={signed ? "up" : undefined}
        summary={false}
        width={160}
        height={s.orientation === "horizontal" ? 96 : 52}
      />
    );
  },
  code: (s) => {
    const signed = s.positive as boolean;
    const varName = signed ? "signed" : "regions";
    const target = signed ? "Mon" : "East";
    return [
      "<MiniBar",
      `  data={${varName}}`,
      s.sort !== "none" && `  sort="${s.sort}"`,
      (s.highlight as boolean) && `  highlight="${target}"`,
      s.orientation === "horizontal" && '  orientation="horizontal"',
      signed && '  positive="up"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n");
  },
  renderInteractive: (s, _data, ui) => {
    const signed = s.positive as boolean;
    const rows = signed ? SIGNED : MIX;
    return (
      <MiniBarInteractive
        data={rows}
        sort={s.sort as "none" | "desc" | "asc"}
        highlight={(s.highlight as boolean) ? rows[0]!.label : undefined}
        orientation={s.orientation as "horizontal" | "vertical"}
        positive={signed ? "up" : undefined}
        animate={ui.animate}
        summary={false}
        width={160}
        height={s.orientation === "horizontal" ? 96 : 52}
      />
    );
  },
  codeInteractive: (s, _data, ui) => {
    const signed = s.positive as boolean;
    const varName = signed ? "signed" : "regions";
    const target = signed ? "Mon" : "East";
    return [
      "<MiniBar",
      `  data={${varName}}`,
      s.sort !== "none" && `  sort="${s.sort}"`,
      (s.highlight as boolean) && `  highlight="${target}"`,
      s.orientation === "horizontal" && '  orientation="horizontal"',
      signed && '  positive="up"',
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n");
  },
  interactiveHint:
    "Hover a bar or rove with arrow keys — each announces its label, value, and rank.",
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<MiniBar data={row.mix} width={50} height={16} />`,
    node: <MiniBar data={MIX} summary={false} width={50} height={16} />,
  },
  {
    label: "signed with polarity",
    code: `<MiniBar data={signed} positive="up" />`,
    node: (
      <MiniBar
        data={[
          { label: "Mon", value: 4 },
          { label: "Tue", value: -2 },
          { label: "Wed", value: 6 },
          { label: "Thu", value: -1 },
        ]}
        positive="up"
        summary={false}
        width={80}
        height={28}
      />
    ),
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Q3 revenue splits four ways{" "}
        <span className="mc-inline">
          <MiniBar data={MIX} summary={false} width={70} height={16} />
        </span>{" "}
        — East alone outsells North more than seven to one.
      </p>
    ),
    code: `<p>\n  Q3 revenue splits four ways{" "}\n  <MiniBar data={regions} width={70} height={16} /> — East alone outsells North more than seven to one.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {REPS.map((r) => {
            const top = r.mix.reduce((a, b) => (b.value > a.value ? b : a));
            return (
              <tr key={r.name} className="border-t border-fd-border/60 first:border-0">
                <td className="py-1.5 pr-3 text-fd-muted-foreground">{r.name}</td>
                <td className="py-1.5">
                  <MiniBar data={r.mix} summary={false} width={70} height={18} />
                </td>
                <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{top.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    ),
    code: `<td>\n  <MiniBar data={rep.mix} width={70} height={18} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Largest region</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">East</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">45% of Q3 revenue</span>
          </div>
        </div>
        <MiniBar data={MIX} highlight="East" summary={false} width={140} height={40} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">East</span>\n  <span className="unit">45% of Q3 revenue</span>\n  <MiniBar data={regions} highlight="East" width={140} height={40} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Region", MIX],
            ["Channel", CHANNELS],
          ] as const
        ).map(([name, rows], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <MiniBar data={rows} summary={false} width={50} height={14} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Region <MiniBar data={regions} width={50} height={14} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <MiniBar
      data={props.data.slice(0, 6).map((v, i) => ({ label: `c${i + 1}`, value: v }))}
      summary={false}
      width={props.width ?? 50}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<MiniBar data={mix} />`;
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
