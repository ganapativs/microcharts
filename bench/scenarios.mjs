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
  Array.from({ length: 24 }, (_, i) => Math.sin((i + s) / 3) * 10 + i),
);
const grids = Array.from({ length: POOL }, (_, s) =>
  Array.from({ length: 35 }, (_, j) => (s + j) % 5),
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
];
