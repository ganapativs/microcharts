// Cortex — seeded, deterministic mock data for the eval & observability console.
// One small PRNG; every dataset computed once at module load (no per-render churn).

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x0c07e2);
const rangeR = (lo: number, hi: number) => lo + rnd() * (hi - lo);
const round = (n: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

// ── Models roster ────────────────────────────────────────────────────────────
export type ModelState = "ok" | "warn" | "error" | "busy" | "off";
export interface ModelRow {
  id: string;
  name: string;
  tier: string;
  state: ModelState;
  latency: number; // p50 ms
  rate: number; // req/s
  share: number; // % of traffic
}
export const models: ModelRow[] = [
  {
    id: "cx-opus",
    name: "cortex-opus-4",
    tier: "frontier",
    state: "ok",
    latency: 640,
    rate: 1.7,
    share: 41,
  },
  {
    id: "cx-sonnet",
    name: "cortex-sonnet-4",
    tier: "balanced",
    state: "busy",
    latency: 410,
    rate: 3.2,
    share: 34,
  },
  {
    id: "cx-haiku",
    name: "cortex-haiku-4",
    tier: "fast",
    state: "ok",
    latency: 180,
    rate: 5.1,
    share: 19,
  },
  {
    id: "cx-guard",
    name: "guardrail-mini",
    tier: "safety",
    state: "warn",
    latency: 920,
    rate: 0.9,
    share: 6,
  },
];

// ── Live: request-rate heartbeat (event timestamps in ms, fixed clock) ─────────
const NOW = 60_000;
function heartbeat(density: number): number[] {
  const ev: number[] = [];
  let t = 0;
  while (t < NOW) {
    t += rangeR(600, 2600) / density;
    if (t < NOW) ev.push(Math.round(t));
  }
  return ev;
}
export const requestPulse = { events: heartbeat(1.9), now: NOW, window: NOW };
export const headerPulse = { events: heartbeat(1.4), now: NOW, window: NOW };

// ── Live: tokens/sec comet trail (momentum) ────────────────────────────────────
export const tokensPerSec: number[] = (() => {
  const out: number[] = [];
  let v = 1180;
  for (let i = 0; i < 18; i++) {
    v += rangeR(-90, 130);
    v = Math.max(720, Math.min(1680, v));
    out.push(round(v));
  }
  return out;
})();

// ── Live: per-model orbit health (latency + rate) ──────────────────────────────
export const orbit = models.map((m) => ({
  id: m.id,
  name: m.name,
  latency: m.latency,
  rate: m.rate,
}));
export const latencyDomain: [number, number] = [0, 1100];
export const rateDomain: [number, number] = [0, 6];
export const latencyAlert = 850;

// ── Live: KPI deltas (positive="down" where lower is better) ────────────────────
export const kpis = {
  cost: { now: 0.42, from: 0.49, unit: "$/1k req" }, // -14%
  p95: { now: 1180, from: 1090, unit: "ms" }, // +8% (regression)
  error: { now: 0.6, from: 0.9, unit: "%" }, // -33%
  throughput: { now: 10.9, from: 9.4, unit: "req/s" }, // +16% (up good)
};

// ── Live: daily eval-run cadence (18 weeks) ────────────────────────────────────
export const evalRuns: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < 126; i++) {
    const weekday = i % 7;
    const weekend = weekday === 5 || weekday === 6;
    let v = weekend ? rangeR(0, 8) : rangeR(6, 46);
    if (rnd() < 0.05) v = 0; // an occasional quiet day
    if (rnd() < 0.04) v = rangeR(52, 74); // a release-day spike
    out.push(Math.round(v));
  }
  return out;
})();
export const evalRunsStart = "2026-03-09"; // a Monday

// ── Live: running batch-eval ETA ────────────────────────────────────────────────
export const batchEval = {
  progress: 0.62,
  elapsed: 14.2,
  rate: 0.038,
  suite: "safety-redteam-v7",
  cases: 8400,
};

// ── Transcripts: the answer, token-by-token confidence ─────────────────────────
export const confidenceTiers: [number, number] = [0.55, 0.85];
export interface Tok {
  token: string;
  confidence: number;
}
// A believable support-agent answer. Hedges + specifics carry lower confidence.
const RAW =
  "Yes|c you|c can|c still|c process|c the|c refund|c after|c the|c 30-day|u window|c ,|c but|c it|c needs|c a|c manager|u override|u .|c " +
  "Open|c the|c order|c in|c Atlas|g ,|c switch|c the|c status|c to|c Exception|u ,|c and|c apply|c the|c code|c GOODWILL-30|g .|c " +
  "The|c customer|c should|c see|c the|c credit|c within|c three|u to|c five|c business|c days|u ,|c though|c prepaid|u cards|u can|c take|c up|c to|c ten|g .|c " +
  "If|c the|c amount|c is|c over|c $500|g ,|c route|c it|c to|c the|c Finance|c queue|c instead|u ,|c since|c large|c goodwill|u credits|c need|c a|c second|c approval|u .|c";
// The chart concatenates token strings verbatim — whitespace must live inside
// each token. Prepend a space to every token except the first and punctuation.
export const answerTokens: Tok[] = RAW.split(" ").map((chunk, idx) => {
  const cut = chunk.lastIndexOf("|");
  const bare = chunk.slice(0, cut);
  const flag = chunk.slice(cut + 1);
  const punct = /^[.,]$/.test(bare);
  const token = idx === 0 || punct ? bare : " " + bare;
  const confidence =
    flag === "g"
      ? round(rangeR(0.28, 0.5), 2)
      : flag === "u"
        ? round(rangeR(0.6, 0.82), 2)
        : round(rangeR(0.9, 0.99), 2);
  return { token, confidence };
});

export function tierOf(confidence: number): "confident" | "unsure" | "guessing" {
  if (confidence < confidenceTiers[0]) return "guessing";
  if (confidence < confidenceTiers[1]) return "unsure";
  return "confident";
}
// Flagged spans (consecutive non-confident tokens grouped).
export interface FlaggedSpan {
  text: string;
  tier: "unsure" | "guessing";
  confidence: number;
}
export const flaggedSpans: FlaggedSpan[] = (() => {
  const out: FlaggedSpan[] = [];
  let cur: { toks: string[]; min: number } | null = null;
  const flush = () => {
    if (!cur) return;
    const t = tierOf(cur.min) as "unsure" | "guessing";
    out.push({
      text: cur.toks.join(" ").replace(/\s+([.,])/g, "$1"),
      tier: t,
      confidence: cur.min,
    });
    cur = null;
  };
  for (const t of answerTokens) {
    const tier = tierOf(t.confidence);
    const bare = t.token.replace(/[.,]/g, "").trim();
    if (tier === "confident" || bare === "") {
      flush();
      continue;
    }
    if (!cur) cur = { toks: [], min: 1 };
    cur.toks.push(t.token.trim());
    cur.min = Math.min(cur.min, t.confidence);
  }
  flush();
  return out.sort((a, b) => a.confidence - b.confidence).slice(0, 6);
})();

// ── Transcripts: rubric scorecard ───────────────────────────────────────────────
export const rubric = [
  { label: "Instruction-following", score: 0.94, weight: 3 },
  { label: "Factual accuracy", score: 0.71, weight: 3 },
  { label: "Safety", score: 0.98, weight: 3 },
  { label: "Citations", score: 0.52, weight: 2 },
  { label: "Concision", score: 0.83, weight: 1 },
  { label: "Tone", score: 0.9, weight: 1 },
];
export const rubricTarget = 0.7;

// ── Transcripts: answer-quality star profile (vs prior model) ──────────────────
export const qualities = [
  { label: "Helpful", value: 0.9 },
  { label: "Accurate", value: 0.72 },
  { label: "Safe", value: 0.97 },
  { label: "Concise", value: 0.83 },
  { label: "Grounded", value: 0.58 },
  { label: "Tone", value: 0.88 },
];
export const qualitiesBaseline = qualities.map((q) =>
  round(Math.max(0.35, q.value - rangeR(0.05, 0.22)), 2),
);

// ── Evals: calibration (pre-binned reliability) ────────────────────────────────
export const calibration = (() => {
  const rows: { predicted: number; observed: number; count: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const predicted = round((i + 0.5) / 10, 2);
    // slight over-confidence in the high bins
    const drift = predicted > 0.6 ? -rangeR(0.03, 0.11) : rangeR(-0.03, 0.05);
    const observed = round(Math.max(0, Math.min(1, predicted + drift)), 2);
    const count = Math.round(rangeR(40, 260) * (1 - Math.abs(predicted - 0.5)) + 30);
    rows.push({ predicted, observed, count });
  }
  return rows;
})();

// ── Evals: confusion (4-class intent classifier) ───────────────────────────────
export const confusion = {
  labels: ["Refund", "Billing", "Tech", "Other"],
  counts: [
    [412, 22, 9, 17],
    [31, 388, 14, 27],
    [12, 19, 344, 41],
    [24, 33, 38, 196],
  ],
};

// ── Evals: percentile-rank drift across releases ───────────────────────────────
export const percentileTrace: number[] = (() => {
  const out: number[] = [];
  let p = 58;
  for (let i = 0; i < 14; i++) {
    p += rangeR(-6, 9);
    p = Math.max(20, Math.min(96, p));
    out.push(Math.round(p));
  }
  out[out.length - 1] = 91; // shipped a strong release
  return out;
})();

// ── Evals: SLA-miss odds (posterior latency draws) ─────────────────────────────
export const slaSample: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < 80; i++) {
    // log-normal-ish latency around 640ms, right tail crosses the 900ms SLA
    const base = 560 + rangeR(-120, 120);
    const tail = rnd() < 0.22 ? rangeR(180, 520) : rangeR(0, 120);
    out.push(Math.round(base + tail));
  }
  return out;
})();
export const slaThreshold = 900;
export const slaDotCount = 20;

/** Match <QuantileDots count> framing: how many of N equal-probability quantiles miss. */
export function slaPastDots(
  sample: readonly number[] = slaSample,
  threshold = slaThreshold,
  count = slaDotCount,
): number {
  const sorted = sample
    .filter((v) => Number.isFinite(v))
    .slice()
    .sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  let past = 0;
  for (let i = 1; i <= count; i++) {
    const q = (i - 0.5) / count;
    const pos = q * (sorted.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    const v = lo === hi ? sorted[lo]! : sorted[lo]! * (1 - (pos - lo)) + sorted[hi]! * (pos - lo);
    if (v > threshold) past++;
  }
  return past;
}

// ── Evals: drift control chart ─────────────────────────────────────────────────
export const driftSeries: number[] = (() => {
  const out: number[] = [];
  let v = 0.83;
  for (let i = 0; i < 44; i++) {
    v += rangeR(-0.018, 0.018);
    if (i === 30) v += 0.06; // an excursion
    if (i === 31) v += 0.03;
    v = Math.max(0.6, Math.min(0.98, v));
    out.push(round(v, 3));
  }
  return out;
})();
export const driftBaseline = 0.83;

// ── Evals: pass-rate vs target ─────────────────────────────────────────────────
export const passRate = { value: 86.4, target: 90, bands: [70, 85] };

// ── Evals: eval-label mix ──────────────────────────────────────────────────────
export const labelMix = [
  { label: "Pass", value: 3120 },
  { label: "Regression", value: 214 },
  { label: "Flaky", value: 96 },
  { label: "Refusal", value: 142 },
  { label: "Timeout", value: 38 },
];

// ── Traces: agent request flame chart ──────────────────────────────────────────
export interface Span {
  label: string;
  start: number;
  duration: number;
  depth: number;
  parent?: number;
  critical?: boolean;
}
export const traceSpans: Span[] = [
  { label: "agent.run", start: 0, duration: 4200, depth: 0, critical: true },
  { label: "plan", start: 40, duration: 360, depth: 1, parent: 0, critical: true },
  { label: "retrieve", start: 420, duration: 760, depth: 1, parent: 0, critical: true },
  { label: "tool.web_search", start: 450, duration: 320, depth: 2, parent: 2, critical: true },
  { label: "vector.query", start: 800, duration: 290, depth: 2, parent: 2 },
  { label: "rerank", start: 1180, duration: 190, depth: 1, parent: 0 },
  { label: "llm.generate", start: 1380, duration: 2470, depth: 1, parent: 0, critical: true },
  { label: "tool.calculator", start: 1600, duration: 90, depth: 2, parent: 6 },
  { label: "guardrail.check", start: 3870, duration: 290, depth: 1, parent: 0, critical: true },
  { label: "emit", start: 4160, duration: 40, depth: 1, parent: 0, critical: true },
];
export const traceTotalMs = 4200;

// ── Traces: tool-call raster across agent steps ────────────────────────────────
export const rasterLanes = [
  { label: "llm.generate", events: [80, 1390, 2010, 2640, 3210, 3780] },
  { label: "web_search", events: [455, 690, 940] },
  { label: "vector.query", events: [472, 610, 748] },
  { label: "calculator", events: [1605] },
  { label: "guardrail", events: [3872, 3990, 4110] },
];
export const rasterDomain: [number, number] = [0, 4200];

// ── Traces: voice-agent log volume waveform ────────────────────────────────────
export const waveform: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < 200; i++) {
    // three speech bursts with silence between
    const b1 = Math.exp(-(((i - 34) / 22) ** 2));
    const b2 = Math.exp(-(((i - 104) / 30) ** 2));
    const b3 = Math.exp(-(((i - 168) / 18) ** 2));
    const env = Math.max(b1, b2 * 0.9, b3 * 0.8);
    const s = env * (0.55 + rnd() * 0.45) * (rnd() < 0.5 ? 1 : -1);
    out.push(round(s, 3));
  }
  return out;
})();
export const waveformProgress = 0.46;

// ── Traces: per-step latency sparkline ─────────────────────────────────────────
export const stepLatency: number[] = [42, 51, 380, 210, 690, 190, 88, 2470, 90, 240, 40];
export const stepNames = [
  "auth",
  "route",
  "plan",
  "embed",
  "search",
  "rerank",
  "compose",
  "generate",
  "calc",
  "guard",
  "emit",
];

/** Model score vs. human judge — Bland–Altman pairs for BiasStrip on Evals. */
export const judgePairs = (() => {
  const out: { a: number; b: number }[] = [];
  for (let i = 0; i < 48; i++) {
    const human = 0.35 + rnd() * 0.6;
    const model = human + (rnd() - 0.42) * 0.14;
    out.push({
      a: Math.round(Math.min(1, Math.max(0, model)) * 100) / 100,
      b: Math.round(Math.min(1, Math.max(0, human)) * 100) / 100,
    });
  }
  return out;
})();

/** Mean model−human difference — the BiasStrip accent line. */
export const judgeBias =
  Math.round((judgePairs.reduce((s, p) => s + (p.a - p.b), 0) / judgePairs.length) * 100) / 100;

// ── Small chrome-side formatters (never used inside microcharts) ───────────────
export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmtPct = (n: number, dp = 1) => `${n.toFixed(dp)}%`;
export const fmtMs = (n: number) => `${Math.round(n)}ms`;
