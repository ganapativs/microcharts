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
const { Progress } = await D("progress");
const { Bullet } = await D("bullet");
const { HeatCell } = await D("heat-cell");

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
  row("0 empty + 9 numeral", `${svg(DicePips, { value: 0, size: 22 })} ${svg(DicePips, { value: 9, size: 22, title: "nine" })}`),
  row("pips-only", svg(DicePips, { value: 5, face: false, size: 22 })),

  `<h2>FillWord</h2>`,
  row("uploading 62%", svg(FillWord, { word: "uploading", value: 0.62, fontSize: 16, title: "Upload" })),
  row("drain 70%", svg(FillWord, { word: "expiring", value: 0.7, mode: "drain", fontSize: 16 })),
  row("label value 40%", svg(FillWord, { word: "storage", value: 0.4, label: "value", fontSize: 16 })),
  row("full 100%", svg(FillWord, { word: "complete", value: 1, fontSize: 16 })),
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
