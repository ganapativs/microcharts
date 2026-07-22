// Mock data for the Shipyard SRE / service-health console.
// Deterministic pseudo-random so the "visual test" renders identically each run.

export type Health = "ok" | "warn" | "error";

let seed = 0x5eed;
function rnd(): number {
  // Mulberry32 — deterministic, no deps.
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** A 60-point p95 latency series (last 60 minutes), base + noise + optional spike. */
function latencySeries(base: number, jitter: number, spikeAt?: number, spikeMag = 3): number[] {
  const out: number[] = [];
  for (let i = 0; i < 60; i++) {
    let v = base + (rnd() - 0.5) * 2 * jitter;
    if (spikeAt !== undefined && i >= spikeAt && i < spikeAt + 4) {
      v += base * spikeMag * (1 - (i - spikeAt) / 4);
    }
    out.push(Math.max(1, Math.round(v)));
  }
  return out;
}

export interface Service {
  id: string;
  name: string;
  zone: string;
  status: Health;
  latency: number[]; // p95 ms, last 60 min
  p95: number; // current p95 ms (last point)
  errRate: number; // current error rate, fraction 0..1
  errRatePrev: number; // prior-window error rate
  uptime: number; // % over 30d
  rps: number;
}

function build(
  id: string,
  name: string,
  zone: string,
  status: Health,
  base: number,
  jitter: number,
  errRate: number,
  errRatePrev: number,
  uptime: number,
  rps: number,
  spikeAt?: number,
  spikeMag?: number,
): Service {
  const latency = latencySeries(base, jitter, spikeAt, spikeMag);
  return {
    id,
    name,
    zone,
    status,
    latency,
    p95: latency[latency.length - 1],
    errRate,
    errRatePrev,
    uptime,
    rps,
  };
}

export const services: Service[] = [
  build("svc-01", "api-gateway", "us-east-1", "ok", 42, 6, 0.0008, 0.0011, 99.982, 8420),
  build("svc-02", "auth", "us-east-1", "ok", 28, 4, 0.0004, 0.0005, 99.995, 3110),
  build("svc-03", "billing-worker", "us-east-1", "warn", 88, 22, 0.0142, 0.0068, 99.94, 640, 46, 2),
  build("svc-04", "checkout", "us-east-1", "ok", 64, 9, 0.0021, 0.0026, 99.977, 1980),
  build(
    "svc-05",
    "search-index",
    "eu-west-1",
    "warn",
    120,
    30,
    0.0089,
    0.0091,
    99.951,
    1240,
    38,
    1.4,
  ),
  build("svc-06", "notifications", "us-east-1", "ok", 35, 7, 0.0012, 0.0015, 99.988, 2760),
  build(
    "svc-07",
    "media-transcode",
    "eu-west-1",
    "error",
    210,
    70,
    0.0631,
    0.0187,
    99.62,
    410,
    50,
    4,
  ),
  build("svc-08", "analytics-ingest", "us-west-2", "ok", 52, 8, 0.0018, 0.0017, 99.973, 5230),
];

// ── SLO attainment (availability %, higher is better) ────────────────────────
export interface SloRow {
  name: string;
  value: number; // attained %
  target: number; // SLO target %
  bands: number[]; // ascending qualitative thresholds
  domain: [number, number];
}

export const availabilitySlos: SloRow[] = [
  {
    name: "api-gateway · availability",
    value: 99.982,
    target: 99.9,
    bands: [99.5, 99.9],
    domain: [99, 100],
  },
  {
    name: "auth · availability",
    value: 99.995,
    target: 99.95,
    bands: [99.9, 99.95],
    domain: [99.5, 100],
  },
  {
    name: "checkout · availability",
    value: 99.977,
    target: 99.95,
    bands: [99.9, 99.95],
    domain: [99.5, 100],
  },
  {
    name: "media-transcode · availability",
    value: 99.62,
    target: 99.9,
    bands: [99.5, 99.9],
    domain: [99, 100],
  },
];

// Latency SLO (p95 ms, lower is better — value under target is good)
export const latencySlos: SloRow[] = [
  { name: "api-gateway · p95 latency", value: 42, target: 75, bands: [75, 120], domain: [0, 150] },
  {
    name: "search-index · p95 latency",
    value: 120,
    target: 100,
    bands: [100, 150],
    domain: [0, 200],
  },
];

// ── Error budget: fraction of the 30-day budget remaining, index 0 = 1.0 ──────
function errorBudget(startBurn: number, dailyBurn: number, noise: number): number[] {
  const out = [1];
  let v = 1;
  for (let d = 1; d < 30; d++) {
    const burn = dailyBurn * (d > startBurn ? 1.8 : 1) + (rnd() - 0.5) * noise;
    v = Math.max(0, v - Math.max(0, burn));
    out.push(Number(v.toFixed(4)));
  }
  return out;
}

export const gatewayBudget = errorBudget(18, 0.012, 0.004);
export const transcodeBudget = errorBudget(6, 0.05, 0.01);

// ── Latency budget posterior (draws of p95 ms) for the GradedBand ─────────────
export const latencyDraws: number[] = Array.from({ length: 240 }, () => {
  // roughly log-normal around ~64ms
  const g = (rnd() + rnd() + rnd() + rnd() - 2) / 2; // ~N(0,1)
  return Math.round(64 * Math.exp(g * 0.28));
});
export const latencyCurrent = 71; // current p95 overlay

// ── Incident burn-down (remaining incident-response work, story points) ───────
export const incidentBurn = {
  plan: [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0],
  actual: [40, 38, 35, 33, 26, 24, 21, 15, 11, 6],
};

// ── Incidents over 20 weeks (140 days), severity 0..4 as the value ────────────
export const incidentGrid: number[] = Array.from({ length: 140 }, () => {
  const r = rnd();
  if (r > 0.9) return 4;
  if (r > 0.82) return 3;
  if (r > 0.68) return 2;
  if (r > 0.45) return 1;
  return 0;
});
export const incidentGridStart = "2026-02-24"; // a Monday

// ── MTTR trend (minutes to resolve, last 24 incidents) ────────────────────────
export const mttrTrend: number[] = [
  84, 92, 76, 71, 68, 74, 63, 59, 66, 51, 48, 55, 44, 41, 47, 39, 36, 42, 33, 31, 29, 34, 27, 24,
];

// ── Response-time distribution: raw observations (ms) for the histogram ────────
export const responseTimes: number[] = Array.from({ length: 600 }, () => {
  const g = (rnd() + rnd() + rnd() + rnd() - 2) / 2;
  return Math.max(4, Math.round(58 * Math.exp(g * 0.42)));
});
export const responseP95 = 128; // marked bin

// ── Incident severity legend + recent incident log ───────────────────────────
export const severityLegend: { status: Health; label: string; count: number }[] = [
  { status: "error", label: "SEV-1 · critical", count: 2 },
  { status: "warn", label: "SEV-2 · major", count: 7 },
  { status: "ok", label: "SEV-3 · minor", count: 19 },
];

export interface IncidentRow {
  id: string;
  sev: Health;
  service: string;
  title: string;
  mttr: number; // minutes
  when: string;
}

export const incidentLog: IncidentRow[] = [
  {
    id: "INC-4471",
    sev: "error",
    service: "media-transcode",
    title: "Encoder pool saturation",
    mttr: 84,
    when: "2h ago",
  },
  {
    id: "INC-4468",
    sev: "warn",
    service: "billing-worker",
    title: "Retry storm on ledger write",
    mttr: 41,
    when: "yda",
  },
  {
    id: "INC-4465",
    sev: "warn",
    service: "search-index",
    title: "Shard rebalance latency spike",
    mttr: 33,
    when: "1d ago",
  },
  {
    id: "INC-4460",
    sev: "ok",
    service: "notifications",
    title: "Elevated queue depth",
    mttr: 24,
    when: "2d ago",
  },
  {
    id: "INC-4458",
    sev: "warn",
    service: "api-gateway",
    title: "TLS handshake errors (region)",
    mttr: 47,
    when: "3d ago",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SERVICES · error bursts (Seismogram) — per-slot alert intensity, 0 = quiet
// ─────────────────────────────────────────────────────────────────────────────
function burstSeries(density: number, mag: number, spikeAt?: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < 48; i++) {
    let v = 0;
    if (rnd() < density) v = Math.round((0.3 + rnd() * 0.7) * mag);
    if (spikeAt !== undefined && i >= spikeAt && i < spikeAt + 3) {
      v = Math.max(v, Math.round(mag * (1.5 - (i - spikeAt) * 0.35)));
    }
    out.push(v);
  }
  return out;
}

export interface BurstRow {
  id: string;
  name: string;
  status: Health;
  data: (number | null)[];
  anomaly: number;
}

export const serviceBursts: BurstRow[] = [
  {
    id: "svc-07",
    name: "media-transcode",
    status: "error",
    data: burstSeries(0.22, 9, 40),
    anomaly: 6,
  },
  {
    id: "svc-03",
    name: "billing-worker",
    status: "warn",
    data: burstSeries(0.16, 6, 34),
    anomaly: 6,
  },
  {
    id: "svc-05",
    name: "search-index",
    status: "warn",
    data: burstSeries(0.14, 5, 30),
    anomaly: 6,
  },
  { id: "svc-01", name: "api-gateway", status: "ok", data: burstSeries(0.05, 4), anomaly: 6 },
  { id: "svc-04", name: "checkout", status: "ok", data: burstSeries(0.04, 3), anomaly: 6 },
  { id: "svc-08", name: "analytics-ingest", status: "ok", data: burstSeries(0.03, 3), anomaly: 6 },
];

// ── SERVICES · per-tenant load ribbon (HeatStrip), shared domain [0, 100] ─────
export interface TenantRow {
  tenant: string;
  plan: string;
  data: number[];
}

function loadRibbon(base: number, swing: number, rampTo?: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 40; i++) {
    const ramp = rampTo !== undefined ? (rampTo - base) * (i / 39) : 0;
    const v = base + ramp + Math.sin(i / 4) * swing * 0.4 + (rnd() - 0.5) * swing;
    out.push(Math.max(0, Math.min(100, Math.round(v))));
  }
  return out;
}

export const tenantLoad: TenantRow[] = [
  { tenant: "acme-corp", plan: "enterprise", data: loadRibbon(58, 24, 92) },
  { tenant: "globex", plan: "enterprise", data: loadRibbon(44, 18) },
  { tenant: "initech", plan: "business", data: loadRibbon(31, 14) },
  { tenant: "umbrella", plan: "business", data: loadRibbon(22, 20, 68) },
  { tenant: "hooli", plan: "startup", data: loadRibbon(14, 10) },
];
export const tenantLoadDomain: [number, number] = [0, 100];

// ── SERVICES · dependency health dots (OrbitStatus): latency + rate together ──
export interface DependencyDot {
  name: string;
  kind: string;
  latency: number; // ms
  rate: number; // ops/s
  alert: number; // latency threshold
}

export const dependencies: DependencyDot[] = [
  { name: "postgres-primary", kind: "database", latency: 8, rate: 12400, alert: 40 },
  { name: "redis-cache", kind: "cache", latency: 2, rate: 48200, alert: 15 },
  { name: "kafka-broker", kind: "queue", latency: 22, rate: 9100, alert: 60 },
  { name: "s3-blob", kind: "object-store", latency: 54, rate: 2300, alert: 80 },
  { name: "elasticsearch", kind: "search", latency: 118, rate: 1450, alert: 90 },
  { name: "stripe-api", kind: "external", latency: 214, rate: 380, alert: 150 },
];
export const dependencyLatencyDomain: [number, number] = [0, 260];
export const dependencyRateDomain: [number, number] = [0, 50000];

// ─────────────────────────────────────────────────────────────────────────────
//  SLOs · CPU headroom + latency compliance (DualWindowMeter) — raw + target
// ─────────────────────────────────────────────────────────────────────────────
function meterSeries(base: number, jitter: number, drift: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 72; i++) {
    const v = base + drift * (i / 71) + Math.sin(i / 6) * jitter * 0.5 + (rnd() - 0.5) * jitter;
    out.push(Math.max(0, Math.round(v * 10) / 10));
  }
  return out;
}

export const cpuHeadroom = meterSeries(58, 12, 14); // CPU util %, climbing
export const cpuTarget = 80; // saturation ceiling
export const latencyMeter = meterSeries(72, 22, 26); // p95 ms, drifting up
export const latencyTarget = 100; // SLO ceiling

// ── SLOs · metric data-quality (CoverageStrip): scrape presence, nulls = gaps ─
export interface CoverageRow {
  metric: string;
  source: string;
  data: (number | null)[];
  expected: number;
}

function coverage(gapAt: number[], trailingGap = 0): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < 48; i++) {
    if (gapAt.includes(i) || (trailingGap > 0 && i >= 48 - trailingGap)) out.push(null);
    else out.push(Math.round((0.4 + rnd() * 0.6) * 100) / 100);
  }
  return out;
}

export const metricCoverage: CoverageRow[] = [
  { metric: "cpu.util", source: "node-exporter", data: coverage([]), expected: 48 },
  { metric: "http.p95", source: "envoy-stats", data: coverage([19, 20]), expected: 48 },
  { metric: "gc.pause", source: "jvm-agent", data: coverage([7, 8, 9, 33]), expected: 48 },
  { metric: "disk.io", source: "node-exporter", data: coverage([], 6), expected: 48 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  INCIDENTS · on-call & release windows (EventTimeline), epoch-ms over a day
// ─────────────────────────────────────────────────────────────────────────────
const DAY0 = Date.UTC(2026, 6, 16, 0, 0, 0);
const H = 3_600_000;
export const opsWindowNow = DAY0 + 14 * H + 8 * 60_000; // 14:08 UTC

export interface OpsEvent {
  start: number;
  end?: number;
  label?: string;
  kind?: "neutral" | "positive" | "negative" | "accent";
}

export const opsWindows: OpsEvent[] = [
  { start: DAY0, end: DAY0 + 8 * H, label: "on-call · night", kind: "neutral" },
  { start: DAY0 + 8 * H, end: DAY0 + 16 * H, label: "on-call · day", kind: "neutral" },
  { start: DAY0 + 16 * H, end: DAY0 + 24 * H, label: "on-call · swing", kind: "neutral" },
  { start: DAY0 + 9.5 * H, end: DAY0 + 10.5 * H, label: "deploy freeze lift", kind: "positive" },
  { start: DAY0 + 11 * H, end: DAY0 + 11.4 * H, label: "release 2026.7.3", kind: "accent" },
  { start: DAY0 + 13.6 * H, label: "SEV-1 · transcode", kind: "negative" },
  { start: DAY0 + 15 * H, end: DAY0 + 15.3 * H, label: "hotfix 2026.7.4", kind: "accent" },
];
export const opsWindowDomain: [number, number] = [DAY0, DAY0 + 24 * H];

// ── INCIDENTS · event sources raster (EventRaster), minutes 0..1440 over a day ─
export interface RasterLane {
  label: string;
  events: number[];
}

function fireLane(count: number, clusterAt?: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    let t = rnd() * 1440;
    if (clusterAt !== undefined && rnd() < 0.5) t = clusterAt + (rnd() - 0.5) * 90;
    out.push(Math.round(Math.max(0, Math.min(1440, t))));
  }
  return out.sort((a, b) => a - b);
}

export const eventSources: RasterLane[] = [
  { label: "deploys", events: [130, 340, 570, 662, 905, 1088, 1290] },
  { label: "alerts", events: fireLane(14, 818) },
  { label: "autoscale", events: fireLane(20, 818) },
  { label: "cron", events: [0, 240, 480, 720, 960, 1200, 1439, 360, 1080] },
  { label: "on-call page", events: [512, 820, 826, 831, 1140] },
];
export const eventSourcesDomain: [number, number] = [0, 1440];

// ── INCIDENTS · sparse major outages over the quarter (Constellation) ─────────
export interface OutagePoint {
  x: number; // day index in the quarter (0..91)
  y?: number; // customer-minutes lost (thousands)
  m?: number; // severity magnitude (1..4)
}

export const majorOutages: OutagePoint[] = [
  { x: 6, y: 18, m: 2 },
  { x: 19, y: 44, m: 3 },
  { x: 31, y: 9, m: 1 },
  { x: 48, y: 120, m: 4 },
  { x: 57, y: 32, m: 2 },
  { x: 73, y: 61, m: 3 },
  { x: 88, y: 15, m: 2 },
];
export const outageDomainX: [number, number] = [0, 91];
export const outageWeek = (x: number) => `wk ${Math.floor(x / 7) + 1}`;

// ─────────────────────────────────────────────────────────────────────────────
//  FLEET · node × metric intensity matrix (HeatCell), shared domain [0, 100]
// ─────────────────────────────────────────────────────────────────────────────
export const fleetMetrics = ["cpu", "mem", "disk", "net", "iops"] as const;

export interface FleetNode {
  node: string;
  zone: string;
  metrics: number[]; // one per fleetMetrics column, 0..100
  hot: boolean;
}

function nodeRow(bias: number, spread: number): number[] {
  return fleetMetrics.map(() => {
    const v = bias + (rnd() - 0.5) * 2 * spread;
    return Math.max(2, Math.min(100, Math.round(v)));
  });
}

export const fleetNodes: FleetNode[] = [
  { node: "node-a1", zone: "us-east-1a", metrics: nodeRow(38, 22), hot: false },
  { node: "node-a2", zone: "us-east-1a", metrics: nodeRow(46, 24), hot: false },
  { node: "node-b1", zone: "us-east-1b", metrics: nodeRow(84, 16), hot: true },
  { node: "node-b2", zone: "us-east-1b", metrics: nodeRow(52, 26), hot: false },
  { node: "node-c1", zone: "eu-west-1a", metrics: nodeRow(30, 18), hot: false },
  { node: "node-c2", zone: "eu-west-1a", metrics: nodeRow(71, 20), hot: true },
  { node: "node-d1", zone: "us-west-2a", metrics: nodeRow(42, 22), hot: false },
];
export const fleetDomain: [number, number] = [0, 100];

// ── FLEET · capacity honeycombs (seats / pods / runners taken of total) ───────
export interface CapacityCell {
  label: string;
  hint: string;
  value: number;
  total: number;
  unit: string;
}

export const capacity: CapacityCell[] = [
  { label: "Pod slots", hint: "kubernetes · prod", value: 47, total: 60, unit: "pods" },
  { label: "Build runners", hint: "ci fleet", value: 22, total: 24, unit: "runners" },
  { label: "Seat licenses", hint: "observability", value: 38, total: 50, unit: "seats" },
];

// ── FLEET · position in a long deploy log (MinimapStrip) ──────────────────────
export const deployLogLength = 2048;
export const deployLog = {
  content: Array.from({ length: deployLogLength }, (_, i) => {
    // density of log lines; occasional bursts around deploys
    const burst = [180, 512, 903, 1340, 1720].some((c) => Math.abs(i - c) < 22);
    return Math.round((burst ? 6 : 1) * (0.4 + rnd()) * 10) / 10;
  }) as number[],
  window: [1290, 1470] as [number, number],
  marks: [180, 512, 903, 1340, 1720], // deploy boundaries
  known: [[0, 1580]] as [number, number][], // scanned range (trailing tail unindexed)
};

/** Retry backlog depth for the fleet QueueDepth panel. */
export const fleetBacklog = [
  28, 34, 41, 55, 72, 98, 124, 156, 178, 168, 149, 132, 118, 102, 88, 74, 61, 52, 44, 38, 33, 29,
  26, 24,
];
