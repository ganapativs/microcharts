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
const DIFF_KEYS = ["users", "orders", "items", "tags", "notes", "flags"];
const diffs = Array.from({ length: POOL }, (_, s) =>
  DIFF_KEYS.map((key, j) => ({
    key,
    added: ((s + 1) * (j + 2) * 29) % 400,
    removed: ((s + 2) * (j + 1) * 17) % 300,
  })),
);
const quads = Array.from({ length: POOL }, (_, s) =>
  Array.from({ length: 14 }, (_p, j) => ({ x: ((s + j) * 7) % 10, y: ((s + j) * 13) % 10 })),
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
  {
    slug: "error-budget",
    component: "ErrorBudget",
    floor: 12, // diagonal + wedges + line + per-step rate loop — few nodes
    props: (i) => ({
      data: rugs[i % POOL].map((_, k, a) => Math.max(0, 1 - k / a.length)),
      window: 30,
      summary: false,
    }),
  },
  {
    slug: "control-strip",
    component: "ControlStrip",
    floor: 12, // band + line + per-point out-test + MR estimator
    props: (i) => ({ data: rugs[i % POOL].map((v) => v * 10 + 40), rules: "we", summary: false }),
  },
  {
    slug: "pareto-strip",
    component: "ParetoStrip",
    floor: 20, // ≤ 12 bars + cum line + sort — few nodes
    props: (i) => ({ data: cats[i % POOL], summary: false }),
  },
  {
    slug: "data-diff",
    component: "DataDiff",
    floor: 20, // ≤ 12 rows × 2 bars + hairline — few nodes, one linear pass
    props: (i) => ({ data: diffs[i % POOL], summary: false }),
  },
  {
    slug: "ensemble-ghosts",
    component: "EnsembleGhosts",
    floor: 12, // ≤12 ghost paths + median/nearest-median scan over the ensemble
    props: (i) => ({
      data: Array.from({ length: 24 }, (_, m) => waves[(i + m) % POOL].slice(0, 12)),
      summary: false,
    }),
  },
  {
    slug: "change-point",
    component: "ChangePoint",
    floor: 12, // detector: O(n²) binary segmentation over ≤500 pts, still cheap
    props: (i) => ({ data: waves[i % POOL].map((v, j) => v + (j > 250 ? 30 : 0)), summary: false }),
  },
  {
    slug: "cycle-plot",
    component: "CyclePlot",
    floor: 20, // ≤ 12 slots × (line + tick) + spine; one bucketing pass
    props: (i) => ({ data: waves[i % POOL], period: 7, summary: false }),
  },
  {
    slug: "quadrant-dot",
    component: "QuadrantDot",
    floor: 20, // ≤ 5 + 1/ghost (cap 30) glyph; extent + one sort per render
    props: (i) => ({
      data: { x: (i * 3) % 10, y: (i * 7) % 10 },
      field: quads[i % POOL],
      xDomain: [0, 10],
      domain: [0, 10],
      summary: false,
    }),
  },
  {
    slug: "shift-histogram",
    component: "ShiftHistogram",
    floor: 6, // ≤ 12 bins × 2 + double binning + medians (measured ~13 rows/ms, half-floor)
    props: (i) => ({
      data: {
        before: rugs[i % POOL].map((v) => v * 10 + 40),
        after: rugs[(i + 1) % POOL].map((v) => v * 10 + 30),
      },
      summary: false,
    }),
  },
  {
    slug: "ab-strips",
    component: "ABStrips",
    floor: 20, // 2 rows × (2 bands + median) + quantiles — few nodes
    props: (i) => ({
      data: { a: rugs[i % POOL], b: rugs[(i + 1) % POOL].map((v) => v + 1) },
      summary: false,
    }),
  },
  {
    slug: "quantile-dots",
    component: "QuantileDots",
    floor: 6, // 20 dot nodes/render — N-node class, per-dot loop
    props: (i) => ({ data: rugs[i % POOL], threshold: 5, summary: false }),
  },
  {
    slug: "forecast-cone",
    component: "ForecastCone",
    floor: 10, // 2 band polygons + history + mid — few nodes, per-point loop
    props: (i) => {
      const src = rugs[i % POOL];
      const hist = src.slice(0, 20).map((v) => v * 5 + 30);
      const mid = src.slice(20).map((v) => v * 5 + 42);
      const p80 = mid.map((v, j) => [v - 4 - j, v + 4 + j]);
      return { data: hist, forecast: { mid, p80 }, summary: false };
    },
  },
  {
    slug: "tally-marks",
    component: "TallyMarks",
    floor: 40, // one merged path, one pass over ≤ max strokes — trivially cheap
    props: (i) => ({ value: (i % 30) + 1, summary: false }),
  },
  {
    slug: "dice-pips",
    component: "DicePips",
    floor: 40, // ≤ 7 nodes, constant pip-layout lookup — trivially cheap
    props: (i) => ({ value: i % 7, summary: false }),
  },
  {
    slug: "fill-word",
    component: "FillWord",
    floor: 40, // 2 text nodes + a clip inset — no per-point work
    props: (i) => ({ word: "processing", value: (i % 100) / 100, summary: false }),
  },
  {
    slug: "fat-digits",
    component: "FatDigits",
    floor: 40, // one text node + a tier lookup — a cached formatter call
    props: (i) => ({ value: (i * 37) % 2100, domain: [0, 2100], summary: false }),
  },
  {
    slug: "thermometer",
    component: "Thermometer",
    floor: 30, // ≤ 6 nodes, one linear scale + a few ticks
    props: (i) => ({ value: i % 100, target: 80, summary: false }),
  },
  {
    slug: "moon-phase",
    component: "MoonPhase",
    floor: 40, // 3 nodes, a closed-form terminator path — trivially cheap
    props: (i) => ({ value: (i % 100) / 100, summary: false }),
  },
  {
    slug: "hourglass",
    component: "Hourglass",
    floor: 40, // 4 nodes, two area-true closed forms — trivially cheap
    props: (i) => ({ value: (i % 100) / 100, summary: false }),
  },
  {
    slug: "balance-beam",
    component: "BalanceBeam",
    floor: 40, // ≤ 6 nodes, one rotation + two √ weights — trivially cheap
    props: (i) => ({
      data: [
        { label: "A", value: (i % 90) + 10 },
        { label: "B", value: ((i * 3) % 90) + 10 },
      ],
      summary: false,
    }),
  },
  {
    slug: "sprout-row",
    component: "SproutRow",
    floor: 20, // one glyph path per item (≤ 12) + soil
    props: (i) => ({
      data: Array.from({ length: 8 }, (_, j) => ({ label: `#${j}`, value: (i + j) % 4 })),
      summary: false,
    }),
  },
  {
    slug: "garden-grid",
    component: "GardenGrid",
    floor: 6, // one circle per cell — N-node class, per-cell loop
    props: (i) => ({ data: rugs[i % POOL].map((v) => Math.round(v * 5)), summary: false }),
  },
  {
    slug: "bubble-row",
    component: "BubbleRow",
    floor: 15, // ≤ 8 bubbles + per-bubble format + greedy label layout (measured ~26)
    props: (i) => ({
      data: rugs[i % POOL]
        .slice(0, 6)
        .map((v, j) => ({ label: `#${j}`, value: Math.abs(v) * 100 })),
      summary: false,
    }),
  },
  {
    slug: "music-staff",
    component: "MusicStaff",
    floor: 15, // ≤ 16 notes + describeSeries (seriesStats) summary
    props: (i) => ({
      data: rugs[i % POOL].slice(0, 12).map((v) => Math.round(v * 5)),
      summary: false,
    }),
  },
  {
    slug: "tree-rings",
    component: "TreeRings",
    floor: 10, // ≤ 24 boundary circles + cumulative-radius pass
    props: (i) => ({ data: rugs[i % POOL].map((v) => Math.abs(v) + 1), summary: false }),
  },
  {
    slug: "city-skyline",
    component: "CitySkyline",
    floor: 10,
    props: (i) => ({
      data: cats[i % POOL].map((c, j) => ({
        label: c.label,
        value: c.value % 60,
        lit: (j % 5) / 5,
      })),
      summary: false,
    }),
  },
  {
    slug: "honeycomb",
    component: "Honeycomb",
    floor: 40, // 2 merged paths, one hex loop
    props: (i) => ({ value: (i % 40) + 1, total: 40, summary: false }),
  },
  {
    slug: "constellation",
    component: "Constellation",
    floor: 20, // scale + jitter + per-event circle
    props: (i) => ({
      data: Array.from({ length: 10 }, (_, j) => ({
        x: j,
        y: ((i + j * 7) % 50) + 1,
        m: (j % 5) + 1,
      })),
      summary: false,
    }),
  },
  {
    slug: "polar-clock",
    component: "PolarClock",
    floor: 8, // 24 annulus sectors + guide
    props: (i) => ({
      data: Array.from({ length: 24 }, (_, h) => ((i + h * 5) % 100) + 1),
      now: i % 24,
      summary: false,
    }),
  },
  {
    slug: "spiral-year",
    component: "SpiralYear",
    floor: 6, // 52 marks grouped into ≤5 paths + month ticks
    props: (i) => ({
      data: Array.from({ length: 52 }, (_, w) => ((i + w * 3) % 100) + 1),
      size: 48,
      summary: false,
    }),
  },
  {
    slug: "breathing-dot",
    component: "BreathingDot",
    floor: 120, // two circles + a threshold branch
    props: (i) => ({ value: (i % 100) / 100, summary: false }),
  },
  {
    slug: "heartbeat-blip",
    component: "HeartbeatBlip",
    floor: 40, // baseline + a spike glyph per event
    props: (i) => ({
      data: Array.from({ length: 12 }, (_, k) => 100000 - k * 4000 - (i % 500)),
      now: 100000,
      summary: false,
    }),
  },
  {
    slug: "comet-trail",
    component: "CometTrail",
    floor: 12, // a circle per trail point + head + per-point format
    props: (i) => ({
      data: Array.from({ length: 13 }, (_, k) => ((i + k * 4) % 100) + 1),
      summary: false,
    }),
  },
  {
    slug: "orbit-status",
    component: "OrbitStatus",
    floor: 80, // three circles + a scale + dash math
    props: (i) => ({
      latency: (i % 500) + 1,
      rate: i % 20,
      latencyDomain: [0, 500],
      rateDomain: [0, 20],
      summary: false,
    }),
  },
  {
    slug: "time-in-range",
    component: "TimeInRange",
    floor: 40, // a handful of rects + a label
    props: (i) => ({
      data: {
        severeBelow: 1,
        below: (i % 15) + 1,
        in: 60 + (i % 25),
        above: (i % 15) + 1,
        severeAbove: 1,
      },
      summary: false,
    }),
  },
];
