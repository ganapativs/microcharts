// Craft gate (pnpm craft): renders every chart × every label combination ×
// several sizes against dist/ and fails on text escapes, text-text overlap,
// or text-on-mark collisions. Run after `pnpm build`. Adding a chart type?
// Add its variants here IN THE SAME PR (plan/21 §8a).
import { audit, render } from "./audit.mjs";
import { geometryAudit } from "./geometry-audit.mjs";
const D = (s) => import(`../../dist/charts/${s}/index.js`);

const CATS = [
  { label: "East", value: 47 },
  { label: "West", value: 41 },
  { label: "South", value: 33 },
  { label: "North", value: 44 },
  { label: "Mid", value: 20 },
];
const WAVE = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4, 19, 21];
const SURVEY = [
  { label: "Strongly disagree", value: 10 },
  { label: "Disagree", value: 14 },
  { label: "Neutral", value: 14 },
  { label: "Agree", value: 34 },
  { label: "Strongly agree", value: 28 },
];

const RV = [
  { rate: 2.3, volume: 120 },
  { rate: 3.1, volume: 90 },
  { rate: 2.8, volume: 140 },
  { rate: 3.6, volume: 70 },
  { rate: 4.1, volume: 38 },
];
const NF = [
  { in: 4, out: 3 },
  { in: 5, out: 4 },
  { in: 6, out: 4 },
  { in: 5, out: 6 },
  { in: 7, out: 5 },
  { in: 8, out: 6 },
];

const CASES = [];
const add = (slug, comp, variants, sizes) => CASES.push({ slug, comp, variants, sizes });

add(
  "sparkline",
  "Sparkline",
  [{ label: "last" }, { label: "minmax" }, { label: "last", dots: "minmax" }],
  [
    [60, 16],
    [120, 24],
    [220, 32],
  ],
);
add(
  "sparkbar",
  "SparkBar",
  [{ data: WAVE }],
  [
    [60, 16],
    [220, 32],
  ],
);
add(
  "delta",
  "Delta",
  [{ value: 0.124 }, { value: -0.08 }, { value: 128, from: 100 }],
  [[999, 999]],
);
add(
  "bullet",
  "Bullet",
  [
    { value: 68, target: 80, bands: [50, 90], label: "value" },
    { value: 68, target: 80, bands: [50, 90] },
  ],
  [
    [80, 10],
    [160, 14],
  ],
);
add(
  "trend-arrow",
  "TrendArrow",
  [
    { value: 0.12, showValue: true },
    { value: -0.05, showValue: true, glyph: "chevron" },
  ],
  [[999, 999]],
);
add(
  "progress",
  "Progress",
  [{ value: 0.44 }, { value: 1.12 }, { value: 0.68, segments: 5 }, { value: 0.44, label: false }],
  [
    [48, 8],
    [160, 12],
  ],
);
add(
  "rug-strip",
  "RugStrip",
  [{ data: [42, 48, 51, 53, 55, 58, 61, 63, 66, 71, 55, 52, 49, 58, 62, 75, 83], highlight: 78 }],
  [
    [60, 10],
    [160, 14],
  ],
);
add(
  "mini-bar",
  "MiniBar",
  [{ data: CATS }, { data: CATS, label: "value" }, { data: CATS, label: "both" }],
  [
    [60, 24],
    [120, 40],
    [220, 60],
  ],
);
add(
  "pictogram-row",
  "PictogramRow",
  [
    { value: 5, total: 8 },
    { value: 2.5, total: 4, label: "count" },
  ],
  [
    [60, 12],
    [120, 18],
  ],
);
add(
  "seismogram",
  "Seismogram",
  [{ data: Array.from({ length: 40 }, (_, j) => (j % 9 === 0 ? (j % 7) + 1 : 0)) }],
  [[60, 16]],
);
add(
  "heat-strip",
  "HeatStrip",
  [{ data: WAVE }],
  [
    [60, 10],
    [220, 16],
  ],
);
add(
  "dot-plot",
  "DotPlot",
  [{ data: CATS }, { data: CATS, values: true }, { data: CATS, values: true, stem: true }],
  [
    [60, 30],
    [120, 50],
    [220, 70],
  ],
);
add(
  "dumbbell",
  "Dumbbell",
  [
    { data: CATS.map((d) => ({ label: d.label, from: d.value, to: (d.value * 1.3) % 60 })) },
    {
      data: CATS.map((d) => ({ label: d.label, from: d.value, to: (d.value * 1.3) % 60 })),
      label: "values",
    },
  ],
  [
    [60, 40],
    [120, 60],
    [220, 80],
  ],
);
add(
  "paired-bars",
  "PairedBars",
  [
    {
      data: CATS.slice(0, 4).map((d) => ({
        label: d.label,
        value: d.value,
        ref: (d.value * 1.2) % 60,
      })),
    },
  ],
  [
    [60, 32],
    [160, 48],
  ],
);
add(
  "slope",
  "Slope",
  [
    {
      data: [
        { label: "East", from: 40, to: 47 },
        { label: "West", from: 55, to: 41 },
        { label: "South", from: 30, to: 33 },
        { label: "North", from: 50, to: 44 },
        { label: "Mid", from: 20, to: 35 },
      ],
      label: "both",
    },
    {
      data: [
        { label: "East", from: 40, to: 47 },
        { label: "West", from: 55, to: 41 },
        { label: "South", from: 30, to: 33 },
        { label: "North", from: 50, to: 44 },
        { label: "Mid", from: 20, to: 35 },
      ],
      label: "value",
    },
    {
      data: [
        { label: "A", from: 47, to: 47.5 },
        { label: "B", from: 47.2, to: 47.4 },
        { label: "C", from: 20, to: 60 },
      ],
      label: "both",
    },
  ],
  [
    [90, 70],
    [120, 72],
    [200, 130],
    [90, 56],
  ],
);
add(
  "micro-scatter",
  "MicroScatter",
  [
    {
      data: Array.from({ length: 24 }, (_, i) => ({ x: i, y: i * 3 + ((i * 7) % 5) * 6 })),
      trend: true,
    },
  ],
  [
    [40, 24],
    [220, 132],
  ],
);
add(
  "segmented-bar",
  "SegmentedBar",
  [{ data: CATS }, { data: CATS, label: "largest" }],
  [
    [60, 10],
    [220, 20],
  ],
);
add(
  "time-in-range",
  "TimeInRange",
  [
    { data: { below: 9, in: 72, above: 19 } },
    { data: { severeBelow: 2, below: 7, in: 72, above: 15, severeAbove: 4 }, label: "all" },
  ],
  [
    [60, 10],
    [240, 22],
  ],
);
add(
  "rubric-strip",
  "RubricStrip",
  [
    {
      data: [
        { label: "Correctness", score: 0.92, weight: 3 },
        { label: "Coverage", score: 0.78, weight: 2 },
        { label: "Style", score: 0.41, weight: 1 },
      ],
      target: 0.7,
    },
  ],
  [
    [80, 24],
    [240, 40],
  ],
);
add(
  "trace-fold",
  "TraceFold",
  [
    {
      data: [
        { label: "request", start: 0, duration: 214, depth: 0 },
        { label: "db.query", start: 10, duration: 86, depth: 1, parent: 0 },
        { label: "render", start: 96, duration: 60, depth: 1, parent: 0 },
        { label: "index-scan", start: 12, duration: 70, depth: 2, parent: 1 },
      ],
      format: (n) => `${Math.round(n)} ms`,
    },
  ],
  [
    [80, 24],
    [320, 40],
  ],
);
add(
  "phase-trace",
  "PhaseTrace",
  [
    {
      data: Array.from({ length: 40 }, (_, i) => {
        const t = (i / 40) * Math.PI * 2;
        return { x: 55 + Math.cos(t) * 22, y: 110 + Math.sin(t - 0.9) * 40 };
      }),
      xLabel: "CPU",
      yLabel: "Latency",
      grid: true,
    },
  ],
  [
    [40, 32],
    [110, 100],
  ],
);
add(
  "volume-profile",
  "VolumeProfile",
  [
    {
      data: [
        { level: 138, weight: 11 },
        { level: 140, weight: 18 },
        { level: 142, weight: 26 },
        { level: 144, weight: 20 },
        { level: 146, weight: 12 },
      ],
    },
  ],
  [
    [48, 32],
    [120, 80],
  ],
);
add(
  "folded-day-band",
  "FoldedDayBand",
  [
    {
      data: Array.from({ length: 14 }, (_d, d) =>
        Array.from({ length: 24 }, (_h, h) => ({
          t: d * 24 + h,
          value: Math.round(40 + 42 * Math.max(0, 1 - Math.abs(h - 14) / 10) + Math.sin(d + h) * 8),
        })),
      ).flat(),
      today: Array.from({ length: 24 }, (_h, h) => ({
        t: h,
        value: Math.round(40 + 42 * Math.max(0, 1 - Math.abs(h - 14) / 10) + 14),
      })),
    },
  ],
  [
    [80, 20],
    [320, 40],
  ],
);
add(
  "confusion-grid",
  "ConfusionGrid",
  [
    {
      data: {
        labels: ["cat", "dog"],
        counts: [
          [88, 12],
          [10, 59],
        ],
      },
    },
    {
      data: {
        labels: ["A", "B", "C"],
        counts: [
          [70, 8, 2],
          [6, 62, 12],
          [3, 9, 58],
        ],
      },
      label: "accuracy",
    },
  ],
  [
    [44, 44],
    [120, 120],
  ],
);
add(
  "calibration-strip",
  "CalibrationStrip",
  [
    {
      data: [
        { predicted: 0.1, observed: 0.08, count: 90 },
        { predicted: 0.3, observed: 0.36, count: 70 },
        { predicted: 0.5, observed: 0.44, count: 55 },
        { predicted: 0.7, observed: 0.52, count: 30 },
        { predicted: 0.9, observed: 0.85, count: 8 },
      ],
    },
  ],
  [
    [80, 24],
    [300, 44],
  ],
);
add(
  "partition-strip",
  "PartitionStrip",
  [
    {
      data: [
        {
          label: "JS",
          children: [
            { label: "react", value: 28 },
            { label: "vendor", value: 12 },
          ],
        },
        {
          label: "CSS",
          children: [
            { label: "tw", value: 16 },
            { label: "custom", value: 8 },
          ],
        },
        { label: "img", value: 18 },
      ],
    },
  ],
  [
    [80, 16],
    [320, 30],
  ],
);
add(
  "depth-wedge",
  "DepthWedge",
  [
    {
      data: {
        demand: [
          { level: 99.75, amount: 420 },
          { level: 99.5, amount: 360 },
          { level: 99, amount: 200 },
        ],
        supply: [
          { level: 100.25, amount: 300 },
          { level: 100.75, amount: 160 },
        ],
      },
    },
  ],
  [
    [60, 16],
    [320, 30],
  ],
);
add(
  "dual-window-meter",
  "DualWindowMeter",
  [
    {
      data: Array.from({ length: 60 }, (_, i) => -22 + Math.sin(i / 3) * 4 - (i > 40 ? 2 : 0)),
      target: -23,
    },
    {
      data: Array.from({ length: 60 }, (_, i) => -22 + Math.sin(i / 3) * 4),
      target: -23,
      band: [-25, -21],
    },
  ],
  [
    [80, 16],
    [320, 28],
  ],
);
add(
  "minimap-strip",
  "MinimapStrip",
  [
    {
      data: {
        content: Array.from({ length: 600 }, (_, i) => Math.abs(Math.sin(i / 30)) + 0.5),
        window: [220, 320],
        marks: [50, 300, 550],
        known: [[0, 552]],
      },
      domain: [0, 600],
    },
  ],
  [
    [80, 12],
    [300, 18],
  ],
);
add(
  "star-spoke",
  "StarSpoke",
  [
    {
      data: [
        { label: "Speed", value: 0.9 },
        { label: "Power", value: 0.6 },
        { label: "Range", value: 0.5 },
        { label: "Cost", value: 0.3 },
        { label: "Ease", value: 0.7 },
      ],
      dots: true,
    },
  ],
  [
    [32, 32],
    [110, 110],
  ],
);
add(
  "wind-barb",
  "WindBarb",
  [
    { direction: 225, magnitude: 32 },
    { direction: 45, magnitude: 65, label: true },
    { direction: 0, magnitude: 1 },
  ],
  [
    [24, 24],
    [64, 64],
  ],
);
add(
  "event-raster",
  "EventRaster",
  [
    {
      data: [
        { label: "api", events: [2, 5, 9, 20, 33, 48] },
        { label: "db", events: [3, 15, 34] },
        { label: "cache", events: [6, 41] },
      ],
    },
  ],
  [
    [80, 24],
    [300, 36],
  ],
);
add(
  "waveform",
  "Waveform",
  [
    { data: Array.from({ length: 200 }, (_, i) => (i === 126 ? 0.82 : Math.sin(i / 3) * 0.3)) },
    { data: Array.from({ length: 200 }, (_, i) => Math.sin(i / 3) * 0.3), variant: "envelope" },
  ],
  [
    [60, 14],
    [300, 30],
  ],
);
add(
  "eta-bar",
  "EtaBar",
  [
    { progress: 0.64, elapsed: 3.6, rate: 0.18, formatEta: (t) => `${Math.round(t)} min` },
    { progress: 0.3, elapsed: 40, rate: 0 },
    { progress: 0.42, elapsed: 10, rate: 0.05, label: "percent" },
  ],
  [
    [80, 8],
    [300, 16],
  ],
);
add(
  "hypnogram",
  "Hypnogram",
  [
    {
      data: [
        { t: 0, state: "Awake" },
        { t: 8, state: "Light" },
        { t: 22, state: "Deep" },
        { t: 50, state: "REM" },
        { t: 90, state: "Light" },
        { t: 110, state: "Awake" },
      ],
      states: ["Awake", "REM", "Light", "Deep"],
      domain: [0, 120],
    },
  ],
  [
    [80, 16],
    [300, 30],
  ],
);
add(
  "histogram-strip",
  "HistogramStrip",
  [
    {
      data: Array.from({ length: 40 }, (_, i) =>
        i % 3 === 0 ? 40 + (i % 10) : 20 + ((i * 7) % 60),
      ),
      highlight: 42,
    },
  ],
  [
    [60, 16],
    [220, 64],
  ],
);
add(
  "micro-box",
  "MicroBox",
  [
    { data: Array.from({ length: 25 }, (_, i) => (i < 20 ? 40 + (i % 8) : 90 + i)) },
    { stats: { min: 12, q1: 35, median: 42, q3: 51, max: 78 } },
  ],
  [
    [40, 14],
    [220, 32],
  ],
);
add(
  "progress-ring",
  "ProgressRing",
  [{ value: 0.68 }, { value: 1.12 }, { value: 0.4, sweep: "remaining" }],
  [[999, 999]],
);
add(
  "micro-donut",
  "MicroDonut",
  [{ data: CATS.slice(0, 4) }, { data: CATS.slice(0, 4), label: "largest" }],
  [[999, 999]],
);
add(
  "funnel",
  "Funnel",
  [
    {
      data: [
        { label: "Visit", value: 9800 },
        { label: "Signup", value: 2300 },
        { label: "Activate", value: 940 },
        { label: "Pay", value: 310 },
      ],
      label: "rate",
    },
    {
      data: [
        { label: "Visit", value: 9800 },
        { label: "Signup", value: 2300 },
        { label: "Activate", value: 940 },
        { label: "Pay", value: 310 },
      ],
    },
  ],
  [
    [60, 18],
    [220, 66],
  ],
);
add(
  "likert-strip",
  "LikertStrip",
  [
    { data: SURVEY },
    { data: SURVEY, label: "net" },
    { data: SURVEY, neutral: "omit" },
    {
      data: [
        { label: "SD", value: 2 },
        { label: "D", value: 3 },
        { label: "N", value: 5 },
        { label: "A", value: 60 },
        { label: "SA", value: 30 },
      ],
    },
    {
      data: [
        { label: "SD", value: 60 },
        { label: "D", value: 30 },
        { label: "N", value: 5 },
        { label: "A", value: 3 },
        { label: "SA", value: 2 },
      ],
    },
  ],
  [
    [60, 12],
    [80, 12],
    [220, 24],
  ],
);
add(
  "waterfall",
  "Waterfall",
  [
    {
      data: [
        { label: "P", value: 42 },
        { label: "S", value: 18 },
        { label: "R", value: -12 },
        { label: "O", value: -26 },
        { label: "F", value: 5 },
      ],
      start: 60,
    },
    {
      data: [
        { label: "P", value: 42 },
        { label: "S", value: 18 },
        { label: "R", value: -12 },
        { label: "O", value: -26 },
        { label: "F", value: 5 },
      ],
      start: 60,
      label: "delta",
    },
  ],
  [
    [70, 18],
    [220, 30],
  ],
);
add(
  "bump-strip",
  "BumpStrip",
  [
    { data: [5, 5, 4, 4, 4, 3, 2, 2, 3, 2, 1, 1] },
    { data: [1, 2, 3, 4, 5, 5, 4, 5] },
    { data: [5, 5, 4, 4, 4, 3, 2, 2, 3, 2, 1, 1], label: "last" },
  ],
  [
    [60, 12],
    [60, 16],
    [220, 26],
  ],
);
add(
  "dual-sparkline",
  "DualSparkline",
  [
    { data: WAVE, compare: WAVE.map((v) => v * 0.9), label: "last" },
    { data: WAVE, compare: WAVE.map((v) => v * 0.9), band: [13, 16] },
  ],
  [
    [60, 16],
    [220, 28],
  ],
);
add(
  "stacked-area",
  "StackedArea",
  [
    {
      data: [
        { label: "A", values: [30, 40, 55, 60] },
        { label: "B", values: [50, 42, 35, 30] },
        { label: "C", values: [20, 18, 10, 10] },
      ],
      label: "last",
    },
  ],
  [
    [60, 16],
    [220, 30],
  ],
);
add(
  "ohlc",
  "Ohlc",
  [
    {
      data: Array.from({ length: 20 }, (_, i) => {
        const b = 140 + Math.sin(i / 3) * 8 + i * 0.6;
        return { open: b, high: b + 4, low: b - 4, close: b + (i % 2 ? 2 : -1.5) };
      }),
      label: "last",
    },
  ],
  [
    [80, 16],
    [280, 32],
  ],
);
add(
  "horizon",
  "Horizon",
  [{ data: WAVE.map((v) => v * 3 - 20) }],
  [
    [80, 14],
    [220, 22],
  ],
);
add(
  "event-timeline",
  "EventTimeline",
  [
    {
      data: [
        { start: 0, end: 40, label: "Freeze", kind: "accent" },
        { start: 45, end: 90, label: "Healthy", kind: "positive" },
        { start: 70, label: "Incident", kind: "negative" },
      ],
      domain: [0, 100],
      label: "spans",
      now: 95,
    },
  ],
  [
    [80, 12],
    [160, 14],
    [280, 36],
  ],
);

// ── Batch 2 wave 1 — decision strips + icon array ──────────────────────────
const LATENCY = [120, 135, 128, 480, 142, 2100, 155, 138, 900, 148, 132, 470];
add(
  "coverage-strip",
  "CoverageStrip",
  [{ data: [1, null, 3, null, null, 5, 8] }, { data: [1, null, 3], expected: 8, label: "percent" }],
  [
    [80, 10],
    [160, 14],
  ],
);
add(
  "benchmark-strip",
  "BenchmarkStrip",
  [
    { data: LATENCY, value: 155 },
    { data: LATENCY, value: 155, label: "value" },
    { data: [1, 2, 3, 4, 5], value: 3 },
  ],
  [
    [80, 12],
    [160, 16],
  ],
);
add(
  "percentile-ladder",
  "PercentileLadder",
  [{ data: LATENCY }, { data: LATENCY, scale: "log" }, { data: LATENCY, label: "values" }],
  [
    [80, 12],
    [160, 16],
    [240, 20],
  ],
);
add(
  "graded-band",
  "GradedBand",
  [{ data: LATENCY }, { data: LATENCY, softEdge: true }, { data: LATENCY, label: "median" }],
  [
    [80, 12],
    [160, 16],
  ],
);
const BURN = { plan: [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0], actual: [40, 38, 36, 34, 32, 30] };
const EB = [1, 0.96, 0.93, 0.9, 0.86, 0.83, 0.79, 0.75, 0.71, 0.67, 0.64, 0.62];
const CTRL = [10, 11, 9, 10, 11, 9, 10, 10, 11, 9, 10, 16, 10, 9, 11, 10];
const FC_HIST = [30, 32, 31, 34, 36, 35, 38];
const FC_FORE = {
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
const QD = Array.from({ length: 200 }, (_, i) => Math.round(4 + (i % 40) * 0.4 + (i % 7) * 1.5));
const ABA = Array.from({ length: 60 }, (_, i) => 130 + ((i * 7) % 30) - 15);
const ABB = Array.from({ length: 60 }, (_, i) => 118 + ((i * 7) % 30) - 15);
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
add(
  "pareto-strip",
  "ParetoStrip",
  [
    { data: PAR },
    { data: PAR, max: 3 },
    { data: PAR, threshold: false },
    { data: PAR, label: "none" },
  ],
  [
    [80, 20],
    [160, 28],
    [240, 32],
  ],
);
const DDIFF = [
  { key: "users", added: 340, removed: 120 },
  { key: "orders", added: 88, removed: 30 },
  { key: "items", added: 40, removed: 20 },
  { key: "tags", added: 24, removed: 8 },
  { key: "notes", added: 12, removed: 6 },
  { key: "flags", added: 8, removed: 3 },
];
add(
  "data-diff",
  "DataDiff",
  [
    { data: DDIFF },
    { data: DDIFF, labels: true },
    { data: DDIFF, net: true, label: "totals" },
    { data: DDIFF, sort: "net" },
  ],
  [
    [80, 20],
    [160, 56],
    [220, 80],
  ],
);
const QFIELD = [
  { x: 2, y: 8 },
  { x: 8, y: 9 },
  { x: 3, y: 7 },
  { x: 9, y: 2 },
  { x: 7, y: 3 },
  { x: 1, y: 1 },
];
add(
  "quadrant-dot",
  "QuadrantDot",
  [
    { data: { x: 3, y: 9 }, field: QFIELD, xDomain: [0, 10], domain: [0, 10] },
    { data: { x: 3, y: 9 }, xDomain: [0, 10], domain: [0, 10], split: [5, 5] },
    { data: { x: 3, y: 9 }, field: QFIELD, xDomain: [0, 10], domain: [0, 10], region: false },
  ],
  [
    [24, 24],
    [48, 48],
    [120, 120],
  ],
);
const CYCLE = [];
for (let w = 0; w < 6; w++) CYCLE.push(38, 40 + w * 2, 45, 48, 52, 61, 44);
add(
  "cycle-plot",
  "CyclePlot",
  [
    { data: CYCLE, period: 7 },
    { data: CYCLE, period: 7, center: "median" },
    { data: CYCLE, period: 7, trend: "none" },
    { data: CYCLE, period: 7, spine: false },
  ],
  [
    [80, 20],
    [160, 32],
    [240, 40],
  ],
);
const CPSTEP = [...Array(14).fill(30), ...Array(20).fill(48)];
const CPTWO = [...Array(10).fill(10), ...Array(10).fill(50), ...Array(10).fill(22)];
add(
  "change-point",
  "ChangePoint",
  [
    { data: CPSTEP, label: "delta" },
    { data: CPTWO },
    { data: CPSTEP, means: false },
    { data: CPSTEP, breaks: [14], label: "delta" },
  ],
  [
    [80, 16],
    [160, 24],
    [240, 32],
  ],
);
const ENSF = Array.from({ length: 24 }, (_m, i) =>
  Array.from({ length: 10 }, (_t, t) =>
    Math.round(40 + (i - 12) * 0.55 * t * 0.4 + 3 * Math.sin(i + t) + t * 0.5),
  ),
);
add(
  "ensemble-ghosts",
  "EnsembleGhosts",
  [
    { data: ENSF },
    { data: ENSF, endpoints: true },
    { data: ENSF, emphasis: "median" },
    { data: ENSF, ghosts: 12 },
  ],
  [
    [80, 20],
    [160, 32],
    [240, 44],
  ],
);
add(
  "tally-marks",
  "TallyMarks",
  [{ value: 23 }, { value: 30, max: 25 }, { value: 17, pen: "drawn" }, { value: 8, max: 40 }],
  [
    [80, 16],
    [80, 24],
    [80, 32],
  ],
);
add(
  "honeycomb",
  "Honeycomb",
  [
    { value: 34, total: 40 },
    { value: 7, total: 10, rows: 1 },
    { value: 28, total: 40, empty: "dim" },
    { value: 45, total: 40 },
  ],
  [[999, 999]],
);
const STARS = [
  { x: 0, y: 40, m: 2 },
  { x: 2, y: 90, m: 7 },
  { x: 5, y: 30, m: 3 },
  { x: 8, y: 65, m: 5 },
];
add(
  "constellation",
  "Constellation",
  [
    { data: STARS },
    { data: STARS, label: "max" },
    { data: STARS, connect: false },
    { data: [{ x: 0 }, { x: 3 }, { x: 7 }, { x: 9 }] }, // value-less → jittered
  ],
  [
    [999, 999],
    [90, 24],
  ],
);
const DAY = Array.from({ length: 24 }, (_, h) => (h === 14 ? 312 : h === 4 ? 20 : 80 + h));
add(
  "polar-clock",
  "PolarClock",
  [
    { data: DAY },
    { data: DAY, now: 14 },
    { data: DAY, label: "max" },
    { data: DAY, labels: true },
    { data: [120, 200, 180, 210, 260, 90, 60], mode: "opacity" },
    { data: [10, null, 30, 0, 25] },
  ],
  [[999, 999]],
);
const WEEKS = Array.from({ length: 52 }, (_, i) => (i === 29 ? 480 : i === 5 ? 10 : 100 + i));
const DAYS = Array.from({ length: 200 }, (_, i) => (i * 37) % 100);
add(
  "spiral-year",
  "SpiralYear",
  [
    { data: WEEKS, size: 48 },
    { data: WEEKS, size: 48, steps: 3 },
    { data: WEEKS, size: 48, mark: "arc" },
    { data: DAYS, size: 48, monthTicks: false },
    { data: [10, null, 30, 0, 25], size: 48 },
  ],
  [[999, 999]],
);
add(
  "breathing-dot",
  "BreathingDot",
  [{ value: 0.2 }, { value: 0.65 }, { value: 0.92, label: "value" }, { value: null }],
  [[999, 999]],
);
const HB = [97000, 92000, 85000, 70000, 55000, 48000];
add(
  "heartbeat-blip",
  "HeartbeatBlip",
  [
    { data: HB, now: 100000 },
    { data: HB, now: 100000, label: "count" },
    { data: [], now: 100000 },
    { data: [99000], now: 100000 },
  ],
  [[999, 999]],
);
const CT = [40, 45, 50, 55, 60, 65, 70, 72, 75, 78, 80, 84, 87];
add(
  "comet-trail",
  "CometTrail",
  [{ data: CT }, { data: CT, label: "none" }, { data: [99, 12, 88] }, { data: [42] }],
  [[999, 999]],
);
add(
  "orbit-status",
  "OrbitStatus",
  [
    { latency: 240, rate: 12, latencyDomain: [0, 500], rateDomain: [0, 20] },
    { latency: 350, rate: 5, latencyDomain: [0, 500], rateDomain: [0, 20], alert: 300 },
    { latency: 240, rate: 12, latencyDomain: [0, 500], rateDomain: [0, 20], label: "latency" },
    { latency: 100, rate: 0, latencyDomain: [0, 500], rateDomain: [0, 20] },
    { latency: NaN, rate: 5 },
  ],
  [[999, 999]],
);
const SKYLINE = [
  { label: "Platform", value: 46, lit: 0.7 },
  { label: "Core", value: 32, lit: 0.5 },
  { label: "Web", value: 28, lit: 0.9 },
  { label: "API", value: 40, lit: 0.3 },
  { label: "Data", value: 18, lit: 0.6 },
];
add(
  "city-skyline",
  "CitySkyline",
  [
    { data: SKYLINE },
    { data: SKYLINE, labels: true },
    { data: SKYLINE, label: "value" },
    { data: SKYLINE, ground: false },
  ],
  [
    [999, 24],
    [999, 40],
    [999, 52],
  ],
);
const RINGS = [8, 12, 10, 18, 22, 15, 20, 14];
add(
  "tree-rings",
  "TreeRings",
  [
    { data: RINGS },
    { data: RINGS, label: "last" },
    { data: RINGS, rings: "fill" },
    { data: RINGS, total: 200 },
  ],
  [[999, 999]],
);
const MELODY = [3, 5, 4, 8, 6, 9, 7, 11];
add(
  "music-staff",
  "MusicStaff",
  [
    { data: MELODY },
    { data: MELODY, label: "last" },
    { data: MELODY, range: "staff" },
    { data: [3, 5, null, 8, 6] },
  ],
  [
    [60, 20],
    [120, 28],
    [220, 40],
  ],
);
const BUBBLES = [
  { label: "EMEA", value: 1240 },
  { label: "AMER", value: 890 },
  { label: "APAC", value: 560 },
  { label: "LATAM", value: 210 },
];
add(
  "bubble-row",
  "BubbleRow",
  [
    { data: BUBBLES },
    { data: BUBBLES, label: "both" },
    { data: BUBBLES, align: "baseline" },
    { data: BUBBLES, label: "none" },
  ],
  [
    [999, 24],
    [999, 34],
    [999, 44],
  ],
);
const GARDEN = [12, 20, 8, 0, 15, 28, 34, 5, 0, 22, 18, 9, 3, 0, 24, 30, 11];
add(
  "garden-grid",
  "GardenGrid",
  [
    { data: GARDEN },
    { data: GARDEN, rows: 1 },
    { data: GARDEN, steps: 3 },
    { data: GARDEN, empty: "blank" },
  ],
  [[999, 999]],
);
const SPROUT = [
  { label: "Acme", value: 3 },
  { label: "Beta", value: 2 },
  { label: "Gamma", value: 3 },
  { label: "Delta", value: 1 },
  { label: "Echo", value: 0 },
  { label: "Foxtrot", value: 2 },
];
add(
  "sprout-row",
  "SproutRow",
  [
    { data: SPROUT },
    { data: SPROUT, labels: true },
    { data: SPROUT, label: "value" },
    {
      data: [
        { label: "A", value: 2 },
        { label: "B", value: null },
      ],
    },
  ],
  [
    [96, 20],
    [140, 30],
    [180, 36],
  ],
);
const BEAM = [
  { label: "Inflow", value: 620 },
  { label: "Outflow", value: 480 },
];
add(
  "balance-beam",
  "BalanceBeam",
  [
    { data: BEAM },
    { data: BEAM, label: "values" },
    { data: BEAM, shape: "round" },
    {
      data: [
        { label: "A", value: 500 },
        { label: "B", value: 500 },
      ],
    },
  ],
  [
    [48, 20],
    [80, 30],
    [120, 44],
  ],
);
add(
  "hourglass",
  "Hourglass",
  [{ value: 0.5 }, { value: 0.75, label: "remaining" }, { value: 0 }, { value: 1 }],
  [
    [16, 24],
    [20, 30],
    [24, 36],
  ],
);
add(
  "moon-phase",
  "MoonPhase",
  [{ value: 0.1 }, { value: 0.5 }, { value: 0.85 }, { value: 0.5, mode: "cycle" }],
  [
    [16, 16],
    [24, 24],
    [40, 40],
  ],
);
add(
  "thermometer",
  "Thermometer",
  [
    { value: 72, target: 80 },
    { value: 72, target: 80, label: "value" },
    { value: 62, orientation: "horizontal", bulb: false },
    { value: 140 },
  ],
  [
    [16, 48],
    [20, 56],
    [24, 64],
  ],
);
add(
  "fat-digits",
  "FatDigits",
  [
    { value: 1204, domain: [0, 2100] },
    { value: 2100, domain: [0, 2100] },
    { value: 1902, encode: "digit" },
    { value: 318, domain: [0, 2100], tiers: 3 },
  ],
  [
    [60, 20],
    [80, 24],
    [120, 28],
  ],
);
add(
  "fill-word",
  "FillWord",
  [
    { word: "uploading", value: 0.62 },
    { word: "expiring", value: 0.7, mode: "drain" },
    { word: "storage", value: 0.4, label: "value" },
    { word: "processing", value: 1 },
  ],
  [
    [80, 18],
    [120, 20],
    [180, 24],
  ],
);
add(
  "dice-pips",
  "DicePips",
  [{ value: 4 }, { value: 6 }, { value: 9 }, { value: 3, face: false }],
  [
    [16, 16],
    [24, 24],
    [40, 40],
  ],
);
add(
  "shift-histogram",
  "ShiftHistogram",
  [
    { data: { before: SHB, after: SHA } },
    { data: { before: SHB, after: SHA }, mode: "overlay" },
    { data: { before: SHB, after: SHA }, bins: 6 },
    { data: { before: SHB, after: SHA }, label: "none" },
  ],
  [
    [80, 20],
    [160, 28],
    [240, 32],
  ],
);
add(
  "ab-strips",
  "ABStrips",
  [
    { data: { a: ABA, b: ABB } },
    { data: { a: ABA, b: ABB }, labels: ["Ctrl", "Test"] },
    { data: { a: ABA, b: ABB }, label: "none" },
    { data: { a: [100, 130, 145], b: ABB } },
  ],
  [
    [80, 20],
    [160, 28],
    [240, 32],
  ],
);
add(
  "quantile-dots",
  "QuantileDots",
  [
    { data: QD },
    { data: QD, threshold: 15 },
    { data: QD, count: 15 },
    { data: QD, threshold: 15, side: "below" },
  ],
  [
    [80, 20],
    [160, 28],
    [240, 32],
  ],
);
add(
  "forecast-cone",
  "ForecastCone",
  [
    { data: FC_HIST, forecast: FC_FORE },
    { data: FC_HIST, forecast: { mid: FC_FORE.mid, p80: FC_FORE.p80 } },
    { data: FC_HIST, forecast: FC_FORE, target: 45 },
    { data: FC_HIST, forecast: FC_FORE, label: "none" },
  ],
  [
    [80, 20],
    [160, 28],
    [240, 32],
  ],
);
add(
  "control-strip",
  "ControlStrip",
  [
    { data: CTRL },
    { data: CTRL, rules: "we" },
    { data: CTRL, dots: "all" },
    { data: CTRL.slice(0, 6) },
  ],
  [
    [80, 16],
    [160, 24],
    [240, 28],
  ],
);
add(
  "error-budget",
  "ErrorBudget",
  [
    { data: EB, window: 30 },
    { data: EB },
    { data: EB, rates: [1] },
    { data: [1, 0.6, 0.3, 0.05, 0], window: 12, label: "none" },
  ],
  [
    [80, 20],
    [160, 28],
    [240, 32],
  ],
);
add(
  "burn-chart",
  "BurnChart",
  [
    { data: BURN },
    { data: BURN, projection: false },
    { data: { plan: [0, 4, 8, 12, 16, 20, 24, 28], actual: [0, 3, 6, 9] }, mode: "up" },
    { data: BURN, label: "none" },
  ],
  [
    [80, 20],
    [160, 28],
    [240, 32],
  ],
);
add(
  "retention-curve",
  "RetentionCurve",
  [
    { data: [1, 0.71, 0.52, 0.43, 0.37, 0.344, 0.341, 0.34], unit: "week" },
    {
      data: [1, 0.71, 0.52, 0.43, 0.37, 0.344, 0.341, 0.34],
      benchmark: [1, 0.6, 0.44, 0.37, 0.33],
    },
    { data: [1, 0.71, 0.52, 0.43, 0.37, 0.344, 0.341, 0.34], curve: "smooth" },
    { data: [1, 0.71, 0.52, 0.43, 0.37, 0.344, 0.341, 0.34], label: "none" },
  ],
  [
    [80, 20],
    [160, 28],
    [240, 32],
  ],
);
add(
  "net-flow",
  "NetFlow",
  [{ data: NF }, { data: NF, mode: "bars" }, { data: NF, net: false }, { data: NF, label: "none" }],
  [
    [80, 20],
    [160, 28],
    [240, 32],
  ],
);
add(
  "rate-volume",
  "RateVolume",
  [
    { data: RV },
    { data: RV, minVolume: 50 },
    { data: RV, curve: "step" },
    { data: RV, label: "none" },
  ],
  [
    [80, 20],
    [160, 28],
    [240, 32],
  ],
);
add(
  "icon-array",
  "IconArray",
  [
    { value: 0.15, of: 20 },
    { value: 0.15, of: 20, label: "percent" },
    { value: 0.6, of: 10, shape: "round" },
  ],
  [
    [60, 24],
    [120, 40],
  ],
);
add(
  "tape-gauge",
  "TapeGauge",
  [
    {
      value: 142,
      rate: 1,
      zones: [
        { from: 100, to: 130, tone: "pos" },
        { from: 130, to: 150, tone: "warn" },
        { from: 150, to: 200, tone: "neg" },
      ],
      span: 60,
    },
    {
      value: 142,
      rate: -1,
      zones: [{ from: 130, to: 150, tone: "warn" }],
      span: 60,
      orientation: "horizontal",
    },
  ],
  [
    [46, 60],
    [160, 30],
  ],
);
add(
  "station-glyph",
  "StationGlyph",
  [
    {
      station: "KSFO",
      cloud: 0.75,
      wind: { direction: 225, magnitude: 15 },
      temp: 16,
      dewpoint: 9,
      pressure: 1013,
      size: 34,
    },
    {
      station: "KJFK",
      cloud: 1,
      wind: { direction: 300, magnitude: 45 },
      temp: 4,
      dewpoint: 2,
      pressure: 988,
      size: 34,
    },
  ],
  [[999, 0]],
);

// BY-DESIGN exemptions: EventTimeline span labels render CENTERED INSIDE their
// span rects (plan/22 #27 — the rect is the label's home, at 0.7 fill opacity).
const ALLOWED = (line) =>
  /^event-timeline .*TEXT-ON-MARK "(Freeze|Healthy|[^"]*)" over rect/.test(line) ||
  // TraceFold spans + PartitionStrip segments label INSIDE their rects with
  // on-fill ink (plan/25 §13/§18) — the rect is the label's home. (Previously
  // invisible to the gate via a data-mc-ink="band" attr the superaudit removed
  // as a role misuse.)
  /^(trace-fold|partition-strip) .*TEXT-ON-MARK "[^"]*" over rect/.test(line) ||
  // TimeInRange zone percents render CENTERED INSIDE their zone rects with
  // on-fill ink (plan/25 §1) — the rect is the label's home.
  /^time-in-range .*TEXT-ON-MARK "\d+%" over rect/.test(line) ||
  // FillWord stacks an accent copy of the word ON the muted base — that exact
  // same-word overlap IS the "label is the bar" encoding, not a collision.
  /^fill-word .*TEXT-TEXT "([^"]+)" × "\1"$/.test(line) ||
  // The "NN%" hugs the word using its REAL extent (~0.56 em/char); the craft
  // 0.62 over-estimate reads a phantom overlap that the browser sweep disproves.
  /^fill-word .*TEXT-TEXT "[^"]+" × "\d+%"$/.test(line);

let total = 0,
  bad = 0;
const problems = [];
for (const c of CASES) {
  const M = await D(c.slug);
  const Comp = M[c.comp];
  for (const v of c.variants) {
    for (const [w, hgt] of c.sizes) {
      const props = { ...(c.slug === "sparkline" ? { data: WAVE } : {}), ...v };
      if (w !== 999) {
        props.width = w;
        props.height = hgt;
      }
      total++;
      try {
        const label = `${c.slug} ${JSON.stringify(v).slice(0, 50)} @${w === 999 ? "default" : w + "x" + hgt}`;
        const svg = render(Comp, props);
        const issues = [...audit(label, svg), ...geometryAudit(label, svg)];
        const real = issues.filter((i) => !ALLOWED(i));
        if (real.length) {
          bad++;
          problems.push(...real);
        }
      } catch (e) {
        bad++;
        problems.push(`${c.slug}: RENDER ERROR ${e.message}`);
      }
    }
  }
}

// annotations text (Threshold/Marker/Callout labels on a Sparkline host)
{
  const { Sparkline } = await import("../../dist/charts/sparkline/index.js");
  const A = await import("../../dist/annotations.js");
  const { createElement: hh } = await import("react");
  for (const [w, hgt] of [
    [60, 16],
    [120, 24],
    [220, 32],
  ]) {
    total++;
    const html = render(Sparkline, {
      data: WAVE,
      width: w,
      height: hgt,
      children: [
        hh(A.Threshold, { key: "t", y: 16, label: "SLA" }),
        hh(A.Marker, { key: "m", x: 3, label: "launch" }),
        hh(A.Callout, { key: "c", x: 9, label: "peak" }),
        hh(A.TargetZone, { key: "z", y: [13, 15], label: "goal" }),
      ],
    });
    const issues = audit(`sparkline+annotations @${w}x${hgt}`, html).filter((i) => !ALLOWED(i));
    if (issues.length) {
      bad++;
      problems.push(...issues);
    }
  }
}
{
  const { HeatCell } = await import("../../dist/charts/heat-cell/index.js");
  total++;
  const issues = audit(
    "heat-cell value label",
    render(HeatCell, { value: 72, domain: [0, 100], label: "value" }),
  );
  // in-cell value label is by-design ON the cell — only escapes/text-text count
  const real = issues.filter((i) => !i.includes("TEXT-ON-MARK"));
  if (real.length) {
    bad++;
    problems.push(...real);
  }
}
console.log(`${total} configs, ${bad} with issues`);

console.log(problems.join("\n"));
