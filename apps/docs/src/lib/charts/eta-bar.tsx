import { EtaBar } from "@microcharts/react/eta-bar";
import { EtaBar as EtaBarInteractive } from "@microcharts/react/eta-bar/interactive";
import { InteractiveDemo } from "./eta-bar.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

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
      ui.animate && "  animate",
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

export default {
  entry,
  Preview,
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
