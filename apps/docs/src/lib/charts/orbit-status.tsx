import { OrbitStatus } from "@microcharts/react/orbit-status";
import { OrbitStatus as OrbitStatusInteractive } from "@microcharts/react/orbit-status/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const LD: [number, number] = [0, 500];
const RD: [number, number] = [0, 20];

export const entry: ChartEntry = {
  name: "OrbitStatus",
  slug: "orbit-status",
  status: "stable",
  collection: "expressive",
  tagline: "How slow and how busy is this dependency right now?",
  staticImport: `${PKG}/orbit-status`,
  interactiveImport: `${PKG}/orbit-status/interactive`,
  // The satellite's orbital speed IS the encoding (busier services spin
  // faster) — a mount entrance would fight that live motion, so this chart
  // has no `animate` prop at all.
  animates: false,
  dataShape: "{ latency: number; rate: number }",
  encoding: { channel: "orbit radius = latency, dash density / speed = rate", precision: "low" },
  nodeBudget: "3",
  bestFor: [
    "a live dependency health dot in a service table",
    "latency + rate together in one small mark",
    "an infra status glance",
  ],
  avoidFor: [
    "exact latency (Sparkline)",
    "exact rate (Delta / MiniBar)",
    "a trend over time (Sparkline)",
  ],
  props: [
    {
      name: "latency",
      type: "number",
      required: true,
      description: "Orbit radius (weak — pass a domain).",
    },
    {
      name: "rate",
      type: "number",
      required: true,
      description: "Dash density / satellite speed.",
    },
    {
      name: "latencyDomain",
      type: "[number, number]",
      required: false,
      description: "Latency extent (insist on it — a lone radius is meaningless).",
    },
    {
      name: "alert",
      type: "number",
      required: false,
      description: "Latency threshold: at/above it the satellite doubles + the summary flags it.",
    },
  ],
  demo: [240, 12],
  example: {
    title: "Payments API",
    code: `import { OrbitStatus } from "${PKG}/orbit-status";\n\n<OrbitStatus\n  latency={240}\n  rate={12}\n  latencyDomain={[0, 500]}\n  rateDomain={[0, 20]}\n  title="Payments API"\n/>`,
  },
};

export function Preview() {
  return (
    <OrbitStatus
      latency={240}
      rate={12}
      latencyDomain={LD}
      rateDomain={RD}
      summary={false}
      size={24}
    />
  );
}

export const showcase = {
  hint: "slow? busy?",
  Node: () => (
    <OrbitStatus
      latency={240}
      rate={12}
      latencyDomain={LD}
      rateDomain={RD}
      title="Payments API"
      size={32}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "latency", label: "latency (ms)", min: 0, max: 500, step: 10, init: 240 },
    { kind: "range", key: "rate", label: "rate (calls/s)", min: 0, max: 20, step: 1, init: 12 },
    { kind: "segmented", key: "alert", label: "alert 300ms", options: ["off", "on"], init: "off" },
  ],
  render: (s) => (
    <OrbitStatus
      latency={s.latency as number}
      rate={s.rate as number}
      latencyDomain={LD}
      rateDomain={RD}
      alert={s.alert === "on" ? 300 : undefined}
      summary={false}
      size={120}
    />
  ),
  code: (s) =>
    [
      "<OrbitStatus",
      `  latency={${s.latency}}`,
      `  rate={${s.rate}}`,
      "  latencyDomain={[0, 500]}",
      "  rateDomain={[0, 20]}",
      s.alert === "on" && "  alert={300}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  // No `animate` prop exists on this chart (see entry.animates) — the
  // satellite's own orbital speed IS the encoding.
  renderInteractive: (s) => (
    <OrbitStatusInteractive
      latency={s.latency as number}
      rate={s.rate as number}
      latencyDomain={LD}
      rateDomain={RD}
      alert={s.alert === "on" ? 300 : undefined}
      summary={false}
      size={120}
    />
  ),
  codeInteractive: (s) =>
    [
      "<OrbitStatus",
      `  latency={${s.latency}}`,
      `  rate={${s.rate}}`,
      "  latencyDomain={[0, 500]}",
      "  rateDomain={[0, 20]}",
      s.alert === "on" && "  alert={300}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "A live dependency table. Each orbit's radius is its latency, its dash density is its call rate, and the satellite's speed mirrors that rate — busier services spin faster. Cross 300ms and the satellite doubles and the row flags. Reduced-motion readers read the same dash density without the spin.",
  animates: false,
};

export const recipes: Recipe[] = [
  {
    label: "an SLO alert threshold",
    code: `<OrbitStatus latency={340} rate={8} alert={300} latencyDomain={[0, 500]} rateDomain={[0, 20]} />`,
    node: (
      <OrbitStatus
        latency={340}
        rate={8}
        alert={300}
        latencyDomain={LD}
        rateDomain={RD}
        summary={false}
        size={32}
      />
    ),
  },
  {
    label: "idle service — a solid, dash-free orbit",
    code: `<OrbitStatus latency={100} rate={0} latencyDomain={[0, 500]} rateDomain={[0, 20]} />`,
    node: (
      <OrbitStatus
        latency={100}
        rate={0}
        latencyDomain={LD}
        rateDomain={RD}
        summary={false}
        size={32}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const latency = props.data.length ? Math.abs(props.data[0]!) % 500 : 240;
  const rate = props.data.length > 1 ? Math.abs(props.data[1]!) % 20 : 12;
  return (
    <OrbitStatus
      latency={latency}
      rate={rate}
      latencyDomain={LD}
      rateDomain={RD}
      summary={false}
      size={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<OrbitStatus latency={240} rate={12} latencyDomain={[0, 500]} rateDomain={[0, 20]} />`;
}

export function PreviewLive() {
  return (
    <OrbitStatusInteractive
      latency={240}
      rate={12}
      latencyDomain={LD}
      rateDomain={RD}
      summary={false}
      size={24}
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
  Mark,
  markCode,
} satisfies ChartModule;
