// Ad-hoc visual harness (NOT a CI gate): SSR-renders chart variants to a static
// HTML on a light grid, so a real browser screenshot shows exact pixels — text
// overlap, voids, alignment, band contrast. Rebuild the lib first, then:
//   node scripts/visual-check.mjs && open the docs server at /vcheck.html
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const styles = readFileSync(fileURLToPath(new URL("../styles.css", import.meta.url)), "utf8");
const D = (p) => import(`../dist/charts/${p}/index.js`);

const { CoverageStrip } = await D("coverage-strip");
const { BenchmarkStrip } = await D("benchmark-strip");
const { PercentileLadder } = await D("percentile-ladder");
const { GradedBand } = await D("graded-band");
const { IconArray } = await D("icon-array");
const { RateVolume } = await D("rate-volume");
const { NetFlow } = await D("net-flow");
const { RetentionCurve } = await D("retention-curve");
const { BurnChart } = await D("burn-chart");
const { ErrorBudget } = await D("error-budget");
const { ControlStrip } = await D("control-strip");
const { ForecastCone } = await D("forecast-cone");
const { QuantileDots } = await D("quantile-dots");
const { ABStrips } = await D("ab-strips");
const { ShiftHistogram } = await D("shift-histogram");
const { ParetoStrip } = await D("pareto-strip");
const { DataDiff } = await D("data-diff");
const { QuadrantDot } = await D("quadrant-dot");
const { CyclePlot } = await D("cycle-plot");
const { ChangePoint } = await D("change-point");
const { EnsembleGhosts } = await D("ensemble-ghosts");
const { TallyMarks } = await D("tally-marks");
const { DicePips } = await D("dice-pips");
const { FillWord } = await D("fill-word");
const { FatDigits } = await D("fat-digits");
const { Thermometer } = await D("thermometer");
const { MoonPhase } = await D("moon-phase");
const { Hourglass } = await D("hourglass");
const { BalanceBeam } = await D("balance-beam");
const { SproutRow } = await D("sprout-row");
const { GardenGrid } = await D("garden-grid");
const { BubbleRow } = await D("bubble-row");
const { MusicStaff } = await D("music-staff");
const { TreeRings } = await D("tree-rings");
const { CitySkyline } = await D("city-skyline");
const { Honeycomb } = await D("honeycomb");
const { Constellation } = await D("constellation");
const { PolarClock } = await D("polar-clock");
const { SpiralYear } = await D("spiral-year");
const { BreathingDot } = await D("breathing-dot");
const { HeartbeatBlip } = await D("heartbeat-blip");
const { CometTrail } = await D("comet-trail");
const { OrbitStatus } = await D("orbit-status");
const { Progress } = await D("progress");
const { Bullet } = await D("bullet");
const { HeatCell } = await D("heat-cell");
const { TimeInRange } = await D("time-in-range");

const svg = (C, props) => renderToStaticMarkup(h(C, props));

const PEERS = Array.from(
  { length: 42 },
  (_, i) => 180 + Math.round(220 * Math.sin(i / 5) ** 2) + (i % 7) * 12,
);
const LATENCY = Array.from({ length: 200 }, (_, i) =>
  i < 130
    ? 90 + (i % 50)
    : i < 180
      ? 150 + ((i * 7) % 320)
      : i < 196
        ? 480 + ((i * 11) % 900)
        : 1500 + ((i * 13) % 800),
);
const DRAWS = Array.from(
  { length: 160 },
  (_, i) => 21 + Math.round(9 * Math.sin(i) + 6 * Math.sin(i * 2.3)),
);
const COVERAGE = [3, 4, null, 5, 0, null, null, 6, 8, 7, null, 9, 11, 10];
const RV = [
  { rate: 0.023, volume: 220 },
  { rate: 0.025, volume: 190 },
  { rate: 0.028, volume: 160 },
  { rate: 0.029, volume: 130 },
  { rate: 0.031, volume: 110 },
  { rate: 0.034, volume: 90 },
  { rate: 0.036, volume: 66 },
  { rate: 0.041, volume: 38 },
];
const PCT = { style: "percent", maximumFractionDigits: 1 };
const NF = [
  { in: 42, out: 31 },
  { in: 38, out: 35 },
  { in: 45, out: 29 },
  { in: 40, out: 44 },
  { in: 52, out: 38 },
  { in: 55, out: 36 },
  { in: 44, out: 52 },
  { in: 60, out: 41 },
  { in: 57, out: 43 },
];
const KFMT = (n) => `${n}k`;
const RET = [1, 0.72, 0.55, 0.47, 0.42, 0.4, 0.39, 0.385, 0.382, 0.38, 0.379, 0.378];
const RETB = [1, 0.6, 0.44, 0.37, 0.33, 0.3, 0.29, 0.285, 0.282, 0.28, 0.279, 0.278];
const BPLAN = [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0];
const BACT = [40, 35, 31, 27, 24, 21];
const EB = [1, 0.96, 0.93, 0.9, 0.86, 0.83, 0.79, 0.75, 0.71, 0.67, 0.64, 0.62];
const EBURN = [1, 0.82, 0.6, 0.38, 0.18, 0.04, 0];
const CTRL = [
  74, 73, 75, 74, 76, 73, 74, 75, 74, 73, 82, 74, 75, 73, 74, 76, 74, 73, 75, 74, 66, 74, 75, 74,
  73, 76, 74, 75, 74, 73,
];
const FCH = [30, 32, 31, 34, 36, 35, 38];
const FCF = {
  mid: [39, 40, 41, 42],
  p80: [
    [36, 42],
    [35, 45],
    [34, 50],
    [33, 55],
  ],
  p50: [
    [37, 41],
    [37, 43],
    [36, 46],
    [35, 49],
  ],
};
const QD = Array.from({ length: 200 }, (_, i) =>
  Math.round(4 + (i % 30) * 0.35 + ((i * 7) % 13) * 1.1 + (i % 50 === 0 ? 20 : 0)),
);
const MINF = (n) => `${n} min`;
const ABA = Array.from({ length: 80 }, (_, i) => 130 + ((i * 13) % 44) - 22);
const ABB = Array.from({ length: 80 }, (_, i) => 116 + ((i * 13) % 44) - 22);
const ABMS = (n) => `${Math.round(n)} ms`;
const SHB = Array.from({ length: 100 }, (_, i) => 120 + (i % 40) - 20);
const SHA = Array.from({ length: 100 }, (_, i) => 96 + (i % 40) - 20);
const PAR = [
  { label: "Timeouts", value: 38 },
  { label: "OOM", value: 24 },
  { label: "Deploy", value: 15 },
  { label: "Config", value: 9 },
  { label: "Network", value: 7 },
  { label: "Auth", value: 4 },
];
const DDIFF = [
  { key: "users", added: 340, removed: 120 },
  { key: "orders", added: 88, removed: 30 },
  { key: "items", added: 40, removed: 20 },
  { key: "tags", added: 24, removed: 8 },
  { key: "notes", added: 12, removed: 6 },
  { key: "flags", added: 8, removed: 3 },
];
const QF = [
  { x: 2, y: 8 },
  { x: 8, y: 9 },
  { x: 3, y: 7 },
  { x: 9, y: 2 },
  { x: 7, y: 3 },
  { x: 1, y: 1 },
  { x: 5, y: 6 },
  { x: 6, y: 8 },
];
const CYC = [];
for (let w = 0; w < 6; w++) CYC.push(38, 40 + w * 2, 45, 48, 52, 61, 44);
const CDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CPSTEP = [...Array(14).fill(30), ...Array(20).fill(48)];
const CPTWO = [...Array(10).fill(10), ...Array(10).fill(50), ...Array(10).fill(22)];
const ENSF = Array.from({ length: 24 }, (_m, i) =>
  Array.from({ length: 10 }, (_t, t) =>
    Math.round(40 + (i - 12) * 0.55 * t * 0.4 + 3 * Math.sin(i + t) + t * 0.5),
  ),
);

function row(title, ...cells) {
  return `<div class="row"><div class="t">${title}</div>${cells.map((c) => `<div class="c">${c}</div>`).join("")}</div>`;
}

const body = [
  `<h2>OLD charts (reference label size)</h2>`,
  row("Progress 60×12", svg(Progress, { value: 0.56, width: 60, height: 12 })),
  row("Progress 120×16", svg(Progress, { value: 0.56, width: 120, height: 16 })),
  row("Bullet 90×14", svg(Bullet, { value: 72, target: 80, width: 90, height: 14 })),
  row("HeatCell label", svg(HeatCell, { value: 72, domain: [0, 100], label: "value" })),

  `<h2>CoverageStrip</h2>`,
  row("default 80×10", svg(CoverageStrip, { data: COVERAGE, width: 80, height: 10 })),
  row(
    "percent, expected 18",
    svg(CoverageStrip, { data: COVERAGE, expected: 18, label: "percent", width: 240, height: 16 }),
  ),
  row(
    "percent small",
    svg(CoverageStrip, { data: COVERAGE, expected: 18, label: "percent", width: 130, height: 12 }),
  ),
  row(
    "intensity",
    svg(CoverageStrip, {
      data: COVERAGE,
      mode: "intensity",
      domain: [0, 12],
      width: 240,
      height: 16,
    }),
  ),
  row("round", svg(CoverageStrip, { data: COVERAGE, shape: "round", width: 240, height: 16 })),
  row(
    "trailing gap",
    svg(CoverageStrip, { data: [1, 1, 1], expected: 8, label: "percent", width: 150, height: 12 }),
  ),

  `<h2>BenchmarkStrip</h2>`,
  row("default 80×12", svg(BenchmarkStrip, { data: PEERS, value: 312, width: 80, height: 12 })),
  row("percentile", svg(BenchmarkStrip, { data: PEERS, value: 312, width: 280, height: 16 })),
  row(
    "value label",
    svg(BenchmarkStrip, { data: PEERS, value: 312, label: "value", width: 280, height: 16 }),
  ),
  row(
    "polarity down",
    svg(BenchmarkStrip, { data: PEERS, value: 230, positive: "down", width: 200, height: 14 }),
  ),
  row(
    "small n minmax",
    svg(BenchmarkStrip, { data: [210, 260, 300, 340, 410], value: 300, width: 200, height: 14 }),
  ),

  `<h2>PercentileLadder</h2>`,
  row("default 80×12", svg(PercentileLadder, { data: LATENCY, width: 80, height: 12 })),
  row("ps 240×18", svg(PercentileLadder, { data: LATENCY, width: 240, height: 18 })),
  row("log", svg(PercentileLadder, { data: LATENCY, scale: "log", width: 240, height: 18 })),
  row("values", svg(PercentileLadder, { data: LATENCY, label: "values", width: 240, height: 20 })),
  row("both", svg(PercentileLadder, { data: LATENCY, label: "both", width: 280, height: 20 })),

  `<h2>GradedBand</h2>`,
  row("default 80×12", svg(GradedBand, { data: DRAWS, width: 80, height: 12 })),
  row("median label", svg(GradedBand, { data: DRAWS, label: "median", width: 240, height: 16 })),
  row("value dot", svg(GradedBand, { data: DRAWS, value: 28, width: 240, height: 16 })),
  row("soft edge", svg(GradedBand, { data: DRAWS, softEdge: true, width: 240, height: 16 })),
  row("50/90", svg(GradedBand, { data: DRAWS, levels: [50, 90], width: 240, height: 16 })),

  `<h2>IconArray</h2>`,
  row("3 in 20", svg(IconArray, { value: 0.15, of: 20, width: 140, height: 30 })),
  row("1 in 10", svg(IconArray, { value: 0.1, of: 10, width: 130, height: 28 })),
  row("percent", svg(IconArray, { value: 0.15, of: 20, label: "percent", width: 140, height: 30 })),
  row("round", svg(IconArray, { value: 0.6, of: 10, shape: "round", width: 140, height: 30 })),
  row("of 100", svg(IconArray, { value: 0.37, of: 100, width: 130, height: 70 })),
  row(
    "polarity",
    svg(IconArray, { value: 0.15, of: 20, positive: "down", width: 150, height: 30 }),
  ),

  `<h2>RateVolume</h2>`,
  row("default 80×20", svg(RateVolume, { data: RV, format: PCT, width: 80, height: 20 })),
  row(
    "minVolume, last",
    svg(RateVolume, { data: RV, format: PCT, minVolume: 50, width: 240, height: 28 }),
  ),
  row("step", svg(RateVolume, { data: RV, format: PCT, curve: "step", width: 240, height: 28 })),
  row(
    "zero volume gap",
    svg(RateVolume, {
      data: [
        { rate: 2, volume: 100 },
        { rate: 9, volume: 0 },
        { rate: 3, volume: 80 },
        { rate: 3.4, volume: 120 },
      ],
      minVolume: 90,
      width: 240,
      height: 28,
    }),
  ),

  `<h2>NetFlow</h2>`,
  row("default 80×20", svg(NetFlow, { data: NF, format: KFMT, width: 80, height: 20 })),
  row("area, last", svg(NetFlow, { data: NF, format: KFMT, width: 240, height: 28 })),
  row("bars", svg(NetFlow, { data: NF, format: KFMT, mode: "bars", width: 240, height: 28 })),
  row(
    "paydown",
    svg(NetFlow, { data: NF, format: KFMT, positive: "down", width: 240, height: 28 }),
  ),
  row("gross only", svg(NetFlow, { data: NF, format: KFMT, net: false, width: 240, height: 28 })),

  `<h2>RetentionCurve</h2>`,
  row("default 80×20", svg(RetentionCurve, { data: RET, unit: "week", width: 80, height: 20 })),
  row("step, last", svg(RetentionCurve, { data: RET, unit: "week", width: 240, height: 28 })),
  row("benchmark", svg(RetentionCurve, { data: RET, benchmark: RETB, width: 240, height: 28 })),
  row("smooth", svg(RetentionCurve, { data: RET, curve: "smooth", width: 240, height: 28 })),
  row(
    "still leaking",
    svg(RetentionCurve, { data: [1, 0.8, 0.6, 0.45, 0.32, 0.22], width: 240, height: 28 }),
  ),

  `<h2>BurnChart</h2>`,
  row(
    "default 80×20",
    svg(BurnChart, { data: { plan: BPLAN, actual: BACT }, width: 80, height: 20 }),
  ),
  row(
    "behind, gap",
    svg(BurnChart, { data: { plan: BPLAN, actual: BACT }, width: 240, height: 28 }),
  ),
  row(
    "ahead",
    svg(BurnChart, {
      data: { plan: BPLAN, actual: [40, 34, 28, 22, 16, 10] },
      width: 240,
      height: 28,
    }),
  ),
  row(
    "burn-up",
    svg(BurnChart, {
      data: { plan: BPLAN.map((v) => 40 - v), actual: BACT.map((v) => 40 - v) },
      mode: "up",
      width: 240,
      height: 28,
    }),
  ),
  row(
    "flatlined",
    svg(BurnChart, {
      data: { plan: BPLAN, actual: [40, 38, 37, 36, 36, 36] },
      width: 240,
      height: 28,
    }),
  ),

  `<h2>ErrorBudget</h2>`,
  row("default 80×20", svg(ErrorBudget, { data: EB, window: 30, width: 80, height: 20 })),
  row("on pace, remaining", svg(ErrorBudget, { data: EB, window: 30, width: 240, height: 28 })),
  row("fast-burn", svg(ErrorBudget, { data: EBURN, window: 20, width: 240, height: 28 })),
  row(
    "exhausted",
    svg(ErrorBudget, { data: [1, 0.5, 0.2, 0.05, 0], window: 12, width: 240, height: 28 }),
  ),
  row(
    "diagonal only",
    svg(ErrorBudget, { data: EB, window: 30, rates: [1], width: 240, height: 28 }),
  ),

  `<h2>ControlStrip</h2>`,
  row("default 80x16", svg(ControlStrip, { data: CTRL, width: 80, height: 16 })),
  row("we rules", svg(ControlStrip, { data: CTRL, rules: "we", width: 240, height: 24 })),
  row("all dots", svg(ControlStrip, { data: CTRL, dots: "all", width: 240, height: 24 })),
  row("provisional", svg(ControlStrip, { data: CTRL.slice(0, 6), width: 240, height: 24 })),

  `<h2>ForecastCone</h2>`,
  row("default 80x20", svg(ForecastCone, { data: FCH, forecast: FCF, width: 80, height: 20 })),
  row(
    "target",
    svg(ForecastCone, { data: FCH, forecast: FCF, target: 45, width: 240, height: 28 }),
  ),
  row(
    "single band",
    svg(ForecastCone, {
      data: FCH,
      forecast: { mid: FCF.mid, p80: FCF.p80 },
      width: 240,
      height: 28,
    }),
  ),
  row("cone only", svg(ForecastCone, { data: [], forecast: FCF, width: 240, height: 28 })),

  `<h2>QuantileDots</h2>`,
  row(
    "default 80x20",
    svg(QuantileDots, { data: QD, threshold: 15, format: MINF, width: 80, height: 20 }),
  ),
  row(
    "threshold, count",
    svg(QuantileDots, { data: QD, threshold: 15, format: MINF, width: 240, height: 30 }),
  ),
  row(
    "15 dots",
    svg(QuantileDots, { data: QD, count: 15, threshold: 15, format: MINF, width: 240, height: 30 }),
  ),
  row("no threshold", svg(QuantileDots, { data: QD, width: 240, height: 30 })),

  `<h2>ABStrips</h2>`,
  row(
    "default 80x20",
    svg(ABStrips, {
      data: { a: ABA, b: ABB },
      format: ABMS,
      positive: "down",
      width: 80,
      height: 20,
    }),
  ),
  row(
    "delta, tags",
    svg(ABStrips, {
      data: { a: ABA, b: ABB },
      format: ABMS,
      positive: "down",
      width: 240,
      height: 28,
    }),
  ),
  row(
    "separated",
    svg(ABStrips, {
      data: { a: ABA.map((v) => v + 40), b: ABB },
      format: ABMS,
      positive: "down",
      width: 240,
      height: 28,
    }),
  ),
  row(
    "small n",
    svg(ABStrips, { data: { a: [100, 130, 145], b: ABB }, format: ABMS, width: 240, height: 28 }),
  ),

  `<h2>ShiftHistogram</h2>`,
  row(
    "default 80x20",
    svg(ShiftHistogram, { data: { before: SHB, after: SHA }, format: ABMS, width: 80, height: 20 }),
  ),
  row(
    "shift, mirror",
    svg(ShiftHistogram, {
      data: { before: SHB, after: SHA },
      format: ABMS,
      width: 240,
      height: 30,
    }),
  ),
  row(
    "overlay",
    svg(ShiftHistogram, {
      data: { before: SHB, after: SHA },
      format: ABMS,
      mode: "overlay",
      width: 240,
      height: 30,
    }),
  ),
  row(
    "no shift",
    svg(ShiftHistogram, {
      data: { before: SHB, after: SHB },
      format: ABMS,
      width: 240,
      height: 30,
    }),
  ),

  `<h2>ParetoStrip</h2>`,
  row(
    "default 80x20",
    svg(ParetoStrip, { data: PAR, unit: "causes", metric: "incidents", width: 80, height: 20 }),
  ),
  row(
    "count label",
    svg(ParetoStrip, { data: PAR, unit: "causes", metric: "incidents", width: 240, height: 30 }),
  ),
  row("rollup max 3", svg(ParetoStrip, { data: PAR, max: 3, width: 240, height: 30 })),
  row("no threshold", svg(ParetoStrip, { data: PAR, threshold: false, width: 240, height: 30 })),

  `<h2>DataDiff</h2>`,
  row("default 80x20", svg(DataDiff, { data: DDIFF, width: 80, height: 20 })),
  row("labels", svg(DataDiff, { data: DDIFF, labels: true, width: 200, height: 72 })),
  row(
    "net + totals",
    svg(DataDiff, { data: DDIFF, net: true, label: "totals", width: 200, height: 72 }),
  ),
  row(
    "0/0 placeholder",
    svg(DataDiff, {
      data: [
        { key: "same", added: 0, removed: 0 },
        { key: "chg", added: 12, removed: 4 },
      ],
      labels: true,
      width: 180,
      height: 48,
    }),
  ),

  `<h2>QuadrantDot</h2>`,
  row(
    "glyph 24x24",
    svg(QuadrantDot, {
      data: { x: 3, y: 9 },
      field: QF,
      xDomain: [0, 10],
      domain: [0, 10],
      xLabel: "effort",
      yLabel: "impact",
    }),
  ),
  row(
    "card 96x96",
    svg(QuadrantDot, {
      data: { x: 3, y: 9 },
      field: QF,
      xDomain: [0, 10],
      domain: [0, 10],
      xLabel: "effort",
      yLabel: "impact",
      width: 96,
      height: 96,
      title: "Effort vs impact",
    }),
  ),
  row(
    "lone glyph",
    svg(QuadrantDot, {
      data: { x: 3, y: 9 },
      xDomain: [0, 10],
      domain: [0, 10],
      split: [5, 5],
      width: 72,
      height: 72,
    }),
  ),
  row(
    "no tint",
    svg(QuadrantDot, {
      data: { x: 8, y: 4 },
      field: QF,
      xDomain: [0, 10],
      domain: [0, 10],
      region: false,
      width: 72,
      height: 72,
    }),
  ),

  `<h2>CyclePlot</h2>`,
  row("default 80x20", svg(CyclePlot, { data: CYC, period: 7, slots: CDAYS, cycleUnit: "weeks" })),
  row(
    "card 240x40",
    svg(CyclePlot, {
      data: CYC,
      period: 7,
      slots: CDAYS,
      cycleUnit: "weeks",
      width: 240,
      height: 40,
      title: "Weekly shape",
    }),
  ),
  row("median", svg(CyclePlot, { data: CYC, period: 7, center: "median", width: 200, height: 32 })),
  row(
    "spine only",
    svg(CyclePlot, { data: CYC, period: 7, trend: "none", width: 200, height: 32 }),
  ),

  `<h2>ChangePoint</h2>`,
  row(
    "clean step 80x16",
    svg(ChangePoint, { data: CPSTEP, label: "delta", width: 80, height: 16 }),
  ),
  row(
    "delta label",
    svg(ChangePoint, { data: CPSTEP, label: "delta", width: 240, height: 24, title: "Error rate" }),
  ),
  row("two breaks", svg(ChangePoint, { data: CPTWO, width: 200, height: 24 })),
  row("no means", svg(ChangePoint, { data: CPSTEP, means: false, width: 200, height: 24 })),

  `<h2>EnsembleGhosts</h2>`,
  row("default 80x20", svg(EnsembleGhosts, { data: ENSF, width: 80, height: 20 })),
  row(
    "endpoints 240x44",
    svg(EnsembleGhosts, { data: ENSF, endpoints: true, width: 240, height: 44, title: "Futures" }),
  ),
  row(
    "synthetic median",
    svg(EnsembleGhosts, { data: ENSF, emphasis: "median", width: 200, height: 32 }),
  ),
  row("12 ghosts", svg(EnsembleGhosts, { data: ENSF, ghosts: 12, width: 200, height: 32 })),

  `<h2>TallyMarks</h2>`,
  row("23 ruled", svg(TallyMarks, { value: 23, height: 16 })),
  row("30 max 25 (+5)", svg(TallyMarks, { value: 30, max: 25, height: 20, title: "Signatures" })),
  row("17 drawn", svg(TallyMarks, { value: 17, pen: "drawn", height: 20 })),
  row("38 max 20 clamp", svg(TallyMarks, { value: 38, max: 20, overflow: "clamp", height: 20 })),

  `<h2>DicePips</h2>`,
  row("faces 1–6", [1, 2, 3, 4, 5, 6].map((v) => svg(DicePips, { value: v, size: 22 })).join(" ")),
  row(
    "0 empty + 9 numeral",
    `${svg(DicePips, { value: 0, size: 22 })} ${svg(DicePips, { value: 9, size: 22, title: "nine" })}`,
  ),
  row("pips-only", svg(DicePips, { value: 5, face: false, size: 22 })),

  `<h2>FillWord</h2>`,
  row(
    "uploading 62%",
    svg(FillWord, { word: "uploading", value: 0.62, fontSize: 16, title: "Upload" }),
  ),
  row("drain 70%", svg(FillWord, { word: "expiring", value: 0.7, mode: "drain", fontSize: 16 })),
  row(
    "label value 40%",
    svg(FillWord, { word: "storage", value: 0.4, label: "value", fontSize: 16 }),
  ),
  row("full 100%", svg(FillWord, { word: "complete", value: 1, fontSize: 16 })),

  `<h2>FatDigits</h2>`,
  row(
    "column scan",
    [1204, 318, 76, 2100, 55]
      .map(
        (v) =>
          `<span style="display:block;text-align:right">${svg(FatDigits, { value: v, domain: [0, 2100], fontSize: 15 })}</span>`,
      )
      .join(""),
  ),
  row("digit mode 1902", svg(FatDigits, { value: 1902, encode: "digit", fontSize: 18 })),
  row("3 tiers", svg(FatDigits, { value: 1204, domain: [0, 2100], tiers: 3, fontSize: 18 })),

  `<h2>Thermometer</h2>`,
  row(
    "vertical: 40 / 72+target / 95 / label",
    `${svg(Thermometer, { value: 40 })} ${svg(Thermometer, { value: 72, target: 80 })} ${svg(Thermometer, { value: 95 })} ${svg(Thermometer, { value: 72, label: "value" })}`,
  ),
  row(
    "horizontal cell",
    svg(Thermometer, { value: 62, orientation: "horizontal", bulb: false, width: 120 }),
  ),
  row("over domain (140)", svg(Thermometer, { value: 140, target: 90 })),

  `<h2>MoonPhase</h2>`,
  row(
    "progress: 10 / 35 / 50 / 75 / 100",
    [0.1, 0.35, 0.5, 0.75, 1].map((v) => svg(MoonPhase, { value: v, size: 24 })).join(" "),
  ),
  row(
    "cycle: new / first / full / last",
    [0, 0.25, 0.5, 0.75]
      .map((v) => svg(MoonPhase, { value: v, mode: "cycle", size: 24 }))
      .join(" "),
  ),

  `<h2>Hourglass</h2>`,
  row(
    "0 / 25 / 50 / 75 / 100 elapsed",
    [0, 0.25, 0.5, 0.75, 1].map((v) => svg(Hourglass, { value: v, height: 32 })).join(" "),
  ),
  row("labelled remaining", svg(Hourglass, { value: 0.7, label: "remaining", height: 36 })),

  `<h2>BalanceBeam</h2>`,
  row(
    "left / balanced / right / saturated",
    [
      [620, 480],
      [500, 500],
      [300, 800],
      [950, 50],
    ]
      .map((p) =>
        svg(BalanceBeam, {
          data: [
            { label: "A", value: p[0] },
            { label: "B", value: p[1] },
          ],
          width: 64,
          height: 26,
        }),
      )
      .join(" "),
  ),
  row(
    "round + labelled",
    `${svg(BalanceBeam, {
      data: [
        { label: "In", value: 620 },
        { label: "Out", value: 480 },
      ],
      shape: "round",
      width: 72,
      height: 30,
    })} ${svg(BalanceBeam, {
      data: [
        { label: "In", value: 620 },
        { label: "Out", value: 480 },
      ],
      label: "values",
      width: 80,
      height: 32,
    })}`,
  ),

  `<h2>SproutRow</h2>`,
  row(
    "stages 0–3 across a row",
    svg(SproutRow, {
      data: [
        { label: "A", value: 0 },
        { label: "B", value: 1 },
        { label: "C", value: 2 },
        { label: "D", value: 3 },
        { label: "E", value: 2 },
        { label: "F", value: 3 },
      ],
      height: 24,
      step: 20,
    }),
  ),
  row(
    "labelled + missing (null)",
    svg(SproutRow, {
      data: [
        { label: "Acme", value: 3 },
        { label: "Beta", value: null },
        { label: "Gamma", value: 1 },
      ],
      labels: true,
      height: 32,
      step: 30,
    }),
  ),
  row(
    "labelled 6 accounts (showcase config)",
    svg(SproutRow, {
      data: [
        { label: "Acme", value: 3 },
        { label: "Beta", value: 2 },
        { label: "Gamma", value: 3 },
        { label: "Delta", value: 1 },
        { label: "Echo", value: 0 },
        { label: "Foxx", value: 2 },
      ],
      labels: true,
      height: 30,
      step: 22,
    }),
  ),

  `<h2>GardenGrid</h2>`,
  row(
    "grid 7 rows",
    svg(GardenGrid, {
      data: [12, 20, 8, 0, 15, 28, 34, 5, 0, 22, 18, 9, 3, 0, 24, 30, 11],
      unit: "weeks",
    }),
  ),
  row("strip (rows 1)", svg(GardenGrid, { data: [12, 20, 8, 0, 15, 28, 34, 5, 0, 22], rows: 1 })),
  row(
    "blank empties",
    svg(GardenGrid, { data: [12, 0, 8, 0, 0, 28, 34, 0, 0, 22], rows: 1, empty: "blank" }),
  ),

  `<h2>BubbleRow</h2>`,
  (() => {
    const B = [
      { label: "EMEA", value: 1240 },
      { label: "AMER", value: 890 },
      { label: "APAC", value: 560 },
      { label: "LATAM", value: 210 },
    ];
    return [
      row("values (default)", svg(BubbleRow, { data: B, height: 34 })),
      row("baseline align", svg(BubbleRow, { data: B, align: "baseline", height: 34 })),
      row("label both", svg(BubbleRow, { data: B, label: "both", height: 34 })),
    ].join("\n");
  })(),

  `<h2>MusicStaff</h2>`,
  row(
    "melody",
    svg(MusicStaff, { data: [3, 5, 4, 8, 6, 9, 7, 11], label: "last", width: 120, height: 26 }),
  ),
  row(
    "staff range",
    svg(MusicStaff, { data: [3, 5, 4, 8, 6, 9], range: "staff", width: 100, height: 24 }),
  ),
  row("with a rest", svg(MusicStaff, { data: [3, 5, null, 8, 6], width: 90, height: 24 })),

  `<h2>TreeRings</h2>`,
  (() => {
    const Y = [8, 12, 10, 18, 22, 15, 20, 14];
    return [
      row(
        "stroke + last",
        `<span style="display:inline-flex;gap:12px;align-items:center">${svg(TreeRings, { data: Y, label: "last", unit: "years", periodWord: "year", size: 40 })}${svg(TreeRings, { data: Y, size: 28 })}</span>`,
      ),
      row("fill annuli", svg(TreeRings, { data: Y, rings: "fill", size: 44 })),
      row("cohort (total 200)", svg(TreeRings, { data: Y, total: 200, size: 44 })),
    ].join("\n");
  })(),

  `<h2>CitySkyline</h2>`,
  (() => {
    const T = [
      { label: "Platform", value: 46, lit: 0.7 },
      { label: "Core", value: 32, lit: 0.5 },
      { label: "Web", value: 28, lit: 0.9 },
      { label: "API", value: 40, lit: 0.3 },
      { label: "Data", value: 18, lit: 0.6 },
    ];
    return [
      row(
        "labelled",
        svg(CitySkyline, { data: T, labels: true, unit: "teams", bw: 16, gap: 6, height: 40 }),
      ),
      row("values", svg(CitySkyline, { data: T, label: "value", bw: 16, gap: 6, height: 36 })),
      row(
        "plain bars",
        svg(CitySkyline, {
          data: T.map((d) => ({ label: d.label, value: d.value })),
          bw: 14,
          gap: 5,
          height: 30,
        }),
      ),
    ].join("\n");
  })(),

  `<h2>Honeycomb</h2>`,
  row("34 of 40 (outline)", svg(Honeycomb, { value: 34, total: 40, unit: "seats", cellR: 5 })),
  row("strip (rows 1)", svg(Honeycomb, { value: 7, total: 10, rows: 1, cellR: 6 })),
  row("dim empties", svg(Honeycomb, { value: 28, total: 40, empty: "dim", cellR: 5 })),

  `<h2>Constellation</h2>`,
  row(
    "connected + magnitude",
    svg(Constellation, {
      data: [
        { x: 0, y: 40, m: 2 },
        { x: 2, y: 90, m: 7 },
        { x: 5, y: 30, m: 3 },
        { x: 8, y: 65, m: 5 },
      ],
      width: 90,
      height: 30,
    }),
  ),
  row(
    'label="max"',
    svg(Constellation, {
      data: [
        { x: 0, y: 40, m: 2 },
        { x: 2, y: 90, m: 7 },
        { x: 5, y: 30, m: 3 },
        { x: 8, y: 65, m: 5 },
      ],
      label: "max",
      width: 90,
      height: 30,
    }),
  ),
  row(
    "value-less (jittered), no connector",
    svg(Constellation, {
      data: [{ x: 0 }, { x: 3 }, { x: 5 }, { x: 7 }, { x: 9 }],
      connect: false,
      width: 90,
      height: 30,
    }),
  ),

  `<h2>PolarClock</h2>`,
  row(
    "24h day, now=14",
    svg(PolarClock, {
      data: Array.from({ length: 24 }, (_, h) => (h === 14 ? 312 : h === 4 ? 20 : 80 + h)),
      now: 14,
      size: 64,
    }),
  ),
  row(
    'labels + label="max"',
    svg(PolarClock, {
      data: Array.from({ length: 24 }, (_, h) => (h === 14 ? 312 : h === 4 ? 20 : 80 + h)),
      labels: true,
      label: "max",
      size: 64,
    }),
  ),
  row(
    "week, opacity mode",
    svg(PolarClock, { data: [120, 200, 180, 210, 260, 90, 60], mode: "opacity", size: 64 }),
  ),
  row("with a null + a zero", svg(PolarClock, { data: [10, null, 30, 0, 25], size: 64 })),

  `<h2>SpiralYear</h2>`,
  row(
    "52 weeks, month ticks",
    svg(SpiralYear, {
      data: Array.from({ length: 52 }, (_, i) =>
        Math.round(200 + 150 * Math.sin(((i - 8) / 52) * Math.PI * 2)),
      ),
      size: 80,
    }),
  ),
  row(
    "arc marks",
    svg(SpiralYear, {
      data: Array.from({ length: 52 }, (_, i) =>
        Math.round(200 + 150 * Math.sin(((i - 8) / 52) * Math.PI * 2)),
      ),
      mark: "arc",
      size: 80,
    }),
  ),
  row(
    "200 days, steps 3, no ticks",
    svg(SpiralYear, {
      data: Array.from({ length: 200 }, (_, i) => (i * 37) % 100),
      steps: 3,
      monthTicks: false,
      size: 80,
    }),
  ),

  `<h2>BreathingDot</h2>`,
  row("calm (0.2)", svg(BreathingDot, { value: 0.2, size: 40 })),
  row("elevated (0.65)", svg(BreathingDot, { value: 0.65, size: 40 })),
  row("strained (0.92) + label", svg(BreathingDot, { value: 0.92, label: "value", size: 40 })),
  row("unknown (null)", svg(BreathingDot, { value: null, size: 40 })),

  `<h2>HeartbeatBlip</h2>`,
  row(
    "busy window",
    svg(HeartbeatBlip, {
      data: [97000, 92000, 85000, 70000, 55000, 48000],
      now: 100000,
      width: 90,
    }),
  ),
  row(
    "with count label",
    svg(HeartbeatBlip, {
      data: [97000, 92000, 85000, 70000, 55000, 48000],
      now: 100000,
      label: "count",
      width: 90,
    }),
  ),
  row("flatline (down)", svg(HeartbeatBlip, { data: [], now: 100000, width: 90 })),

  `<h2>CometTrail</h2>`,
  row(
    "rising trail + head",
    svg(CometTrail, { data: [40, 45, 50, 55, 60, 65, 70, 72, 75, 78, 80, 84, 87], width: 90 }),
  ),
  row("volatile", svg(CometTrail, { data: [50, 80, 30, 70, 40, 90, 55, 62], width: 90 })),
  row("single point", svg(CometTrail, { data: [42], width: 90 })),

  `<h2>OrbitStatus</h2>`,
  row(
    "240ms, 12 calls/s",
    svg(OrbitStatus, {
      latency: 240,
      rate: 12,
      latencyDomain: [0, 500],
      rateDomain: [0, 20],
      size: 56,
    }),
  ),
  row(
    "alerting + label",
    svg(OrbitStatus, {
      latency: 350,
      rate: 5,
      latencyDomain: [0, 500],
      rateDomain: [0, 20],
      alert: 300,
      label: "latency",
      size: 56,
    }),
  ),
  row(
    "idle (rate 0, solid orbit)",
    svg(OrbitStatus, {
      latency: 100,
      rate: 0,
      latencyDomain: [0, 500],
      rateDomain: [0, 20],
      size: 56,
    }),
  ),
  row("unknown", svg(OrbitStatus, { latency: NaN, rate: 5, size: 56 })),

  `<h2>TimeInRange</h2>`,
  row("in-range label", svg(TimeInRange, { data: { below: 9, in: 72, above: 19 }, width: 240, height: 22 })),
  row("five zones, all", svg(TimeInRange, { data: { severeBelow: 2, below: 7, in: 72, above: 15, severeAbove: 4 }, label: "all", width: 240, height: 22 })),
  row("vertical column", svg(TimeInRange, { data: { severeBelow: 2, below: 7, in: 72, above: 15, severeAbove: 4 }, orientation: "vertical", label: "all", width: 28, height: 130 })),
  row("cell", svg(TimeInRange, { data: { below: 9, in: 72, above: 19 }, width: 60, height: 10 })),
].join("\n");

const html = `<!doctype html><html><head><meta charset="utf8"><style>${styles}
  body{margin:0;padding:24px 32px;background:#fbfbfc;color:#1a1a1a;font:14px system-ui;
    background-image:linear-gradient(#e6e8ee 1px,transparent 1px),linear-gradient(90deg,#e6e8ee 1px,transparent 1px);
    background-size:44px 44px}
  h2{font:600 13px ui-monospace,monospace;color:#555;margin:26px 0 6px}
  .row{display:flex;align-items:center;gap:16px;padding:8px 0;border-bottom:1px solid #eef0f4}
  .t{width:150px;font:11px ui-monospace,monospace;color:#888;flex:none}
  .c{display:flex;align-items:center}
  svg{outline:1px dashed #ccd; outline-offset:1px}
</style></head><body>${body}</body></html>`;

mkdirSync(fileURLToPath(new URL("../apps/docs/public", import.meta.url)), { recursive: true });
writeFileSync(fileURLToPath(new URL("../apps/docs/public/vcheck.html", import.meta.url)), html);
console.log("wrote apps/docs/public/vcheck.html");
