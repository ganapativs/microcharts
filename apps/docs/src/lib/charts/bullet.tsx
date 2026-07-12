import { Bullet } from "@microcharts/react/bullet";
import { Bullet as BulletInteractive } from "@microcharts/react/bullet/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "Bullet",
  slug: "bullet",
  status: "stable",
  collection: "core",
  tagline: "A measure against a target and qualitative bands.",
  staticImport: `${PKG}/bullet`,
  interactiveImport: `${PKG}/bullet/interactive`,
  dataShape: "value + target + bands",
  encoding: { channel: "position (measure length vs a target tick)", precision: "high" },
  nodeBudget: "≤ 6",
  bestFor: ["progress to goal", "SLA / budget vs target", "KPI with thresholds"],
  avoidFor: ["trends over time", "distributions"],
  props: [
    { name: "value", type: "number", required: true, description: "The measured value." },
    {
      name: "target",
      type: "number",
      required: false,
      description: "Target tick to compare against.",
    },
    {
      name: "bands",
      type: "number[]",
      required: false,
      description: "Ascending qualitative thresholds.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Explicit [0, max]; auto-fit otherwise.",
    },
    {
      name: "title",
      type: "string",
      required: false,
      description: "Accessible name; joins the auto summary.",
    },
    {
      name: "summary",
      type: "string | false",
      required: false,
      description: "Override or disable the auto summary.",
    },
  ],
  demo: [72],
  example: {
    title: "Quota attainment",
    code: `import { Bullet } from "${PKG}/bullet";\n\n<Bullet value={72} target={80} bands={[50, 90]} title="Quota" />`,
  },
};

export function Preview() {
  return <Bullet value={72} target={80} bands={[50, 90]} width={190} height={22} summary={false} />;
}

export const showcase = {
  hint: "vs target",
  Node: () => (
    <BulletInteractive
      value={72}
      target={80}
      bands={[50, 90]}
      width={168}
      height={26}
      title="Quota attainment"
    />
  ),
};

// color, format, locale, id, className, style, children: styling/formatting
// escape hatches, not chart-shape knobs — no interactive control (consistent
// with every other chart's playground). title/summary are accessible-name
// overrides fixed to "Playground" here for a stable live-region readout.
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", min: 0, max: 100, init: 72 },
    { kind: "range", key: "target", min: 0, max: 100, init: 80 },
    { kind: "toggle", key: "bands", init: true },
    { kind: "toggle", key: "domain", label: "narrow domain (0–60)", init: false },
  ],
  render: (s) => (
    <Bullet
      value={s.value as number}
      target={s.target as number}
      bands={s.bands ? [50, 90] : undefined}
      domain={s.domain ? [0, 60] : undefined}
      width={300}
      height={28}
      className="w-full max-w-md"
      style={{ height: "auto" }}
      title="Playground"
    />
  ),
  code: (s) =>
    [
      "<Bullet",
      `  value={${s.value}}`,
      `  target={${s.target}}`,
      s.bands && "  bands={[50, 90]}",
      s.domain && "  domain={[0, 60]}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <BulletInteractive
      value={s.value as number}
      target={s.target as number}
      bands={s.bands ? [50, 90] : undefined}
      domain={s.domain ? [0, 60] : undefined}
      animate={ui.animate}
      width={300}
      height={28}
      className="w-full max-w-md"
      title="Playground"
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Bullet",
      `  value={${s.value}}`,
      `  target={${s.target}}`,
      s.bands && "  bands={[50, 90]}",
      s.domain && "  domain={[0, 60]}",
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or focus to hear the value against its target.",
};

export const recipes: Recipe[] = [
  {
    label: "default",
    code: `// data alone → an intrinsic 80×16 box\n<Bullet value={72} target={80} bands={[50, 90]} />`,
    node: <Bullet value={72} target={80} bands={[50, 90]} summary={false} />,
  },
  {
    label: "fixed size",
    code: `// a bullet reads best wide and short\n<Bullet value={72} target={80} bands={[50, 90]} width={240} height={24} />`,
    node: (
      <Bullet value={72} target={80} bands={[50, 90]} width={240} height={24} summary={false} />
    ),
  },
  {
    label: "responsive",
    code: `// fills a table cell or card column, aspect ratio preserved\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <Bullet value={72} target={80} bands={[50, 90]} style={{ width: "100%", height: "auto" }} />\n</div>`,
    fluid: true,
    node: (
      <Bullet
        value={72}
        target={80}
        bands={[50, 90]}
        style={{ width: "100%", height: "auto" }}
        summary={false}
      />
    ),
  },
];

const REPS: { name: string; value: number; target: number }[] = [
  { name: "Priya", value: 92, target: 80 },
  { name: "Marcus", value: 61, target: 80 },
  { name: "Jade", value: 78, target: 80 },
];

const TEAMS: { name: string; value: number; target: number }[] = [
  { name: "North", value: 72, target: 80 },
  { name: "South", value: 54, target: 80 },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Q3 quota attainment sits at{" "}
        <span className="mc-inline">
          <Bullet value={72} target={80} bands={[50, 90]} summary={false} width={90} height={14} />
        </span>{" "}
        — inside the good band, short of target.
      </p>
    ),
    code: `<p>\n  Q3 quota attainment sits at{" "}\n  <Bullet value={72} target={80} bands={[50, 90]} height={14} /> — inside the good band, short of target.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {REPS.map((r) => (
            <tr key={r.name} className="border-t border-fd-border/60 first:border-0">
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{r.name}</td>
              <td className="py-1.5">
                <Bullet
                  value={r.value}
                  target={r.target}
                  bands={[50, 90]}
                  summary={false}
                  width={70}
                  height={14}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {r.value >= r.target ? "hit" : "short"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <Bullet value={92} target={80} bands={[50, 90]} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Storage budget</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">72 GB</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">of an 80 GB volume</span>
          </div>
        </div>
        <Bullet value={72} target={80} bands={[50, 90]} summary={false} width={200} height={20} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">72 GB</span>\n  <span className="unit">of an 80 GB volume</span>\n  <Bullet value={72} target={80} bands={[50, 90]} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {TEAMS.map((t, i) => (
          <span
            key={t.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {t.name}
            <Bullet
              value={t.value}
              target={t.target}
              bands={[50, 90]}
              summary={false}
              width={54}
              height={12}
            />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  North <Bullet value={72} target={80} bands={[50, 90]} />\n</button>`,
  },
};

export function Mark({ width, height }: { data: number[]; width?: number; height?: number }) {
  return (
    <Bullet
      value={72}
      target={80}
      bands={[50, 90]}
      width={width ?? 90}
      height={height ?? 16}
      summary={false}
    />
  );
}

export function markCode(width?: number, height?: number): string {
  const size = width && height ? ` width={${width}} height={${height}}` : "";
  return `<Bullet value={72} target={80} bands={[50, 90]}${size} />`;
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
