// Mock data for the "Ledger" portfolio tracker.
// Deterministic seeded generation so figures never shift between renders.

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A gently drifting random walk, rounded to 2dp. */
function walk(seed: number, n: number, start: number, drift: number, vol: number): number[] {
  const rnd = mulberry32(seed);
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    v = v * (1 + drift + (rnd() - 0.5) * vol);
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}

export interface Holding {
  ticker: string;
  name: string;
  kind: "Equity" | "Crypto" | "ETF";
  shares: number;
  price: number;
  prevPrice: number;
  value: number;
  spark: number[];
}

function holding(
  ticker: string,
  name: string,
  kind: Holding["kind"],
  shares: number,
  price: number,
  dayPct: number,
  seed: number,
): Holding {
  const prevPrice = Math.round((price / (1 + dayPct / 100)) * 100) / 100;
  return {
    ticker,
    name,
    kind,
    shares,
    price,
    prevPrice,
    value: Math.round(shares * price * 100) / 100,
    spark: walk(seed, 30, price * 0.94, 0.002, 0.03),
  };
}

export const holdings: Holding[] = [
  holding("NVDA", "NVIDIA Corp.", "Equity", 180, 121.4, 2.34, 11),
  holding("AAPL", "Apple Inc.", "Equity", 320, 229.87, 0.62, 12),
  holding("MSFT", "Microsoft Corp.", "Equity", 140, 431.2, -0.41, 13),
  holding("BTC", "Bitcoin", "Crypto", 1.85, 67240, 3.12, 14),
  holding("ETH", "Ethereum", "Crypto", 14.2, 3180, 1.88, 15),
  holding("VTI", "Vanguard Total Mkt", "ETF", 210, 278.55, 0.35, 16),
  holding("TSLA", "Tesla Inc.", "Equity", 95, 248.5, -1.72, 17),
];

const cashUsd = 22840.15;
const bondsUsd = 26120.5;

export const portfolioValue =
  Math.round((holdings.reduce((s, h) => s + h.value, 0) + cashUsd + bondsUsd) * 100) / 100;

// Prior close: back out each holding's previous value plus static cash/bonds.
const prevHoldingsValue = holdings.reduce((s, h) => s + h.shares * h.prevPrice, 0);
export const portfolioPrevValue = Math.round((prevHoldingsValue + cashUsd + bondsUsd) * 100) / 100;

// 90-day portfolio value series, ending exactly at today's value.
const rawPortfolio = walk(7, 90, portfolioValue * 0.86, 0.0016, 0.02);
const scale = portfolioValue / rawPortfolio[rawPortfolio.length - 1];
export const portfolioSeries = rawPortfolio.map((v) => Math.round(v * scale * 100) / 100);

export interface Allocation {
  label: string;
  value: number;
}
export const allocation: Allocation[] = [
  {
    label: "Equities",
    value: Math.round(holdings.filter((h) => h.kind !== "Crypto").reduce((s, h) => s + h.value, 0)),
  },
  {
    label: "Crypto",
    value: Math.round(holdings.filter((h) => h.kind === "Crypto").reduce((s, h) => s + h.value, 0)),
  },
  { label: "Bonds", value: Math.round(bondsUsd) },
  { label: "Cash", value: Math.round(cashUsd) },
];

// ---- Markets ----
export interface MarketCard {
  symbol: string;
  name: string;
  last: number;
  prev: number;
  spark: number[];
}

function market(
  symbol: string,
  name: string,
  last: number,
  dayPct: number,
  seed: number,
): MarketCard {
  return {
    symbol,
    name,
    last,
    prev: Math.round((last / (1 + dayPct / 100)) * 100) / 100,
    spark: walk(seed, 30, last * 0.97, 0.001, 0.02),
  };
}

export const markets: MarketCard[] = [
  market("S&P 500", "SPX Index", 5738.17, 0.51, 21),
  market("Nasdaq", "IXIC Composite", 18119.6, 0.86, 22),
  market("Dow Jones", "DJI Industrial", 42063.4, -0.22, 23),
  market("Russell 2K", "RUT Smallcap", 2227.9, 0.34, 24),
  market("BTC / USD", "Bitcoin", 67240, 3.12, 25),
  market("Gold", "XAU spot / oz", 2648.3, -0.44, 26),
  market("US 10Y", "Treasury yield", 3.74, 0.19, 27),
  market("VIX", "Volatility", 16.42, -2.14, 28),
];

// ---- Detailed OHLC for NVDA (30 sessions, oldest first) ----
export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}
export const nvdaCandles: Candle[] = (() => {
  const rnd = mulberry32(99);
  const out: Candle[] = [];
  let close = 104.5;
  for (let i = 0; i < 30; i++) {
    const open = Math.round(close * (1 + (rnd() - 0.48) * 0.02) * 100) / 100;
    const drift = (rnd() - 0.42) * 0.045;
    close = Math.round(open * (1 + drift) * 100) / 100;
    const hi = Math.max(open, close) * (1 + rnd() * 0.018);
    const lo = Math.min(open, close) * (1 - rnd() * 0.018);
    out.push({
      open,
      close,
      high: Math.round(hi * 100) / 100,
      low: Math.round(lo * 100) / 100,
    });
  }
  return out;
})();

// ---- Analytics ----
// Monthly returns (%) over 3 years — raw observations for the histogram.
export const monthlyReturns: number[] = walk(31, 36, 100, 0, 0.14).map(
  (v) => Math.round((v - 100) * 100) / 100,
);

// Daily returns (%) over ~1 trading year — raw sample for the ladder.
export const dailyReturns: number[] = (() => {
  const rnd = mulberry32(41);
  const out: number[] = [];
  for (let i = 0; i < 252; i++) {
    // roughly-normal via sum of uniforms, centered slightly positive
    const z = (rnd() + rnd() + rnd() - 1.5) / 1.5;
    out.push(Math.round((0.06 + z * 1.15) * 100) / 100);
  }
  return out;
})();

// Allocation drift over 12 months — 3 stacked series.
export const allocationOverTime = [
  { label: "Equities", values: walk(51, 12, 58, 0.006, 0.03) },
  { label: "Crypto", values: walk(52, 12, 14, 0.02, 0.06) },
  { label: "Bonds & Cash", values: walk(53, 12, 28, -0.004, 0.02) },
];

// Goal progress for the Bullet charts.
export interface Goal {
  label: string;
  value: number;
  target: number;
  bands: number[];
  unit: "usd";
}
export const goals: Goal[] = [
  { label: "Emergency fund", value: 22840, target: 30000, bands: [15000, 24000], unit: "usd" },
  {
    label: "2024 retirement contribution",
    value: 18500,
    target: 23000,
    bands: [11500, 20000],
    unit: "usd",
  },
  { label: "House down payment", value: 61200, target: 120000, bands: [60000, 96000], unit: "usd" },
];

// ============================================================
// Portfolio — added coverage
// ============================================================

// Order-flow pressure across the last session: notional bought vs sold.
export const orderFlow: [{ label: string; value: number }, { label: string; value: number }] = [
  { label: "Buys", value: 6_240_000 },
  { label: "Sells", value: 4_105_000 },
];

// Monthly cash in/out — contributions vs withdrawals, trailing 12 months.
export interface CashPeriod {
  in: number;
  out: number;
}
export const cashFlow: CashPeriod[] = (() => {
  const rnd = mulberry32(61);
  const months = 12;
  const out: CashPeriod[] = [];
  for (let i = 0; i < months; i++) {
    const contrib = Math.round((2500 + rnd() * 6500) / 50) * 50;
    // occasional larger withdrawals (rebalances, a tax bill)
    const withdraw = Math.round((rnd() < 0.28 ? 2000 + rnd() * 7000 : rnd() * 1800) / 50) * 50;
    out.push({ in: contrib, out: withdraw });
  }
  return out;
})();

// Account age — net contributions per year since opening (oldest first).
export const accountRings: number[] = [7400, 10800, 9200, 14600, 17900, 21300, 19850];
export const accountOpenedYear = 2018;

// Positions sized by the issuer's market capitalization (USD).
export interface CapDatum {
  label: string;
  value: number;
}
export const marketCaps: CapDatum[] = [
  { label: "AAPL", value: 3.45e12 },
  { label: "MSFT", value: 3.21e12 },
  { label: "NVDA", value: 3.02e12 },
  { label: "BTC", value: 1.33e12 },
  { label: "TSLA", value: 0.79e12 },
  { label: "ETH", value: 0.38e12 },
];

// ============================================================
// Markets — added coverage
// ============================================================

// Featured live ticker (S&P 500) — recent ticks for the comet head + trail.
export const spxTicks: number[] = walk(71, 44, 5731.4, 0.00018, 0.0016).map(
  (v) => Math.round(v * 100) / 100,
);

// Market-pulse heartbeat: trade-print timestamps inside a 60s window.
export const pulseWindow = 60_000;
export const pulseNow = 60_000;
export const pulseEvents: number[] = (() => {
  const rnd = mulberry32(72);
  const out: number[] = [];
  let t = 0;
  while (t < pulseWindow) {
    // bursty arrivals: mostly tight, occasional lulls
    t += rnd() < 0.8 ? 700 + rnd() * 1400 : 2600 + rnd() * 3800;
    if (t < pulseWindow) out.push(Math.round(t));
  }
  return out;
})();

// VIX live reading for the tape gauge.
export const vixValue = 16.42;
export const vixRate = -0.34;
export const vixZones = [
  { from: 4, to: 18, tone: "pos" as const },
  { from: 18, to: 28, tone: "warn" as const },
  { from: 28, to: 45, tone: "neg" as const },
];

// Dense monitoring rows: intraday % deviation from open for many symbols.
export interface HorizonRow {
  symbol: string;
  name: string;
  last: number;
  changePct: number;
  series: number[];
}
export const monitorRows: HorizonRow[] = (() => {
  const specs: [string, string, number, number, number][] = [
    ["ES", "S&P 500 fut", 5741.5, 0.51, 81],
    ["NQ", "Nasdaq 100 fut", 20118.0, 0.86, 82],
    ["YM", "Dow fut", 42088.0, -0.22, 83],
    ["RTY", "Russell 2K fut", 2229.4, 0.34, 84],
    ["CL", "WTI crude", 71.84, -1.12, 85],
    ["GC", "Gold", 2648.3, -0.44, 86],
    ["ZN", "10Y note", 111.72, 0.19, 87],
    ["6E", "EUR / USD", 1.0842, 0.08, 88],
    ["BTC", "Bitcoin", 67240, 3.12, 89],
    ["VX", "VIX fut", 16.42, -2.14, 90],
  ];
  return specs.map(([symbol, name, last, changePct, seed]) => {
    const rnd = mulberry32(seed);
    // deviation (%) from the open across ~48 intraday marks, ending at changePct
    const raw: number[] = [];
    let v = 0;
    for (let i = 0; i < 48; i++) {
      v += (rnd() - 0.5) * 0.34;
      raw.push(v);
    }
    const drift = changePct - raw[raw.length - 1];
    const series = raw.map((x, i) => Math.round((x + (drift * i) / (raw.length - 1)) * 100) / 100);
    return { symbol, name, last, changePct, series };
  });
})();

// ============================================================
// Asset detail (NVDA) — added coverage
// ============================================================

const nvdaLast = nvdaCandles[nvdaCandles.length - 1].close;
const nvdaHi = Math.max(...nvdaCandles.map((c) => c.high));
const nvdaLo = Math.min(...nvdaCandles.map((c) => c.low));

// Volume-at-price: mass concentrated around a point of control below spot.
export interface VolLevel {
  level: number;
  weight: number;
}
export const volumeAtPrice: VolLevel[] = (() => {
  const rnd = mulberry32(101);
  const bins = 14;
  const poc = nvdaLo + (nvdaHi - nvdaLo) * 0.42; // point of control
  const out: VolLevel[] = [];
  for (let i = 0; i < bins; i++) {
    const level = Math.round((nvdaLo + ((nvdaHi - nvdaLo) * i) / (bins - 1)) * 100) / 100;
    const dist = Math.abs(level - poc) / (nvdaHi - nvdaLo);
    const mass = Math.exp(-(dist * dist) * 9) * (0.7 + rnd() * 0.6);
    out.push({ level, weight: Math.round(mass * 1000) / 10 });
  }
  return out;
})();

// Order-book depth around the last trade.
export interface DepthLevel {
  level: number;
  amount: number;
}
export const orderBook: { demand: DepthLevel[]; supply: DepthLevel[] } = (() => {
  const rnd = mulberry32(102);
  const mid = Math.round(nvdaLast * 100) / 100;
  const tick = 0.25;
  const demand: DepthLevel[] = [];
  const supply: DepthLevel[] = [];
  for (let i = 1; i <= 12; i++) {
    const bid = Math.round((mid - i * tick) * 100) / 100;
    const ask = Math.round((mid + i * tick) * 100) / 100;
    demand.push({ level: bid, amount: Math.round((900 + rnd() * 2600) * (1 + i * 0.08)) });
    supply.push({ level: ask, amount: Math.round((900 + rnd() * 2600) * (1 + i * 0.06)) });
  }
  return { demand, supply };
})();

// Return correlation: NVDA daily return (%) vs the S&P (beta > 1).
export interface XY {
  x: number;
  y: number;
}
export const returnScatter: XY[] = (() => {
  const rnd = mulberry32(103);
  const out: XY[] = [];
  for (let i = 0; i < 44; i++) {
    const mkt = (rnd() + rnd() + rnd() - 1.5) * 1.4; // market return
    const idio = (rnd() - 0.5) * 1.6; // idiosyncratic
    out.push({
      x: Math.round(mkt * 100) / 100,
      y: Math.round((mkt * 1.65 + idio + 0.15) * 100) / 100,
    });
  }
  return out;
})();

// Phase portrait: price (x) against session volume (y) across the window.
export const priceVolumeTrace: XY[] = (() => {
  const rnd = mulberry32(104);
  return nvdaCandles.map((c) => ({
    x: c.close,
    y: Math.round((3.2 + Math.abs(c.high - c.low) * 0.9 + rnd() * 1.4) * 10) / 10,
  }));
})();

export const nvdaStats = { last: nvdaLast, high: nvdaHi, low: nvdaLo };

// ============================================================
// Analytics — added coverage
// ============================================================

// Monte-Carlo projection: 14 portfolio paths over the next 24 months.
export const forecastPaths: number[][] = (() => {
  const members = 14;
  const horizon = 24;
  const start = portfolioValue;
  const paths: number[][] = [];
  for (let m = 0; m < members; m++) {
    const rnd = mulberry32(200 + m);
    const drift = 0.006 + (rnd() - 0.5) * 0.004;
    const vol = 0.03 + rnd() * 0.02;
    const p: number[] = [start];
    let v = start;
    for (let i = 1; i < horizon; i++) {
      v = v * (1 + drift + (rnd() - 0.5) * vol);
      p.push(Math.round(v));
    }
    paths.push(p);
  }
  return paths;
})();

// Probability (%) of clearing the $1M net-worth mark by year end — crosses 50.
export const millionOdds: number[] = (() => {
  const rnd = mulberry32(210);
  const out: number[] = [];
  let p = 34;
  for (let i = 0; i < 26; i++) {
    p += (rnd() - 0.42) * 7;
    p = Math.max(6, Math.min(94, p));
    out.push(Math.round(p * 10) / 10);
  }
  // land decisively above the line
  out[out.length - 1] = 63.5;
  return out;
})();

/** Median + p80 band from the Monte-Carlo paths, for ForecastCone. */
export const portfolioForecast = (() => {
  const horizon = forecastPaths[0]!.length;
  const mid: number[] = [];
  const p80: [number, number][] = [];
  for (let i = 0; i < horizon; i++) {
    const col = forecastPaths.map((p) => p[i]!).sort((a, b) => a - b);
    mid.push(col[Math.floor(col.length / 2)]!);
    p80.push([col[Math.floor(col.length * 0.1)]!, col[Math.floor(col.length * 0.9)]!]);
  }
  return { mid, p80 };
})();
export const millionTarget = 1_000_000;

// Portfolio vs benchmark: cumulative return (%) — the lead flips mid-year.
export interface SpreadRow {
  a: number;
  b: number;
}
export const benchmarkSpread: SpreadRow[] = (() => {
  const rndA = mulberry32(220);
  const rndB = mulberry32(221);
  const out: SpreadRow[] = [];
  let a = 0;
  let b = 0;
  for (let i = 0; i < 14; i++) {
    a += (rndA() - 0.4) * 2.4;
    b += (rndB() - 0.42) * 1.9;
    out.push({ a: Math.round(a * 100) / 100, b: Math.round(b * 100) / 100 });
  }
  return out;
})();

// Tracking check: paired monthly returns, portfolio (a) vs benchmark (b).
export const trackingPairs: SpreadRow[] = (() => {
  const rnd = mulberry32(230);
  const out: SpreadRow[] = [];
  for (let i = 0; i < 30; i++) {
    const mkt = (rnd() + rnd() - 1) * 2.6;
    const bias = 0.18 + (rnd() - 0.5) * 0.9; // small persistent tracking bias
    out.push({
      a: Math.round((mkt + bias) * 100) / 100,
      b: Math.round(mkt * 100) / 100,
    });
  }
  return out;
})();
