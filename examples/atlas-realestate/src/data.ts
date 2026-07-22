// Atlas — mock real-estate market data. Believable, deterministic, seeded.
// Everything here is computed once at module load; views useMemo over these.

/* ------------------------------------------------------------------ formats */

export const usd = {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
} as const;

export const usdSqft = {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
} as const;

export const pct = {
  style: "percent",
  maximumFractionDigits: 1,
} as const;

export const pct0 = {
  style: "percent",
  maximumFractionDigits: 0,
} as const;

export function money(n: number): string {
  return new Intl.NumberFormat("en-US", usd).format(n);
}

/* --------------------------------------------------------------------- prng */
// mulberry32 — tiny deterministic PRNG so every render is byte-identical.

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x0a71a5);

/** Gentle random walk around a base, rounded to a step. */
function walk(base: number, points: number, drift: number, jitter: number, step: number): number[] {
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < points; i++) {
    v += drift + (rand() - 0.5) * jitter;
    out.push(Math.round(v / step) * step);
  }
  return out;
}

/* ------------------------------------------------------------- neighborhoods */

export interface Neighborhood {
  name: string;
  /** Median sale price ($). */
  median: number;
  /** Median price per square foot ($). */
  ppsf: number;
  /** Median days on market. */
  dom: number;
  /** Active inventory (listings). */
  inventory: number;
  /** Year-over-year median-price appreciation (fraction). */
  yoy: number;
  /** Sale-to-list ratio (fraction, e.g. 1.03 = 3% over asking). */
  saleToList: number;
  /** Inventory mix — units of each property type currently listed. */
  mix: { sf: number; condo: number; town: number };
}

export const neighborhoods: Neighborhood[] = [
  {
    name: "Lakeside",
    median: 698000,
    ppsf: 331,
    dom: 6,
    inventory: 142,
    yoy: 0.141,
    saleToList: 1.049,
    mix: { sf: 88, condo: 24, town: 30 },
  },
  {
    name: "Harborview",
    median: 731000,
    ppsf: 318,
    dom: 19,
    inventory: 96,
    yoy: 0.082,
    saleToList: 0.979,
    mix: { sf: 41, condo: 44, town: 11 },
  },
  {
    name: "Mission Hills",
    median: 592000,
    ppsf: 297,
    dom: 9,
    inventory: 168,
    yoy: 0.08,
    saleToList: 1.03,
    mix: { sf: 104, condo: 32, town: 32 },
  },
  {
    name: "Grove District",
    median: 559000,
    ppsf: 289,
    dom: 7,
    inventory: 131,
    yoy: 0.053,
    saleToList: 1.033,
    mix: { sf: 76, condo: 28, town: 27 },
  },
  {
    name: "Riverside",
    median: 655000,
    ppsf: 276,
    dom: 16,
    inventory: 118,
    yoy: 0.071,
    saleToList: 0.988,
    mix: { sf: 63, condo: 40, town: 15 },
  },
  {
    name: "Oakridge",
    median: 508000,
    ppsf: 271,
    dom: 12,
    inventory: 154,
    yoy: 0.02,
    saleToList: 1.006,
    mix: { sf: 92, condo: 34, town: 28 },
  },
  {
    name: "Cedar Park",
    median: 411000,
    ppsf: 258,
    dom: 5,
    inventory: 97,
    yoy: -0.024,
    saleToList: 1.032,
    mix: { sf: 55, condo: 26, town: 16 },
  },
  {
    name: "Sunset Terrace",
    median: 421000,
    ppsf: 244,
    dom: 28,
    inventory: 134,
    yoy: 0.011,
    saleToList: 0.979,
    mix: { sf: 61, condo: 42, town: 31 },
  },
];

/* --------------------------------------------------------------- market view */

/** Raw sale prices across the metro (full dollars). */
export const priceObservations: number[] = [
  412000, 445000, 398000, 520000, 610000, 475000, 388000, 542000, 690000, 455000, 505000, 468000,
  720000, 435000, 580000, 495000, 640000, 410000, 560000, 485000, 530000, 615000, 448000, 705000,
  492000, 575000, 428000, 660000, 512000, 590000, 462000, 538000, 685000, 405000, 555000, 478000,
  625000, 442000, 598000, 508000, 672000, 458000, 522000, 645000, 415000, 568000, 488000, 635000,
  425000, 585000,
];

export const medianPrice = 512000;

/** Each dot is a listing: price ($) vs. living area (sqft). */
export const listingScatter: { x: number; y: number }[] = [
  { x: 1180, y: 398000 },
  { x: 1420, y: 445000 },
  { x: 1650, y: 512000 },
  { x: 1890, y: 560000 },
  { x: 2100, y: 615000 },
  { x: 2340, y: 690000 },
  { x: 1520, y: 468000 },
  { x: 1760, y: 535000 },
  { x: 2010, y: 588000 },
  { x: 2480, y: 720000 },
  { x: 1340, y: 428000 },
  { x: 1620, y: 495000 },
  { x: 1980, y: 572000 },
  { x: 2260, y: 648000 },
  { x: 1440, y: 455000 },
  { x: 2150, y: 605000 },
];
/** The listing currently being previewed — the focal dot. */
export const focalListing = { x: 2100, y: 615000 };

/** Active inventory by property type (metro-wide). */
export const inventoryByType: { label: string; value: number }[] = [
  { label: "Single-family", value: 486 },
  { label: "Condo", value: 312 },
  { label: "Townhouse", value: 168 },
  { label: "Multi-family", value: 74 },
];

/** Days-on-market across active + recently-sold listings. */
export const daysOnMarket: number[] = [
  4, 7, 9, 11, 6, 14, 8, 21, 12, 17, 5, 9, 28, 13, 10, 34, 7, 16, 11, 24, 8, 19, 6, 12, 41, 9, 15,
  22, 7, 13, 18, 10, 31, 8, 14, 26, 11, 9, 37, 12,
];

export const marketStats = [
  { label: "Median price", value: 512000, from: 486000, format: usd, positive: "up" as const },
  {
    label: "Active inventory",
    value: 1040,
    from: 1180,
    format: { maximumFractionDigits: 0 },
    positive: "down" as const,
  },
  { label: "Price / sqft", value: 289, from: 271, format: usdSqft, positive: "up" as const },
  { label: "Sale-to-list", value: 1.012, from: 0.997, format: pct, positive: "up" as const },
];

/* --- heat-cell matrix: neighborhood × metric intensity (shared 0–100 scale) */

export const heatMetrics = ["Demand", "Apprec.", "$/sqft", "Liquid.", "Compet."] as const;

/** One 0–100 intensity per (neighborhood, metric). Shared domain across all cells. */
export const heatMatrix: { name: string; values: number[] }[] = neighborhoods.map((n) => {
  const demand = 100 - Math.min(100, n.dom * 2.6); // faster market = hotter
  const appreciation = Math.max(0, Math.min(100, (n.yoy + 0.03) * 560));
  const ppsf = Math.max(0, Math.min(100, (n.ppsf - 235) * 1.05));
  const liquidity = Math.max(0, Math.min(100, 120 - n.inventory * 0.42));
  const competition = Math.max(0, Math.min(100, (n.saleToList - 0.95) * 850));
  return {
    name: n.name,
    values: [demand, appreciation, ppsf, liquidity, competition].map((v) => Math.round(v)),
  };
});
export const heatDomain: [number, number] = [0, 100];

/** $/sqft leaderboard — dot-plot on a common scale. */
export const ppsfLeaderboard: { label: string; value: number }[] = neighborhoods
  .map((n) => ({ label: n.name, value: n.ppsf }))
  .sort((a, b) => b.value - a.value);

/** $/sqft observations across neighborhoods — denser than one tick per name so
 *  the metro mark reads against a real field, not eight lonely ticks. */
export const ppsfObservations: number[] = neighborhoods.flatMap((n) => {
  const spread = [0.92, 0.96, 1, 1.03, 1.07];
  return spread.map((s) => Math.round(n.ppsf * s));
});
export const metroPpsf = 289;

/** 12-month absorption: sale rate (% of active inventory sold) vs sales volume. */
const salesVolume = walk(96, 12, 3.5, 26, 1);
export const absorption: { rate: number; volume: number }[] = salesVolume.map((vol, i) => ({
  rate: Math.max(0.04, Math.min(0.16, 0.062 + i * 0.004 + (rand() - 0.5) * 0.02)),
  volume: Math.max(40, vol),
}));

/** 12-month inventory flow: new listings in vs homes sold out. */
const inFlow = walk(128, 12, -1.5, 30, 1);
const outFlow = walk(104, 12, 2, 26, 1);
export const inventoryFlow: { in: number; out: number }[] = inFlow.map((v, i) => ({
  in: Math.max(30, v),
  out: Math.max(30, outFlow[i]!),
}));

/* ------------------------------------------------------------- listings view */

export interface Listing {
  id: string;
  address: string;
  neighborhood: string;
  beds: number;
  baths: number;
  sqft: number;
  list: number;
  offer: number;
  estimate: number;
  dom: number;
  /** 8-point weekly price history ($). */
  history: number[];
  /** Comparable recent sale prices near this home ($). */
  comps: number[];
  /** Signed list-price adjustments over the marketing window ($). */
  adjustments: { label: string; value: number }[];
}

export const listings: Listing[] = [
  {
    id: "1",
    address: "418 Marlowe St",
    neighborhood: "Mission Hills",
    beds: 3,
    baths: 2,
    sqft: 1780,
    list: 585000,
    offer: 602000,
    estimate: 578000,
    dom: 9,
    history: [592000, 590000, 589000, 585000, 585000, 585000, 598000, 602000],
    comps: [548000, 561000, 566000, 572000, 578000, 583000, 590000, 604000, 612000],
    adjustments: [
      { label: "List", value: 592000 },
      { label: "Wk 2", value: -7000 },
      { label: "Wk 4", value: 0 },
      { label: "Offer", value: 17000 },
    ],
  },
  {
    id: "2",
    address: "12 Harborview Ct",
    neighborhood: "Harborview",
    beds: 4,
    baths: 3,
    sqft: 2340,
    list: 720000,
    offer: 705000,
    estimate: 731000,
    dom: 21,
    history: [745000, 740000, 735000, 728000, 720000, 720000, 712000, 705000],
    comps: [688000, 702000, 715000, 724000, 731000, 738000, 745000, 758000],
    adjustments: [
      { label: "List", value: 745000 },
      { label: "Wk 3", value: -17000 },
      { label: "Wk 5", value: -8000 },
      { label: "Offer", value: -15000 },
    ],
  },
  {
    id: "3",
    address: "907 Cedar Park Dr",
    neighborhood: "Cedar Park",
    beds: 2,
    baths: 2,
    sqft: 1180,
    list: 398000,
    offer: 415000,
    estimate: 402000,
    dom: 5,
    history: [389000, 392000, 395000, 398000, 398000, 405000, 410000, 415000],
    comps: [372000, 384000, 391000, 398000, 402000, 408000, 414000, 421000],
    adjustments: [
      { label: "List", value: 389000 },
      { label: "Wk 1", value: 9000 },
      { label: "Offer", value: 17000 },
    ],
  },
  {
    id: "4",
    address: "233 Oakridge Ln",
    neighborhood: "Oakridge",
    beds: 3,
    baths: 2,
    sqft: 1650,
    list: 512000,
    offer: 512000,
    estimate: 508000,
    dom: 12,
    history: [518000, 516000, 514000, 512000, 512000, 512000, 512000, 512000],
    comps: [488000, 496000, 502000, 508000, 512000, 516000, 522000, 531000],
    adjustments: [
      { label: "List", value: 518000 },
      { label: "Wk 2", value: -6000 },
      { label: "Offer", value: 0 },
    ],
  },
  {
    id: "5",
    address: "55 Lakeside Ave",
    neighborhood: "Lakeside",
    beds: 4,
    baths: 3,
    sqft: 2480,
    list: 690000,
    offer: 724000,
    estimate: 701000,
    dom: 3,
    history: [672000, 678000, 685000, 690000, 690000, 705000, 718000, 724000],
    comps: [656000, 672000, 685000, 694000, 701000, 710000, 720000, 736000],
    adjustments: [
      { label: "List", value: 672000 },
      { label: "Wk 1", value: 18000 },
      { label: "Offer", value: 34000 },
    ],
  },
  {
    id: "6",
    address: "1408 Sunset Terrace",
    neighborhood: "Sunset Terrace",
    beds: 2,
    baths: 1,
    sqft: 1340,
    list: 428000,
    offer: 419000,
    estimate: 434000,
    dom: 28,
    history: [448000, 444000, 440000, 435000, 428000, 428000, 422000, 419000],
    comps: [408000, 418000, 425000, 431000, 434000, 440000, 447000, 455000],
    adjustments: [
      { label: "List", value: 448000 },
      { label: "Wk 2", value: -13000 },
      { label: "Wk 4", value: -7000 },
      { label: "Offer", value: -9000 },
    ],
  },
  {
    id: "7",
    address: "76 Grove District Pl",
    neighborhood: "Grove District",
    beds: 3,
    baths: 2,
    sqft: 1890,
    list: 560000,
    offer: 578000,
    estimate: 566000,
    dom: 7,
    history: [552000, 555000, 558000, 560000, 560000, 568000, 574000, 578000],
    comps: [532000, 544000, 552000, 559000, 566000, 573000, 581000, 592000],
    adjustments: [
      { label: "List", value: 552000 },
      { label: "Wk 2", value: 8000 },
      { label: "Offer", value: 18000 },
    ],
  },
  {
    id: "8",
    address: "340 Riverside Blvd",
    neighborhood: "Riverside",
    beds: 5,
    baths: 4,
    sqft: 2260,
    list: 648000,
    offer: 640000,
    estimate: 655000,
    dom: 16,
    history: [662000, 658000, 654000, 650000, 648000, 648000, 644000, 640000],
    comps: [618000, 632000, 644000, 651000, 655000, 662000, 671000, 684000],
    adjustments: [
      { label: "List", value: 662000 },
      { label: "Wk 3", value: -14000 },
      { label: "Offer", value: -8000 },
    ],
  },
];

/** The listing spotlighted at the top of the Listings view. */
export const featured = listings[4]!; // 55 Lakeside Ave — the bidding-war story

/**
 * Featured listing lifecycle for the event-timeline. Point events + one span.
 * A fixed reference "today" keeps the render deterministic (no Date.now()).
 */
export const today = new Date("2026-07-16T00:00:00Z");
const day = 86400000;
export const lifecycle: {
  start: Date;
  end?: Date;
  label?: string;
  kind?: "neutral" | "positive" | "negative" | "accent";
}[] = [
  { start: new Date(today.getTime() - 24 * day), label: "Listed", kind: "accent" },
  {
    start: new Date(today.getTime() - 22 * day),
    end: new Date(today.getTime() - 15 * day),
    label: "Showings",
    kind: "neutral",
  },
  { start: new Date(today.getTime() - 21 * day), label: "Open house", kind: "neutral" },
  { start: new Date(today.getTime() - 14 * day), label: "First offer", kind: "positive" },
  { start: new Date(today.getTime() - 12 * day), label: "Under contract", kind: "positive" },
  { start: new Date(today.getTime() - 3 * day), label: "Pending", kind: "accent" },
];
export const timelineDomain: [Date, Date] = [
  new Date(today.getTime() - 26 * day),
  new Date(today.getTime() + 4 * day),
];

/** Recent + upcoming closings, calendar-strip (value = homes closing that day). */
export const closings: { date: string; value: number }[] = (() => {
  const out: { date: string; value: number }[] = [];
  const end = new Date("2026-07-18T00:00:00Z");
  for (let i = 0; i < 42; i++) {
    const d = new Date(end.getTime() - i * day);
    const dow = d.getUTCDay();
    // Closings cluster on weekdays, end-of-month; sparse on weekends.
    let base = dow === 0 || dow === 6 ? 0 : 1 + Math.floor(rand() * 3);
    if (d.getUTCDate() >= 27) base += Math.floor(rand() * 3);
    if (rand() < 0.18) base = 0;
    out.push({ date: d.toISOString().slice(0, 10), value: base });
  }
  return out.reverse();
})();

/* -------------------------------------------------------------- compare view */

/** List price → sale price by neighborhood (median, $). */
export const listToSale: { label: string; from: number; to: number }[] = [
  { label: "Lakeside", from: 665000, to: 698000 },
  { label: "Mission Hills", from: 575000, to: 592000 },
  { label: "Grove District", from: 548000, to: 559000 },
  { label: "Oakridge", from: 505000, to: 508000 },
  { label: "Cedar Park", from: 402000, to: 411000 },
  { label: "Sunset Terrace", from: 435000, to: 421000 },
];

/** Median price last year → this year by neighborhood ($). */
export const yearOverYear: { label: string; from: number; to: number }[] = [
  { label: "Lakeside", from: 612000, to: 698000 },
  { label: "Mission Hills", from: 548000, to: 592000 },
  { label: "Grove District", from: 531000, to: 559000 },
  { label: "Oakridge", from: 498000, to: 508000 },
  { label: "Cedar Park", from: 421000, to: 411000 },
];

/** Sales mix over 12 months — three buyer segments (unit counts). */
export const salesMix: { label: string; values: number[] }[] = [
  { label: "First-time", values: [82, 78, 91, 104, 118, 132, 141, 128, 116, 98, 88, 94] },
  { label: "Move-up", values: [64, 68, 72, 79, 88, 96, 102, 95, 84, 76, 70, 73] },
  { label: "Investor", values: [38, 42, 45, 41, 48, 52, 56, 61, 54, 47, 43, 46] },
];

/** List vs sale (median $) by region — paired bars. */
export const listVsSale: { label: string; value: number; ref: number }[] = listToSale.map((d) => ({
  label: d.label,
  value: d.to, // sale
  ref: d.from, // list
}));

/** Property type → subtype composition (units listed metro-wide) — partition. */
export const typeComposition: { label: string; children: { label: string; value: number }[] }[] = [
  {
    label: "Single-family",
    children: [
      { label: "Detached", value: 342 },
      { label: "Ranch", value: 96 },
      { label: "Estate", value: 48 },
    ],
  },
  {
    label: "Condo",
    children: [
      { label: "High-rise", value: 148 },
      { label: "Low-rise", value: 118 },
      { label: "Loft", value: 46 },
    ],
  },
  {
    label: "Townhouse",
    children: [
      { label: "Interior", value: 104 },
      { label: "End-unit", value: 64 },
    ],
  },
  {
    label: "Multi-family",
    children: [
      { label: "Duplex", value: 44 },
      { label: "Triplex", value: 30 },
    ],
  },
];

/** Closed sales by price level ($ bucket → count) — volume profile. */
export const salesByPrice: { level: number; weight: number }[] = [
  { level: 375000, weight: 38 },
  { level: 425000, weight: 71 },
  { level: 475000, weight: 118 },
  { level: 525000, weight: 156 },
  { level: 575000, weight: 141 },
  { level: 625000, weight: 98 },
  { level: 675000, weight: 62 },
  { level: 725000, weight: 34 },
  { level: 775000, weight: 15 },
];

/** Three flagged listings benchmarked against their own comp set ($/sqft) —
 * a small-multiples row, drawn to one shared scale via SparkGroup. */
export const benchmarks: { name: string; value: number; cohort: number[] }[] = [
  {
    name: "418 Marlowe St",
    value: 329,
    cohort: [278, 291, 297, 302, 308, 314, 319, 326, 333, 341, 352],
  },
  {
    name: "12 Harborview Ct",
    value: 301,
    cohort: [275, 288, 296, 304, 312, 319, 327, 335, 344, 353, 363],
  },
  {
    name: "55 Lakeside Ave",
    value: 292,
    cohort: [255, 268, 275, 282, 289, 296, 303, 310, 318, 327, 337],
  },
];
