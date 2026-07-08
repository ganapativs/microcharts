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
];
