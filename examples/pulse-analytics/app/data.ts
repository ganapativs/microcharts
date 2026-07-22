// Mock product-analytics data for the "Pulse" example app.
// Believable SaaS numbers: DAU counts, MRR dollars, funnel stages, feature usage.
// Pure data module — safe to import from Server Components. Everything here is
// authored or generated once at module load (seeded PRNG), never per render.

export const usd = {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
} as const;

export const usdCents = {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
} as const;

export const compact = { notation: "compact", maximumFractionDigits: 1 } as const;

export const pct = { style: "percent", maximumFractionDigits: 1 } as const;

export const pct0 = { style: "percent", maximumFractionDigits: 0 } as const;

export const ms = { maximumFractionDigits: 0 } as const;

// ---- Seeded deterministic generators (computed once) ----

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** N normally-distributed samples, 2-dp rounded, from a fixed seed. */
function sample(n: number, mean: number, sd: number, seed: number): number[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => Math.round((mean + gaussian(rng) * sd) * 100) / 100);
}

// ---- Overview: KPI series ----

/** ~20 weeks (140 days) of daily active users, gently trending up with a weekly rhythm. */
export const dau: number[] = (() => {
  const out: number[] = [];
  let base = 4200;
  for (let i = 0; i < 140; i++) {
    base += 9 + Math.sin(i / 11) * 6;
    const weekday = i % 7;
    const weekendDip = weekday === 5 || weekday === 6 ? 0.72 : 1;
    const wobble = Math.sin(i * 1.7) * 140 + Math.cos(i * 0.6) * 90;
    out.push(Math.round((base + wobble) * weekendDip));
  }
  return out;
})();

/** Last-30-day sparkline windows for the KPI cards. */
export const dauSpark = dau.slice(-30);

export const mrrSpark = [
  61200, 61800, 62400, 62100, 63300, 64000, 64600, 65200, 66100, 66800, 67400, 68200, 69000, 69800,
  70600, 71500, 72400, 73200, 74100, 75000,
];

export const signupsSpark = [
  180, 172, 195, 210, 188, 176, 204, 233, 219, 241, 256, 248, 267, 279, 262, 288, 301, 294, 312,
  329,
];

export const churnSpark = [
  3.4, 3.5, 3.3, 3.2, 3.4, 3.1, 3.0, 3.2, 2.9, 3.0, 2.8, 2.9, 2.7, 2.8, 2.6, 2.7, 2.5, 2.6, 2.4,
  2.3,
];

export interface Kpi {
  key: string;
  label: string;
  value: number;
  display: string;
  from: number;
  positive: "up" | "down";
  spark: number[];
}

export const kpis: Kpi[] = [
  {
    key: "dau",
    label: "Daily active users",
    value: dauSpark[dauSpark.length - 1],
    display: dauSpark[dauSpark.length - 1].toLocaleString("en-US"),
    from: dauSpark[0],
    positive: "up",
    spark: dauSpark,
  },
  {
    key: "mrr",
    label: "Monthly recurring revenue",
    value: 75000,
    display: "$75.0k",
    from: 61200,
    positive: "up",
    spark: mrrSpark,
  },
  {
    key: "signups",
    label: "New signups",
    value: 329,
    display: "329",
    from: 180,
    positive: "up",
    spark: signupsSpark,
  },
  {
    key: "churn",
    label: "Monthly churn",
    value: 2.3,
    display: "2.3%",
    from: 3.4,
    positive: "down",
    spark: churnSpark,
  },
];

/** Goal progress: MRR against the quarterly target. */
export const mrrGoal = { value: 75000, target: 90000, bands: [60000, 80000] };

/** Headline numeric for the FatDigits hero — events tracked this month. */
export const eventsTracked = 48_216_400;

/** Onboarding activation: activated of signed-up, this cohort. */
export const activation = { value: 3980, max: 6420 };

/** Share of active accounts that have adopted Alerts (for the IconArray). */
export const alertsAdoption = 0.72;

/** Weekly activation rate over its signup volume — for RateVolume. */
export const activationRateVolume: { rate: number; volume: number }[] = [
  { rate: 0.58, volume: 176 },
  { rate: 0.6, volume: 188 },
  { rate: 0.59, volume: 204 },
  { rate: 0.61, volume: 219 },
  { rate: 0.62, volume: 233 },
  { rate: 0.6, volume: 241 },
  { rate: 0.63, volume: 256 },
  { rate: 0.64, volume: 248 },
  { rate: 0.63, volume: 267 },
  { rate: 0.65, volume: 279 },
  { rate: 0.66, volume: 301 },
  { rate: 0.67, volume: 329 },
];

/** Signups vs. churned users per week — for NetFlow (in = signups, out = churn). */
export const userFlow: { in: number; out: number }[] = [
  { in: 176, out: 62 },
  { in: 188, out: 58 },
  { in: 204, out: 71 },
  { in: 219, out: 55 },
  { in: 233, out: 64 },
  { in: 241, out: 49 },
  { in: 256, out: 58 },
  { in: 248, out: 52 },
  { in: 267, out: 47 },
  { in: 279, out: 54 },
  { in: 301, out: 44 },
  { in: 329, out: 41 },
];

/** Why new users abandon onboarding — long-tail, for ParetoStrip. */
export const dropoffReasons = [
  { label: "Slow first value", value: 2840 },
  { label: "Confusing setup", value: 2110 },
  { label: "No team invited", value: 1520 },
  { label: "Missing integration", value: 980 },
  { label: "Priced out", value: 760 },
  { label: "Import failed", value: 540 },
  { label: "Chose competitor", value: 430 },
  { label: "No clear use case", value: 320 },
];

/** Support backlog (open tickets) per day for 3 weeks, with a WIP capacity. */
export const supportBacklog = [
  34, 38, 41, 37, 44, 52, 49, 55, 61, 58, 53, 47, 44, 51, 62, 68, 71, 64, 55, 48, 42,
];
export const supportCapacity = 50;

/** Traffic acquisition sources (share of new sessions). */
export const trafficSources = [
  { label: "Organic", value: 4820 },
  { label: "Direct", value: 3110 },
  { label: "Referral", value: 1640 },
  { label: "Paid", value: 1180 },
  { label: "Social", value: 720 },
];

// ---- Revenue route ----

export interface AccountRow {
  account: string;
  short: string;
  plan: string;
  mrr: number;
  from: number;
  trend: number[];
  /** Product-usage split for the in-row MiniBar. */
  mix: { label: string; value: number }[];
  /** Growth-stage 0–3 for the SproutRow maturity read. */
  maturity: 0 | 1 | 2 | 3;
  /** Activation fraction 0–1 — lit windows in the CitySkyline. */
  activation: number;
  /** Weekly active users in the account. */
  wau: number;
}

export const accounts: AccountRow[] = [
  {
    account: "Northwind Labs",
    short: "Northwind",
    plan: "Enterprise",
    mrr: 12400,
    from: 11200,
    trend: [11200, 11400, 11350, 11800, 12000, 12100, 12400],
    mix: [
      { label: "Dashboards", value: 61 },
      { label: "Alerts", value: 27 },
      { label: "Reports", value: 12 },
    ],
    maturity: 3,
    activation: 0.86,
    wau: 1840,
  },
  {
    account: "Meridian Health",
    short: "Meridian",
    plan: "Enterprise",
    mrr: 9800,
    from: 10200,
    trend: [10200, 10100, 9900, 9950, 9800, 9850, 9800],
    mix: [
      { label: "Dashboards", value: 44 },
      { label: "Alerts", value: 38 },
      { label: "Reports", value: 18 },
    ],
    maturity: 2,
    activation: 0.63,
    wau: 1210,
  },
  {
    account: "Cobalt Studio",
    short: "Cobalt",
    plan: "Growth",
    mrr: 4200,
    from: 3600,
    trend: [3600, 3700, 3850, 3900, 4050, 4100, 4200],
    mix: [
      { label: "Dashboards", value: 52 },
      { label: "Alerts", value: 31 },
      { label: "Reports", value: 17 },
    ],
    maturity: 3,
    activation: 0.78,
    wau: 690,
  },
  {
    account: "Fernwood Co-op",
    short: "Fernwood",
    plan: "Growth",
    mrr: 3100,
    from: 3050,
    trend: [3050, 3080, 3020, 3060, 3090, 3100, 3100],
    mix: [
      { label: "Dashboards", value: 58 },
      { label: "Alerts", value: 22 },
      { label: "Reports", value: 20 },
    ],
    maturity: 2,
    activation: 0.55,
    wau: 430,
  },
  {
    account: "Atlas Freight",
    short: "Atlas",
    plan: "Growth",
    mrr: 2750,
    from: 2400,
    trend: [2400, 2500, 2480, 2600, 2650, 2700, 2750],
    mix: [
      { label: "Dashboards", value: 47 },
      { label: "Alerts", value: 41 },
      { label: "Reports", value: 12 },
    ],
    maturity: 2,
    activation: 0.6,
    wau: 380,
  },
  {
    account: "Solace Apps",
    short: "Solace",
    plan: "Starter",
    mrr: 890,
    from: 1200,
    trend: [1200, 1150, 1080, 1010, 980, 940, 890],
    mix: [
      { label: "Dashboards", value: 71 },
      { label: "Alerts", value: 14 },
      { label: "Reports", value: 15 },
    ],
    maturity: 1,
    activation: 0.34,
    wau: 96,
  },
  {
    account: "Brightpath EDU",
    short: "Brightpath",
    plan: "Starter",
    mrr: 640,
    from: 500,
    trend: [500, 520, 560, 580, 600, 620, 640],
    mix: [
      { label: "Dashboards", value: 49 },
      { label: "Alerts", value: 33 },
      { label: "Reports", value: 18 },
    ],
    maturity: 1,
    activation: 0.42,
    wau: 128,
  },
];

/** MRR movement — signed deltas from last month's close. */
export const mrrMovement = [
  { label: "New", value: 8200 },
  { label: "Expansion", value: 5100 },
  { label: "Reactivation", value: 1200 },
  { label: "Contraction", value: -2400 },
  { label: "Churn", value: -3900 },
];

export const mrrStart = 66800;

/** MRR actual vs. plan over 12 months — for DualSparkline. */
export const mrrActual = [
  52000, 54200, 55800, 57100, 59400, 61200, 63000, 65200, 67400, 70600, 72400, 75000,
];
export const mrrPlan = [
  52000, 53500, 55000, 56500, 58200, 60000, 62000, 64200, 66500, 69000, 71500, 74000,
];

/** Signup → paid conversion funnel. */
export const signupFunnel = [
  { label: "Visited", value: 24800 },
  { label: "Signed up", value: 6420 },
  { label: "Activated", value: 3980 },
  { label: "Invited team", value: 2110 },
  { label: "Paid", value: 1290 },
];

// ---- Engagement route ----

/** Feature adoption over 16 weeks — three tracked features, stacked. */
export const featureAdoption = {
  labels: ["Dashboards", "Alerts", "Reports"],
  // Prussian-ink accent (matches --mc-accent) + valence green + amber — three
  // distinct categorical hues, legible in light and dark.
  colors: ["#2b5f85", "#0e7a5f", "#c2701d"],
  series: [
    {
      label: "Dashboards",
      values: [
        2400, 2500, 2650, 2720, 2810, 2900, 3050, 3160, 3240, 3350, 3480, 3560, 3690, 3780, 3900,
        4020,
      ],
    },
    {
      label: "Alerts",
      values: [
        900, 980, 1040, 1120, 1180, 1260, 1310, 1400, 1470, 1540, 1620, 1700, 1780, 1860, 1940,
        2030,
      ],
    },
    {
      label: "Reports",
      values: [400, 430, 470, 500, 540, 590, 640, 700, 760, 820, 890, 960, 1030, 1110, 1190, 1280],
    },
  ],
};

/** Feature rank over 8 weeks (1 = most-used). Each row is a BumpStrip. */
export const featureRanks: { name: string; ranks: number[] }[] = [
  { name: "Dashboards", ranks: [1, 1, 1, 1, 1, 1, 1, 1] },
  { name: "Alerts", ranks: [3, 3, 2, 2, 2, 2, 2, 2] },
  { name: "Reports", ranks: [2, 2, 3, 4, 4, 3, 3, 3] },
  { name: "API", ranks: [5, 4, 4, 3, 3, 4, 4, 4] },
  { name: "Exports", ranks: [4, 5, 5, 5, 5, 5, 5, 5] },
  { name: "Integrations", ranks: [6, 6, 6, 6, 6, 6, 6, 6] },
];

/** Monthly retention cohorts (ragged) — for CohortTriangle. */
export const cohorts: { label: string; values: number[] }[] = [
  { label: "Feb", values: [100, 68, 54, 47, 43, 41, 40] },
  { label: "Mar", values: [100, 65, 52, 45, 41, 39] },
  { label: "Apr", values: [100, 71, 58, 51, 47] },
  { label: "May", values: [100, 69, 56, 49] },
  { label: "Jun", values: [100, 74, 61] },
  { label: "Jul", values: [100, 76] },
];

/** Weekly cohort retention — fraction of the signup cohort still active. */
export const retention = [1.0, 0.62, 0.51, 0.45, 0.41, 0.39, 0.38, 0.375, 0.37];
export const retentionBenchmark = [1.0, 0.55, 0.42, 0.35, 0.3, 0.27, 0.25, 0.24, 0.235];

/** API p95 latency (ms), 24 hourly readings — a monitored metric for ControlStrip. */
export const apiLatency = (() => {
  const s = sample(24, 182, 9, 1337);
  s[16] = 231;
  s[17] = 224;
  return s.map((n) => Math.round(n));
})();

/** Error rate (%) that stepped up after a bad deploy at index 14 — for ChangePoint. */
export const errorRate = (() => {
  const before = sample(14, 0.8, 0.14, 4242);
  const after = sample(14, 1.9, 0.2, 9091);
  return [...before, ...after].map((n) => Math.max(0, Math.round(n * 100) / 100));
})();
export const errorRateBreak = 14;

export interface FeatureUsage {
  name: string;
  usage: number[];
  weekly: number;
  from: number;
  positive: "up" | "down";
}

export const featureUsage: FeatureUsage[] = [
  {
    name: "Dashboards",
    usage: [3350, 3480, 3560, 3690, 3780, 3900, 4020],
    weekly: 4020,
    from: 3350,
    positive: "up",
  },
  {
    name: "Alerts",
    usage: [1540, 1620, 1700, 1780, 1860, 1940, 2030],
    weekly: 2030,
    from: 1540,
    positive: "up",
  },
  {
    name: "Reports",
    usage: [820, 890, 960, 1030, 1110, 1190, 1280],
    weekly: 1280,
    from: 820,
    positive: "up",
  },
  {
    name: "Exports",
    usage: [640, 700, 690, 720, 710, 705, 700],
    weekly: 700,
    from: 640,
    positive: "up",
  },
  {
    name: "API calls",
    usage: [18200, 19100, 20400, 21800, 23100, 24600, 26200],
    weekly: 26200,
    from: 18200,
    positive: "up",
  },
  {
    name: "Integrations",
    usage: [210, 224, 231, 240, 248, 259, 271],
    weekly: 271,
    from: 210,
    positive: "up",
  },
];

// ---- Experiments route ----

export interface Experiment {
  name: string;
  hypothesis: string;
  status: "shipped" | "running" | "inconclusive";
  a: number[];
  b: number[];
  positive: "up" | "down";
  unit: string;
}

/** A/B experiments — conversion / activation rates per arm (percent points). */
export const experiments: Experiment[] = [
  {
    name: "Guided onboarding checklist",
    hypothesis: "A step-by-step checklist lifts activation.",
    status: "shipped",
    a: sample(48, 58, 6, 21),
    b: sample(48, 64, 6, 22),
    positive: "up",
    unit: "% activated",
  },
  {
    name: "Sticky upgrade nudge",
    hypothesis: "An in-app nudge lifts trial→paid conversion.",
    status: "running",
    a: sample(48, 4.2, 0.7, 31),
    b: sample(48, 4.7, 0.7, 32),
    positive: "up",
    unit: "% converted",
  },
  {
    name: "Simplified pricing page",
    hypothesis: "Fewer plans reduce checkout drop-off.",
    status: "inconclusive",
    a: sample(48, 3.1, 0.8, 41),
    b: sample(48, 3.2, 0.8, 42),
    positive: "up",
    unit: "% checkout",
  },
];

/** Page-load time (ms) before/after the perf fix — for ShiftHistogram. */
export const perfShift = {
  before: sample(80, 2380, 360, 71).map((n) => Math.max(400, Math.round(n))),
  after: sample(80, 1560, 280, 72).map((n) => Math.max(400, Math.round(n))),
};

/** Posterior draws of the activation uplift (pp) — QuantileDots ship decision. */
export const upliftDraws = sample(200, 5.8, 3.6, 88);
export const upliftThreshold = 0;

/** Q4 MRR forecast: 12 weeks history + an 8-week cone, vs the $780k target. */
export const q4History = [520, 540, 535, 560, 580, 590, 610, 625, 640, 660, 675, 690];
export const q4Forecast = (() => {
  const mid = [705, 720, 734, 747, 760, 772, 784, 796];
  const p80 = mid.map((m, i): [number, number] => {
    const hw = 8 + i * 5;
    return [Math.round(m - hw), Math.round(m + hw)];
  });
  return { mid, p80 };
})();
export const q4Target = 780;

// ---- Accounts route ----

/** Dataset sync churn — rows added / removed per import job (DataDiff). */
export const syncDiff = [
  { key: "Contacts", added: 1240, removed: 320 },
  { key: "Events", added: 8600, removed: 540 },
  { key: "Accounts", added: 210, removed: 45 },
  { key: "Deals", added: 430, removed: 180 },
  { key: "Tickets", added: 620, removed: 90 },
  { key: "Sessions", added: 5100, removed: 1420 },
];

// ---- Live route ----

/** Rolling 24-point "requests / sec" stream for the live sparkline. */
export const liveStream = [
  820, 880, 910, 870, 940, 1020, 990, 1080, 1130, 1090, 1180, 1240, 1210, 1300, 1280, 1360, 1420,
  1390, 1470, 1520, 1490, 1560, 1610, 1680,
];

/** Error-budget burn for the live SLO bullet. */
export const sloBudget = { value: 62, target: 100, bands: [70, 90] };

/** Session duration OHLC (minutes) over the last 14 days. */
export const sessionOhlc = [
  { open: 8.2, high: 9.1, low: 7.8, close: 8.9 },
  { open: 8.9, high: 9.4, low: 8.4, close: 9.0 },
  { open: 9.0, high: 9.2, low: 8.1, close: 8.4 },
  { open: 8.4, high: 8.8, low: 8.0, close: 8.7 },
  { open: 8.7, high: 9.6, low: 8.6, close: 9.5 },
  { open: 9.5, high: 10.1, low: 9.2, close: 9.8 },
  { open: 9.8, high: 10.0, low: 9.1, close: 9.3 },
  { open: 9.3, high: 9.7, low: 8.9, close: 9.6 },
  { open: 9.6, high: 10.4, low: 9.5, close: 10.2 },
  { open: 10.2, high: 10.6, low: 9.8, close: 10.0 },
  { open: 10.0, high: 10.3, low: 9.4, close: 9.7 },
  { open: 9.7, high: 10.5, low: 9.6, close: 10.4 },
  { open: 10.4, high: 11.0, low: 10.2, close: 10.8 },
  { open: 10.8, high: 11.3, low: 10.5, close: 11.1 },
];

/** Streaming error rate (%) for the live CometTrail. */
export const liveErrorRate = [
  0.42, 0.38, 0.51, 0.47, 0.61, 0.55, 0.49, 0.72, 0.68, 0.58, 0.44, 0.39, 0.53, 0.62, 0.71, 0.66,
  0.54, 0.48, 0.57, 0.63,
];

/** Ingest queue depth over ~1h for QueueDepth. */
export const liveQueue = [
  42, 48, 55, 61, 78, 92, 110, 128, 141, 136, 122, 108, 95, 88, 76, 69, 61, 54, 49, 44, 40, 37, 34,
  31,
];

/** Raw throughput samples for DualWindowMeter (rps). */
export const liveThroughput = [
  1180, 1210, 1195, 1260, 1310, 1280, 1340, 1420, 1380, 1450, 1510, 1480, 1560, 1620, 1580, 1490,
  1440, 1390, 1410, 1460, 1520, 1570, 1540, 1600,
];
