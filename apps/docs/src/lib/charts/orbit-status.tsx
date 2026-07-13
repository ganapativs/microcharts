import { OrbitStatus } from "@microcharts/react/orbit-status";
import { OrbitStatus as OrbitStatusInteractive } from "@microcharts/react/orbit-status/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

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

const CTX_ROWS = [
  { name: "payments", meta: "240ms", data: [173, 182, 192, 202, 211, 221, 230, 240] },
  { name: "auth", meta: "48ms", data: [35, 36, 38, 40, 42, 44, 46, 48] },
  { name: "search", meta: "890ms", data: [641, 676, 712, 748, 783, 819, 854, 890] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Payments API health{" "}
        <span className="mc-inline">
          <OrbitStatus
            latency={240}
            rate={12}
            latencyDomain={LD}
            rateDomain={RD}
            size={20}
            summary={false}
          />
        </span>{" "}
        — 240 ms latency, 12 req/s, orbit stable.
      </p>
    ),
    code: "<p>\n  Payments API health <OrbitStatus latency={240} rate={12} latencyDomain={[0, 500]} rateDomain={[0, 20]} /> — 240 ms latency, 12 req/s, orbit stable.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <OrbitStatus
                  latency={240}
                  rate={12}
                  latencyDomain={LD}
                  rateDomain={RD}
                  size={22}
                  summary={false}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <OrbitStatus latency={240} rate={12} latencyDomain={[0, 500]} rateDomain={[0, 20]} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Payments</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">240ms</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">· 12 rps</span>
          </div>
        </div>
        <OrbitStatus
          latency={240}
          rate={12}
          latencyDomain={LD}
          rateDomain={RD}
          size={48}
          summary={false}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">240ms</span>\n  <span className="unit">· 12 rps</span>\n  <OrbitStatus latency={240} rate={12} latencyDomain={[0, 500]} rateDomain={[0, 20]} />\n</div>',
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
            <OrbitStatus
              latency={240}
              rate={12}
              latencyDomain={LD}
              rateDomain={RD}
              size={18}
              summary={false}
            />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  payments <OrbitStatus latency={240} rate={12} latencyDomain={[0, 500]} rateDomain={[0, 20]} />\n</button>',
  },
};

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
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
