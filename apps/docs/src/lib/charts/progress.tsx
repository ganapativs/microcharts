import { Progress } from "@microcharts/react/progress";
import { Progress as ProgressInteractive } from "@microcharts/react/progress/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "Progress",
  slug: "progress",
  status: "stable",
  collection: "core",
  tagline: "How far along, exactly — bar plus the percent that is the datum.",
  staticImport: `${PKG}/progress`,
  interactiveImport: `${PKG}/progress/interactive`,
  dataShape: "number of max (optionally segmented)",
  encoding: { channel: "zero-anchored bar length + direct % label", precision: "high" },
  nodeBudget: "≤ 4 continuous · ≤ 3 + segments",
  bestFor: ["KPI cards", "table completion columns", "step counts (segments)"],
  avoidFor: ["icon-size slots (use ProgressRing)", "composition (use SegmentedBar)"],
  props: [
    { name: "value", type: "number", required: true, description: "The progressed amount." },
    { name: "max", type: "number", required: false, description: "Denominator (default 1)." },
    {
      name: "segments",
      type: "number",
      required: false,
      description: "Discrete-chunk track — the chart says step count, not ratio.",
    },
    {
      name: "label",
      type: '"percent" | "value" | "fraction" | "none"',
      required: false,
      description: "The direct label; percent is the default datum.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "down = burn-down wording (summary only; the bar stays factual).",
    },
  ],
  demo: [0.68],
  example: {
    title: "Onboarding",
    code: `import { Progress } from "${PKG}/progress";\n\n<Progress value={0.68} title="Onboarding" />`,
  },
};

export function Preview() {
  return <Progress value={0.68} summary={false} width={120} height={20} />;
}

export const showcase = {
  hint: "completion",
  Node: () => <Progress value={0.68} title="Backlog burn" width={120} height={20} />,
};

export const playground: PlaygroundSpec = {
  // max isn't a separate knob — "value %" already sweeps value/max as one ratio,
  // and a raw max control wouldn't add a distinct visual state; positive only
  // rewords the (visually hidden) accessible summary — the bar itself never
  // changes — so it stays a static example below rather than an inert knob;
  // title/summary/id/className/style/children/format/locale/strings are chrome,
  // not interactive knobs; color is styling-only (no catalog chart exposes raw
  // color as a knob).
  knobs: [
    { kind: "range", key: "pct", label: "value %", min: 0, max: 120, init: 68 },
    { kind: "range", key: "segments", label: "segments", min: 0, max: 10, init: 0 },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["percent", "value", "fraction", "none"],
      init: "percent",
    },
  ],
  render: (s) => (
    <Progress
      value={(s.pct as number) / 100}
      segments={(s.segments as number) >= 2 ? (s.segments as number) : undefined}
      label={s.label as "percent" | "value" | "fraction" | "none"}
      summary={false}
      width={200}
      height={26}
    />
  ),
  code: (s) =>
    [
      "<Progress",
      `  value={${(s.pct as number) / 100}}`,
      (s.segments as number) >= 2 && `  segments={${s.segments}}`,
      s.label !== "percent" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ProgressInteractive
      value={(s.pct as number) / 100}
      segments={(s.segments as number) >= 2 ? (s.segments as number) : undefined}
      label={s.label as "percent" | "value" | "fraction" | "none"}
      summary={false}
      animate={ui.animate}
      width={200}
      height={26}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Progress",
      `  value={${(s.pct as number) / 100}}`,
      (s.segments as number) >= 2 && `  segments={${s.segments}}`,
      s.label !== "percent" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Step the value — the fill glides and whole-percent changes announce politely.",
};

export const recipes: Recipe[] = [
  {
    label: "table column",
    code: `// fixed width per row — fractions stay comparable down the column\n<Progress value={row.done} max={row.total} style={{ width: 96 }} />`,
    node: <Progress value={0.44} summary={false} style={{ width: 96 }} />,
  },
  {
    label: "stepped onboarding",
    code: `<Progress value={3} max={5} segments={5} label="fraction" />`,
    node: (
      <Progress
        value={3}
        max={5}
        segments={5}
        label="fraction"
        summary={false}
        style={{ width: 120 }}
      />
    ),
  },
];

const RELEASES: { name: string; done: number }[] = [
  { name: "API v2", done: 0.82 },
  { name: "Billing sync", done: 0.34 },
  { name: "Docs site", done: 0.97 },
];

const STEPS: { name: string; done: number }[] = [
  { name: "Setup", done: 3 },
  { name: "Invite team", done: 0 },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Database migration to the new cluster is{" "}
        <span className="mc-inline">
          <Progress value={0.68} title="Migration status" summary={false} width={90} height={18} />
        </span>{" "}
        — on track for Friday&rsquo;s cutover.
      </p>
    ),
    code: `<p>\n  Database migration to the new cluster is{" "}\n  <Progress value={0.68} title="Migration status" width={90} height={18} />{" "}\n  — on track for Friday's cutover.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {RELEASES.map((r) => (
            <tr key={r.name} className="border-t border-fd-border/60 first:border-0">
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{r.name}</td>
              <td className="py-1.5">
                <Progress
                  value={r.done}
                  title={`${r.name} readiness`}
                  summary={false}
                  style={{ width: 96 }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <Progress value={release.done} title={\`\${release.name} readiness\`} style={{ width: 96 }} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Q3 budget spent</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">$34.9k</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">of $50k</span>
          </div>
        </div>
        <Progress
          value={34900}
          max={50000}
          title="Budget burn"
          summary={false}
          width={140}
          height={22}
        />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">$34.9k</span>\n  <span className="unit">of $50k</span>\n  <Progress value={34900} max={50000} title="Budget burn" width={140} height={22} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {s.name}
            <Progress
              value={s.done}
              max={5}
              segments={5}
              label="fraction"
              title={`${s.name} steps`}
              summary={false}
              width={54}
              height={14}
            />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Setup <Progress value={3} max={5} segments={5} label="fraction" />\n</button>`,
  },
};

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <Progress value={0.68} summary={false} width={64} height={10} />;
}

export function markCode(): string {
  return `<Progress value={0.68} />`;
}

export function PreviewLive() {
  return <ProgressInteractive value={0.68} summary={false} width={120} height={20} animate />;
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
