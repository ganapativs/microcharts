import { PhaseTrace } from "@microcharts/react/phase-trace";
import { PhaseTrace as PhaseTraceInteractive } from "@microcharts/react/phase-trace/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a coupled CPU×latency trajectory with a lag loop
export const TRAJ = Array.from({ length: 40 }, (_, i) => {
  const t = (i / 40) * Math.PI * 2;
  return { x: 55 + Math.cos(t) * 22, y: 110 + Math.sin(t - 0.9) * 40 };
});

export const entry: ChartEntry = {
  name: "PhaseTrace",
  slug: "phase-trace",
  status: "stable",
  collection: "frontier",
  tagline: "How two coupled signals move together: loops, regimes, and where the system is now.",
  staticImport: `${PKG}/phase-trace`,
  interactiveImport: `${PKG}/phase-trace/interactive`,
  dataShape: "{ x, y }[] (two synchronized signals as one trajectory)",
  encoding: { channel: "x×y trajectory; path order = time", precision: "medium" },
  nodeBudget: "≤ 5",
  bestFor: ["coupled-signal phase portraits", "CPU×latency, inflation×unemployment"],
  avoidFor: ["exact values (DualSparkline)", "a single series (Sparkline)"],
  props: [
    {
      name: "data",
      type: "{ x, y }[]",
      required: true,
      description: "Two synchronized signals, time-ordered.",
    },
    {
      name: "xLabel / yLabel",
      type: "string",
      required: false,
      description: "Axis names — the summary reads them.",
    },
    {
      name: "xDomain",
      type: "[number, number]",
      required: false,
      description: "Fix the x-axis range (default: the data's x-extent).",
    },
    {
      name: "yDomain",
      type: "[number, number]",
      required: false,
      description: "Fix the y-axis range (default: the data's y-extent).",
    },
    {
      name: "tail",
      type: "number",
      required: false,
      description: "Fraction of points drawn in accent (recent motion).",
    },
    {
      name: "grid",
      type: "boolean",
      required: false,
      description: "Quadrant hairlines for regime reads.",
    },
    {
      name: "startDot",
      type: "boolean",
      required: false,
      description: "Anchor the path's origin for full-journey reads (default false).",
    },
  ],
  demo: [62, 130],
  example: {
    title: "CPU × latency",
    code: `import { PhaseTrace } from "${PKG}/phase-trace";\n\n<PhaseTrace data={trajectory} xLabel="CPU" yLabel="Latency" title="Phase portrait" />`,
  },
  sampleData: [
    {
      name: "trajectory",
      code: `// a coupled CPU×latency trajectory with a lag loop
const trajectory = Array.from({ length: 40 }, (_, i) => {
  const t = (i / 40) * Math.PI * 2;
  return { x: 55 + Math.cos(t) * 22, y: 110 + Math.sin(t - 0.9) * 40 };
});`,
    },
  ],
};

export function Preview() {
  return (
    <PhaseTrace data={TRAJ} xLabel="CPU" yLabel="Latency" summary={false} width={44} height={40} />
  );
}

export const showcase = {
  hint: "trajectory",
  Node: () => (
    <PhaseTrace
      data={TRAJ}
      xLabel="CPU"
      yLabel="Latency"
      grid
      title="Phase portrait"
      width={44}
      height={40}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "tail", label: "tail %", min: 10, max: 60, step: 5, init: 25 },
    { kind: "toggle", key: "grid", label: "quadrant grid", init: false },
    { kind: "toggle", key: "startDot", label: "start dot", init: false },
  ],
  render: (s) => (
    <PhaseTrace
      data={TRAJ}
      xLabel="CPU"
      yLabel="Latency"
      tail={(s.tail as number) / 100}
      grid={s.grid as boolean}
      startDot={s.startDot as boolean}
      summary={false}
      width={110}
      height={100}
    />
  ),
  code: (s) =>
    [
      "<PhaseTrace",
      "  data={trajectory}",
      '  xLabel="CPU"',
      '  yLabel="Latency"',
      s.tail !== 25 && `  tail={${((s.tail as number) / 100).toFixed(2)}}`,
      s.grid === true && "  grid",
      s.startDot === true && "  startDot",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <PhaseTraceInteractive
      data={TRAJ}
      xLabel="CPU"
      yLabel="Latency"
      tail={(s.tail as number) / 100}
      grid={s.grid as boolean}
      startDot={s.startDot as boolean}
      animate={ui.animate}
      summary={false}
      width={110}
      height={100}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<PhaseTrace",
      "  data={trajectory}",
      '  xLabel="CPU"',
      '  yLabel="Latency"',
      s.tail !== 25 && `  tail={${((s.tail as number) / 100).toFixed(2)}}`,
      s.grid === true && "  grid",
      s.startDot === true && "  startDot",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or step with ←/→ — each point announces its position in time and on both named axes.",
};

export const recipes: Recipe[] = [
  {
    label: "service cell",
    code: `<PhaseTrace data={trajectory} xLabel="CPU" yLabel="Latency" width={32} height={28} />`,
    node: (
      <PhaseTrace
        data={TRAJ}
        xLabel="CPU"
        yLabel="Latency"
        summary={false}
        width={32}
        height={28}
      />
    ),
  },
  {
    label: "quadrant grid",
    code: `<PhaseTrace data={trajectory} grid startDot />`,
    node: (
      <PhaseTrace
        data={TRAJ}
        xLabel="CPU"
        yLabel="Latency"
        grid
        startDot
        summary={false}
        width={80}
        height={72}
      />
    ),
  },
];

const mkTraj = (rx: number, ry: number, phase = 0) =>
  Array.from({ length: 40 }, (_, i) => {
    const t = (i / 40) * Math.PI * 2;
    return { x: 55 + Math.cos(t + phase) * rx, y: 110 + Math.sin(t - 0.9 + phase) * ry };
  }) as typeof TRAJ;

const CTX_ROWS = [
  { name: "api", meta: "loop", data: TRAJ },
  { name: "worker", meta: "stable", data: mkTraj(8, 12) },
  { name: "batch", meta: "spiral", data: mkTraj(28, 35, 0.8) },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        CPU × latency phase{" "}
        <span className="mc-inline">
          <PhaseTrace data={TRAJ} xLabel="CPU" yLabel="Latency" grid height={16} summary={false} />
        </span>{" "}
        — lag loop in the upper-right regime.
      </p>
    ),
    code: '<p>\n  CPU × latency phase <PhaseTrace data={trajectory} xLabel="CPU" yLabel="Latency" /> — lag loop in the upper-right regime.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <PhaseTrace
                  data={row.data}
                  xLabel="CPU"
                  yLabel="Latency"
                  grid
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
    code: '<td>\n  <PhaseTrace data={trajectory} xLabel="CPU" yLabel="Latency" />\n</td>',
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Phase</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">loop</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">CPU × latency</span>
          </div>
        </div>
        <PhaseTrace
          data={CTX_ROWS[0]!.data}
          xLabel="CPU"
          yLabel="Latency"
          grid
          height={36}
          summary={false}
        />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">loop</span>\n  <span className="unit">CPU × latency</span>\n  <PhaseTrace data={trajectory} xLabel="CPU" yLabel="Latency" />\n</div>',
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
            <PhaseTrace
              data={row.data}
              xLabel="CPU"
              yLabel="Latency"
              grid
              height={14}
              summary={false}
            />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  api <PhaseTrace data={trajectory} xLabel="CPU" yLabel="Latency" />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <PhaseTrace
      data={TRAJ}
      xLabel="x"
      yLabel="y"
      summary={false}
      width={props.width ?? 32}
      height={props.height ?? 28}
    />
  );
}

export function markCode(): string {
  return `<PhaseTrace data={trajectory} xLabel="CPU" yLabel="Latency" />`;
}

export function PreviewLive() {
  return (
    <PhaseTraceInteractive
      data={TRAJ}
      xLabel="CPU"
      yLabel="Latency"
      summary={false}
      width={44}
      height={40}
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
