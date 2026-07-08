// Per-chart bench scenario registry (plan/21 §6.0.D). Batches add one entry per
// chart — `run.mjs` measures each against its SSR floor (plan/07). Datasets are
// PRE-COMPUTED pools (data generation must not pollute the render timing) and
// deterministic (no Math.random — reproducible numbers).
//
// Floors: the ~50 rows/ms plan/07 number was calibrated on the single-path
// sparkline scenario. Node count dominates SSR cost, so N-node charts carry
// their own regression floor, set at ~half of the measured 2026-07-08 baseline
// (bench/results.json) — a tripwire against regressions, not an aspiration.

const POOL = 7;

const waves = Array.from({ length: POOL }, (_, s) =>
  Array.from({ length: 24 }, (_w, i) => Math.sin((i + s) / 3) * 10 + i),
);
const grids = Array.from({ length: POOL }, (_, s) =>
  Array.from({ length: 35 }, (_g, j) => (s + j) % 5),
);
const rugs = Array.from({ length: POOL }, (_, s) =>
  Array.from({ length: 38 }, (_r, j) => ((s * 7 + j * 13) % 97) / 10),
);
const CAT_LABELS = ["East", "West", "South", "North", "Mid", "Apex"];
const cats = Array.from({ length: POOL }, (_, s) =>
  CAT_LABELS.map((label, j) => ({ label, value: ((s + 1) * (j + 3) * 37) % 950 })),
);
const bursts = Array.from({ length: POOL }, (_, s) =>
  Array.from({ length: 40 }, (_b, j) => ((s + j) % 9 === 0 ? (j % 7) + 1 : 0)),
);

export const SCENARIOS = [
  {
    slug: "sparkline",
    component: "Sparkline",
    floor: 50,
    props: (i) => ({ data: waves[i % POOL], summary: false }),
  },
  {
    slug: "sparkbar",
    component: "SparkBar",
    floor: 7, // 24 rects/row (measured ~14 rows/ms, 2026-07-08)
    props: (i) => ({ data: waves[i % POOL], summary: false }),
  },
  {
    slug: "delta",
    component: "Delta",
    floor: 50,
    props: (i) => ({ value: (i % 50) / 100 - 0.2, summary: false }),
  },
  {
    slug: "bullet",
    component: "Bullet",
    floor: 30, // 5–6 nodes/row (measured ~59 rows/ms, 2026-07-08)
    props: (i) => ({ value: i % 100, target: 80, bands: [50, 90], summary: false }),
  },
  {
    slug: "activity-grid",
    component: "ActivityGrid",
    floor: 5, // 35 cells/row (measured ~9 rows/ms, 2026-07-08)
    props: (i) => ({ data: grids[i % POOL], summary: false }),
  },
  {
    slug: "trend-arrow",
    component: "TrendArrow",
    floor: 50,
    props: (i) => ({ value: (i % 50) / 100 - 0.2, showValue: true, summary: false }),
  },
  {
    slug: "status-dot",
    component: "StatusDot",
    floor: 50,
    props: (i) => ({ status: ["ok", "warn", "error", "off", "busy"][i % 5], summary: false }),
  },
  {
    slug: "heat-cell",
    component: "HeatCell",
    floor: 50,
    props: (i) => ({ value: (i % 10) / 10, summary: false }),
  },
  {
    slug: "progress",
    component: "Progress",
    floor: 40, // 3–4 nodes + label text per row
    props: (i) => ({ value: (i % 100) / 100, summary: false }),
  },
  {
    slug: "rug-strip",
    component: "RugStrip",
    floor: 15, // 38 ticks grouped + sorted per row
    props: (i) => ({ data: rugs[i % POOL], summary: false }),
  },
  {
    slug: "mini-bar",
    component: "MiniBar",
    floor: 25, // ≤ 8 rects per row
    props: (i) => ({ data: cats[i % POOL], summary: false }),
  },
  {
    slug: "pictogram-row",
    component: "PictogramRow",
    floor: 30, // ≤ 8 unit glyphs + partial path
    props: (i) => ({ value: (i % 17) / 2, total: 8, summary: false }),
  },
  {
    slug: "seismogram",
    component: "Seismogram",
    floor: 25, // one tick path over 40 slots
    props: (i) => ({ data: bursts[i % POOL], summary: false }),
  },
  {
    slug: "heat-strip",
    component: "HeatStrip",
    floor: 10, // 30 cells/row
    props: (i) => ({
      data: waves[i % POOL].concat(waves[(i + 1) % POOL].slice(0, 6)),
      summary: false,
    }),
  },
  {
    slug: "dot-plot",
    component: "DotPlot",
    floor: 20, // 5 rows × (dot + label text)
    props: (i) => ({ data: cats[i % POOL].slice(0, 5), summary: false }),
  },
  {
    slug: "dumbbell",
    component: "Dumbbell",
    floor: 20, // ≤ 5 rows × 3 nodes + label
    props: (i) => ({
      data: cats[i % POOL].slice(0, 4).map((d) => ({
        label: d.label,
        from: d.value,
        to: (d.value * 1.3) % 950,
      })),
      summary: false,
    }),
  },
  {
    slug: "paired-bars",
    component: "PairedBars",
    floor: 25, // 2 rects per pair, ≤ 5 pairs
    props: (i) => ({
      data: cats[i % POOL].slice(0, 4).map((d) => ({
        label: d.label,
        value: d.value,
        ref: (d.value * 1.2) % 950,
      })),
      summary: false,
    }),
  },
  {
    slug: "slope",
    component: "Slope",
    floor: 20, // ≤ 7 lines + endpoint dots
    props: (i) => ({
      data: cats[i % POOL].slice(0, 5).map((d) => ({
        label: d.label,
        from: d.value,
        to: (d.value * 1.4) % 950,
      })),
      summary: false,
    }),
  },
  {
    slug: "segmented-bar",
    component: "SegmentedBar",
    floor: 25, // ≤ 5 rects + rollup math
    props: (i) => ({ data: cats[i % POOL], summary: false }),
  },
  {
    slug: "histogram-strip",
    component: "HistogramStrip",
    floor: 15, // ≤ 12 bars + binning per row
    props: (i) => ({ data: rugs[i % POOL], summary: false }),
  },
  {
    slug: "micro-box",
    component: "MicroBox",
    floor: 20, // 4 marks + quantiles per row
    props: (i) => ({ data: rugs[i % POOL], summary: false }),
  },
  {
    slug: "progress-ring",
    component: "ProgressRing",
    floor: 40, // 2 arc paths
    props: (i) => ({ value: (i % 100) / 100, summary: false }),
  },
  {
    slug: "micro-donut",
    component: "MicroDonut",
    floor: 30, // ≤ 4 sector paths + rollup
    props: (i) => ({ data: cats[i % POOL].slice(0, 4), summary: false }),
  },
  {
    slug: "funnel",
    component: "Funnel",
    floor: 25, // ≤ 6 rects + slats
    props: (i) => ({
      data: cats[i % POOL].slice(0, 4).map((d, j) => ({
        label: d.label,
        value: Math.round(d.value / (j + 1)),
      })),
      summary: false,
    }),
  },
  {
    slug: "likert-strip",
    component: "LikertStrip",
    floor: 25, // ≤ 7 rects + diverging stack
    props: (i) => ({ data: cats[i % POOL].slice(0, 5), summary: false }),
  },

  {
    slug: "micro-scatter",
    component: "MicroScatter",
    floor: 5, // 24 dot nodes/row (measured ~9 rows/ms — N-node class, half-of-measured floor)
    props: (i) => ({
      data: rugs[i % POOL].map((v, j) => ({ x: j, y: v })),
      trend: true,
      summary: false,
    }),
  },

  {
    slug: "waterfall",
    component: "Waterfall",
    floor: 10, // ≤ 7 rects + connectors + running-level math (measured ~21.8 rows/ms — half-of-measured floor)
    props: (i) => ({
      data: cats[i % POOL].map((d, j) => ({
        label: d.label,
        value: j % 2 === 0 ? d.value : -Math.round(d.value / 2),
      })),
      summary: false,
    }),
  },
  {
    slug: "bump-strip",
    component: "BumpStrip",
    floor: 9, // 24 pts: path + change dots + end labels (measured ~18.5 rows/ms — half-of-measured floor)
    props: (i) => ({
      data: waves[i % POOL].map((v) => (Math.abs(Math.round(v)) % 8) + 1),
      summary: false,
    }),
  },
  {
    slug: "dual-sparkline",
    component: "DualSparkline",
    floor: 30, // 2 paths + endpoint dots, one shared domain
    props: (i) => ({
      data: waves[i % POOL],
      compare: waves[(i + 1) % POOL],
      summary: false,
    }),
  },
  {
    slug: "stacked-area",
    component: "StackedArea",
    floor: 15, // 3 area paths + per-x share stacking
    props: (i) => ({
      data: [
        { label: "A", values: waves[i % POOL].map((v) => Math.abs(v) + 1) },
        { label: "B", values: waves[(i + 1) % POOL].map((v) => Math.abs(v) + 1) },
        { label: "C", values: waves[(i + 2) % POOL].map((v) => Math.abs(v) + 1) },
      ],
      summary: false,
    }),
  },
  {
    slug: "ohlc",
    component: "Ohlc",
    floor: 8, // 20 periods × ~2 nodes each — N-node class
    props: (i) => ({
      data: waves[i % POOL].slice(0, 20).map((v, j) => ({
        open: v + 10,
        high: v + 12 + (j % 3),
        low: v + 8 - (j % 2),
        close: v + 9 + (j % 4),
      })),
      summary: false,
    }),
  },
  {
    slug: "horizon",
    component: "Horizon",
    floor: 20, // ≤ 3 fold paths + fold math per row
    props: (i) => ({ data: waves[i % POOL], summary: false }),
  },

  {
    slug: "calendar-strip",
    component: "CalendarStrip",
    floor: 5, // 28 date-keyed cells + UTC grid math — N-node class
    props: (i) => ({
      data: Array.from({ length: 20 }, (_c, j) => ({
        date: `2026-06-${String(1 + ((i * 3 + j) % 28)).padStart(2, "0")}`,
        value: (i + j) % 5,
      })),
      end: "2026-06-28",
      summary: false,
    }),
  },
  {
    slug: "event-timeline",
    component: "EventTimeline",
    floor: 15, // ≤ 12 spans/diamonds + interval merging
    props: (i) => ({
      data: Array.from({ length: 8 }, (_e, j) => ({
        start: j * 10 + (i % 3),
        end: j % 3 === 0 ? undefined : j * 10 + 6,
      })),
      domain: [0, 80],
      summary: false,
    }),
  },

  {
    slug: "coverage-strip",
    component: "CoverageStrip",
    floor: 8, // ≤ 120 cells, one rect each — N-node class
    props: (i) => ({
      data: Array.from({ length: 40 }, (_c, j) => ((i + j) % 4 === 0 ? null : (i + j) % 9)),
      summary: false,
    }),
  },
  {
    slug: "benchmark-strip",
    component: "BenchmarkStrip",
    floor: 30, // ≤ 6 nodes + quantile pass
    props: (i) => ({ data: rugs[i % POOL], value: 4 + (i % 5), summary: false }),
  },
  {
    slug: "percentile-ladder",
    component: "PercentileLadder",
    floor: 25, // ≤ 8 nodes + quantile pass
    props: (i) => ({ data: rugs[i % POOL], summary: false }),
  },
  {
    slug: "graded-band",
    component: "GradedBand",
    floor: 25, // ≤ 6 nodes + nested quantiles
    props: (i) => ({ data: rugs[i % POOL], summary: false }),
  },
  {
    slug: "icon-array",
    component: "IconArray",
    floor: 7, // 20 units/render — N-node class (measured ~15 rows/ms, half-floor)
    props: (i) => ({ value: (i % 20) / 20, of: 20, summary: false }),
  },
  {
    slug: "rate-volume",
    component: "RateVolume",
    floor: 3, // 1 bar + object alloc/period — N-node class (measured ~7.6 rows/ms, half-floor)
    props: (i) => ({
      data: rugs[i % POOL].map((v, k) => ({ rate: v, volume: 40 + ((k * 7) % 120) })),
      minVolume: 50,
      summary: false,
    }),
  },
  {
    slug: "net-flow",
    component: "NetFlow",
    floor: 8, // 2 area paths + net line — few nodes, per-period point loop
    props: (i) => ({
      data: rugs[i % POOL].map((v, k) => ({ in: Math.abs(v), out: Math.abs(v) * 0.7 + (k % 5) })),
      summary: false,
    }),
  },
  {
    slug: "retention-curve",
    component: "RetentionCurve",
    floor: 12, // step line + plateau scan — few nodes, per-period point loop
    props: (i) => ({
      data: rugs[i % POOL].map((v, k) =>
        Math.max(0, 1 - k / rugs[i % POOL].length - (v % 3) * 0.02),
      ),
      summary: false,
    }),
  },
  {
    slug: "burn-chart",
    component: "BurnChart",
    floor: 10, // plan + actual + projection + fit — few nodes, per-period loop
    props: (i) => {
      const src = rugs[i % POOL];
      const total = src.length;
      const plan = Array.from({ length: total }, (_, k) => Math.max(0, total - k));
      const actual = src
        .slice(0, Math.ceil(total / 2))
        .map((v, k) => Math.max(0, total - k * 0.7 + (v % 3)));
      return { data: { plan, actual }, summary: false };
    },
  },
];
