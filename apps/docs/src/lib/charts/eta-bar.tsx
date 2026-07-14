import { EtaBar } from "@microcharts/react/eta-bar";
import { EtaBar as EtaBarInteractive } from "@microcharts/react/eta-bar/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const min = (t: number) => `${Math.round(t)} min`;

export const entry: ChartEntry = {
  name: "EtaBar",
  slug: "eta-bar",
  status: "stable",
  collection: "frontier",
  tagline: "How long this will actually take, given how it has actually been going.",
  staticImport: `${PKG}/eta-bar`,
  interactiveImport: `${PKG}/eta-bar/interactive`,
  dataShape: "{ progress, elapsed, rate? }",
  encoding: { channel: "time axis — elapsed vs predicted-remaining", precision: "high / medium" },
  nodeBudget: "≤ 4",
  bestFor: ["download / export progress", "job-queue ETA"],
  avoidFor: ["fraction-only progress (Progress)", "unbounded counters (Delta)"],
  props: [
    { name: "progress", type: "number", required: true, description: "Completed fraction 0–1." },
    { name: "elapsed", type: "number", required: true, description: "Time spent, any unit." },
    {
      name: "rate",
      type: "number",
      required: false,
      description: "Progress per time unit — pass a recent-window rate.",
    },
    {
      name: "label",
      type: '"eta" | "percent" | "none"',
      required: false,
      description: "The remaining-time read is the product.",
    },
    {
      name: "formatEta",
      type: "(t: number) => string",
      required: false,
      description: 'Unit-bearing ETA label ("2 min") — the caller owns units.',
    },
    {
      name: "announceEvery",
      type: "number",
      required: false,
      interactive: true,
      description:
        "Minimum ms between live-region announcements as the ETA streams (default 10000).",
    },
  ],
  demo: [64],
  example: {
    title: "Export progress",
    code: `import { EtaBar } from "${PKG}/eta-bar";\n\n<EtaBar progress={0.64} elapsed={3.6} rate={0.18} formatEta={(t) => \`\${Math.round(t)} min\`} title="Export" />`,
  },
};

export function Preview() {
  return (
    <EtaBar
      progress={0.64}
      elapsed={3.6}
      rate={0.18}
      formatEta={min}
      summary={false}
      width={130}
      height={14}
    />
  );
}

export const showcase = {
  hint: "forecast",
  Node: () => (
    <EtaBar
      progress={0.64}
      elapsed={3.6}
      rate={0.18}
      formatEta={min}
      title="Export"
      width={130}
      height={14}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "progress", label: "progress %", min: 0, max: 100, init: 64 },
    { kind: "range", key: "rate", label: "rate ×100", min: 1, max: 40, init: 18 },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["eta", "percent", "none"],
      init: "eta",
    },
  ],
  render: (s) => (
    <EtaBar
      progress={(s.progress as number) / 100}
      elapsed={3.6}
      rate={(s.rate as number) / 100}
      label={s.label as "eta" | "percent" | "none"}
      formatEta={min}
      summary={false}
      width={300}
      height={16}
    />
  ),
  code: (s) =>
    [
      "<EtaBar",
      `  progress={${((s.progress as number) / 100).toFixed(2)}}`,
      "  elapsed={3.6}",
      `  rate={${((s.rate as number) / 100).toFixed(2)}}`,
      s.label !== "eta" && `  label="${s.label}"`,
      "  formatEta={(t) => `${Math.round(t)} min`}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <EtaBarInteractive
      progress={(s.progress as number) / 100}
      elapsed={3.6}
      rate={(s.rate as number) / 100}
      label={s.label as "eta" | "percent" | "none"}
      formatEta={min}
      animate={ui.animate}
      summary={false}
      width={300}
      height={16}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<EtaBar",
      `  progress={${((s.progress as number) / 100).toFixed(2)}}`,
      "  elapsed={3.6}",
      `  rate={${((s.rate as number) / 100).toFixed(2)}}`,
      s.label !== "eta" && `  label="${s.label}"`,
      "  formatEta={(t) => `${Math.round(t)} min`}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "A live transfer — when the rate dips, the remainder honestly grows. Focus reads the forecast.",
};

export const recipes: Recipe[] = [
  {
    label: "table cell",
    code: `<EtaBar progress={0.64} elapsed={128} rate={0.5} width={60} height={8} />`,
    node: <EtaBar progress={0.64} elapsed={128} rate={0.5} summary={false} width={60} height={8} />,
  },
  {
    label: "stalled",
    code: `<EtaBar progress={0.3} elapsed={40} rate={0} />`,
    node: <EtaBar progress={0.3} elapsed={40} rate={0} summary={false} width={160} height={14} />,
  },
];

const CTX_ROWS = [
  { name: "report.pdf", meta: "64%", data: [0.52, 0.54, 0.56, 0.57, 0.59, 0.61, 0.62, 0.64] },
  { name: "data.csv", meta: "91%", data: [0.75, 0.77, 0.79, 0.82, 0.84, 0.86, 0.89, 0.91] },
  { name: "archive.zip", meta: "12%", data: [0.1, 0.1, 0.1, 0.11, 0.11, 0.11, 0.12, 0.12] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Export progress{" "}
        <span className="mc-inline">
          <EtaBar
            progress={0.64}
            elapsed={3.6}
            rate={0.18}
            formatEta={min}
            height={16}
            summary={false}
          />
        </span>{" "}
        — 64% done, ~2 min remaining.
      </p>
    ),
    code: "<p>\n  Export progress <EtaBar progress={0.64} elapsed={3.6} rate={0.18} /> — 64% done, ~2 min remaining.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <EtaBar
                  progress={0.64}
                  elapsed={3.6}
                  rate={0.18}
                  formatEta={min}
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
    code: "<td>\n  <EtaBar progress={0.64} elapsed={3.6} rate={0.18} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Export</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">64%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">~2 min left</span>
          </div>
        </div>
        <EtaBar
          progress={0.64}
          elapsed={3.6}
          rate={0.18}
          formatEta={min}
          height={36}
          summary={false}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">64%</span>\n  <span className="unit">~2 min left</span>\n  <EtaBar progress={0.64} elapsed={3.6} rate={0.18} />\n</div>',
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
            <EtaBar
              progress={0.64}
              elapsed={3.6}
              rate={0.18}
              formatEta={min}
              height={14}
              summary={false}
            />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  report <EtaBar progress={0.64} elapsed={3.6} rate={0.18} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const p = Math.min(0.99, Math.max(0.05, (Math.abs(props.data[0] ?? 64) % 100) / 100));
  return (
    <EtaBar
      progress={p}
      elapsed={3.6}
      rate={0.18}
      formatEta={min}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 8}
    />
  );
}

export function markCode(): string {
  return `<EtaBar progress={0.64} elapsed={3.6} rate={0.18} />`;
}

export function PreviewLive() {
  return (
    <EtaBarInteractive
      progress={0.64}
      elapsed={3.6}
      rate={0.18}
      formatEta={min}
      summary={false}
      width={130}
      height={14}
      animate
    />
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
