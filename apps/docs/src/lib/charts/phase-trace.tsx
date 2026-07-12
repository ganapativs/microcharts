import { PhaseTrace } from "@microcharts/react/phase-trace";
import { PhaseTrace as PhaseTraceInteractive } from "@microcharts/react/phase-trace/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

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
  tagline: "How two coupled signals move together — loops, regimes, and where the system is now.",
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
      ui.animate && "  animate",
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

export default {
  entry,
  Preview,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
