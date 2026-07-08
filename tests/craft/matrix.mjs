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

// BY-DESIGN exemptions: EventTimeline span labels render CENTERED INSIDE their
// span rects (plan/22 #27 — the rect is the label's home, at 0.7 fill opacity).
const ALLOWED = (line) =>
  /^event-timeline .*TEXT-ON-MARK "(Freeze|Healthy|[^"]*)" over rect/.test(line);

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
