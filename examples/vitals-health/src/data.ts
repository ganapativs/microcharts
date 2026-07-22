// Believable mock health data for the "Vitals" example dashboard.
// A single pinned "today" keeps every generated series deterministic.

export const TODAY = "2026-07-15";

const iso = (d: Date): string => d.toISOString().slice(0, 10);

/** ISO date `days` before (positive) the pinned TODAY. */
function daysBefore(days: number): string {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return iso(d);
}

// A tiny seeded PRNG so the "random-looking" series never reshuffle per reload.
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

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

// ─── shared palette (mid-tone so it reads on cream AND warm-dark) ──────────

export const C = {
  coral: "#D9573D", // move / steps / primary accent
  green: "#2FA07C", // exercise / workouts
  amber: "#C79038", // stand / weight
  blue: "#5B84B4", // sleep
  plum: "#9A6BA6", // REM / accents
} as const;

// ─── TODAY ────────────────────────────────────────────────────────────────

/** Move / Exercise / Stand style activity rings. */
export const rings = [
  { key: "move", label: "Move", value: 512, max: 600, unit: "kcal", color: C.coral },
  { key: "exercise", label: "Exercise", value: 38, max: 45, unit: "min", color: C.green },
  { key: "stand", label: "Stand", value: 10, max: 12, unit: "hrs", color: C.amber },
] as const;

/** Steps per hour across the day (midnight → 11pm). */
export const hourlySteps: number[] = [
  0, 0, 0, 0, 0, 120, 640, 1180, 720, 340, 210, 880, 1460, 520, 300, 260, 410, 980, 1620, 1240, 560,
  220, 90, 40,
];

export const totalStepsToday = hourlySteps.reduce((a, b) => a + b, 0);

/** Macronutrient split for the day, in grams. */
export const macros = [
  { label: "Carbs", value: 246 },
  { label: "Protein", value: 128 },
  { label: "Fat", value: 61 },
];

export const macroColors = ["#E0A23C", "#C25B43", "#7C9A6B"];

export const restingHrDelta = -3; // bpm vs last week (down is good)
export const activeCalDelta = { value: 512, from: 468 }; // kcal vs yesterday

/** Recovery / strain right now (0 calm … 1 strained). Lower is better rested. */
export const recovery = 0.31;

/** Heart-rate time-in-zone today, in minutes. Order is semantic, low → high. */
export const hrZones = {
  below: 618, // resting / light
  in: 486, // fat-burn target band
  above: 214, // cardio
  severeAbove: 58, // peak
};

/** Water intake — glasses of the 8-glass goal. */
export const water = { value: 6, total: 8 };

/** Current logged-workout streak, in days. */
export const streakDays = 12;

/** Daily energy goal for the thermometer gauge. */
export const energyGoal = { value: 512, target: 600, domain: [0, 800] as [number, number] };

/** In-progress workout for the ETA bar. */
export const activeWorkout = {
  progress: 0.62, // fraction complete
  elapsed: 22, // minutes in
  rate: 0.62 / 22, // fraction per minute → ~13 min left
};

// ─── SLEEP ──────────────────────────────────────────────────────────────

/**
 * One night of sleep stages. `t` is minutes from lights-out; each state holds
 * until the next entry. Ends around 7h35m.
 */
export const sleepStages = [
  { t: 0, state: "Awake" },
  { t: 8, state: "Light" },
  { t: 22, state: "Deep" },
  { t: 62, state: "Light" },
  { t: 78, state: "REM" },
  { t: 96, state: "Light" },
  { t: 112, state: "Deep" },
  { t: 158, state: "Light" },
  { t: 176, state: "REM" },
  { t: 202, state: "Light" },
  { t: 214, state: "Awake" },
  { t: 220, state: "Light" },
  { t: 246, state: "Deep" },
  { t: 286, state: "Light" },
  { t: 300, state: "REM" },
  { t: 332, state: "Light" },
  { t: 352, state: "Deep" },
  { t: 388, state: "Light" },
  { t: 404, state: "REM" },
  { t: 438, state: "Light" },
  { t: 455, state: "Awake" },
];

export const sleepStates = ["Awake", "REM", "Light", "Deep"];
// warm → cool as sleep deepens
export const sleepStateColors = ["#D89A6A", "#B57BA6", "#7FA8C9", "#4E74A4"];

/** Nightly sleep duration (hours) over the last 14 nights, oldest → newest. */
export const sleepDuration: number[] = [
  7.1, 6.4, 7.8, 8.0, 6.9, 5.8, 7.3, 7.6, 8.1, 6.7, 7.0, 7.9, 6.5, 7.6,
];

/** Sleep-consistency score (0–100) per day over the last 8 weeks. */
export const sleepConsistency: { date: string; value: number }[] = (() => {
  const rnd = mulberry32(42);
  const out: { date: string; value: number }[] = [];
  for (let i = 55; i >= 0; i--) {
    const base = 62 + Math.sin((55 - i) / 4) * 14;
    const jitter = (rnd() - 0.4) * 28;
    const v = clamp(Math.round(base + jitter), 28, 98);
    out.push({ date: daysBefore(i), value: v });
  }
  return out;
})();

/**
 * Movement per hour over a 24h clock (0 = midnight). Low overnight, two daytime
 * peaks — the sleep/wake shape of a day. `now` accents the current hour.
 */
export const dayCycle: number[] = [
  4, 2, 1, 1, 2, 6, 24, 52, 63, 40, 34, 58, 71, 44, 30, 36, 49, 66, 88, 74, 55, 38, 20, 9,
];
export const dayCycleNow = 21; // 9pm — winding down

/** Wellness-cycle marker (0 → 1). Day 19 of a 28-day block. */
export const cyclePhase = 19 / 28;

/**
 * Circadian resting heart rate: a low overnight trough, a morning climb, a
 * daytime plateau. Folded across ~14 nights, with last night overlaid.
 */
function circadianHr(hour: number, rnd: () => number, spread = 1): number {
  // trough ~4am, peak ~7pm
  const phase = ((hour - 4 + 24) % 24) / 24; // 0 at 4am
  const base = 55 + 15 * Math.sin(phase * Math.PI); // 55 → ~70 → 55
  return Math.round((base + (rnd() - 0.5) * 6 * spread) * 10) / 10;
}

export const foldedHr: { t: number; value: number }[] = (() => {
  const rnd = mulberry32(19);
  const out: { t: number; value: number }[] = [];
  for (let day = 0; day < 14; day++) {
    for (let h = 0; h < 24; h++) {
      out.push({ t: day * 24 + h, value: circadianHr(h, rnd) });
    }
  }
  return out;
})();

export const foldedHrToday: { t: number; value: number }[] = (() => {
  const rnd = mulberry32(77);
  const out: { t: number; value: number }[] = [];
  for (let h = 0; h < 24; h++) out.push({ t: h, value: circadianHr(h, rnd, 0.5) - 1.5 });
  return out;
})();

// ─── MOVE ───────────────────────────────────────────────────────────────

/** Daily workout minutes over the last 16 weeks (112 days), oldest → newest. */
export const workoutStreak: number[] = (() => {
  const rnd = mulberry32(7);
  const out: number[] = [];
  for (let i = 0; i < 112; i++) {
    const dow = i % 7;
    // rest-ish on Mondays/Fridays, hard sessions midweek + weekend long runs
    const rest = dow === 0 || dow === 4;
    const roll = rnd();
    if (rest && roll < 0.65) out.push(0);
    else if (roll < 0.18) out.push(0);
    else out.push(Math.round(18 + rnd() * (dow === 6 ? 74 : 46)));
  }
  return out;
})();

/** First calendar day of the workout grid, for weekday alignment. */
export const workoutStart = daysBefore(111);

/** Pass/fail workout history (did I train?) — last 63 days, oldest → newest. */
export const workoutDone: boolean[] = workoutStreak.slice(-63).map((m) => m > 0);

/**
 * Workout minutes by weekday, 12 weeks, Monday-first row-major (index 0 = a
 * Monday). CyclePlot reshapes into 7 slots so each weekday shows its own shape.
 */
export const weekdayMinutes: number[] = (() => {
  const rnd = mulberry32(23);
  // Mon light, Tue–Thu solid, Fri light, Sat long, Sun moderate
  const shape = [22, 46, 52, 48, 20, 78, 40];
  const out: number[] = [];
  for (let w = 0; w < 12; w++) {
    for (let d = 0; d < 7; d++) {
      const drift = w * 0.6 * (d === 5 ? 1.4 : 1); // Saturdays creep up over time
      const v = shape[d] + drift + (rnd() - 0.5) * 16;
      out.push(Math.round(clamp(v, 0, 120)));
    }
  }
  return out;
})();

export const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A full year of daily active minutes for the spiral (365 days). */
export const yearActivity: number[] = (() => {
  const rnd = mulberry32(101);
  const out: number[] = [];
  for (let i = 0; i < 365; i++) {
    const dow = i % 7;
    // gentle seasonal swell: quieter deep winter, busier spring & late summer
    const season = 34 + 20 * Math.sin(((i - 60) / 365) * Math.PI * 2);
    const weekend = dow === 6 ? 22 : dow === 5 ? 10 : 0;
    const rest = (dow === 0 || dow === 4) && rnd() < 0.5;
    const v = rest ? rnd() * 8 : season + weekend + (rnd() - 0.4) * 30;
    out.push(Math.round(clamp(v, 0, 120)));
  }
  return out;
})();

export const yearStart = daysBefore(364);

/** Saturday long-run elevation profile: distance (m) + elevation (m). */
export const runRoute: { d: number; elev: number }[] = (() => {
  const rnd = mulberry32(55);
  const out: { d: number; elev: number }[] = [];
  let elev = 42;
  for (let d = 0; d <= 10000; d += 250) {
    const km = d / 1000;
    // a valley dip, a long climb to ~7.5k, then a descent home
    const ridge =
      42 +
      58 * Math.sin((km / 10) * Math.PI) +
      26 * Math.sin((km / 10) * Math.PI * 3) +
      (rnd() - 0.5) * 6;
    elev = clamp(ridge, 20, 180);
    out.push({ d, elev: Math.round(elev * 10) / 10 });
  }
  return out;
})();

// ─── TRENDS ─────────────────────────────────────────────────────────────

/** Weekly goal progress bullets. */
export const goals = [
  {
    label: "Steps",
    value: 58200,
    target: 70000,
    bands: [40000, 60000],
    domain: [0, 84000] as [number, number],
    unit: "steps",
    color: C.coral,
  },
  {
    label: "Active minutes",
    value: 214,
    target: 250,
    bands: [120, 200],
    domain: [0, 300] as [number, number],
    unit: "min",
    color: C.green,
  },
  {
    label: "Workouts",
    value: 4,
    target: 5,
    bands: [2, 4],
    domain: [0, 7] as [number, number],
    unit: "sessions",
    color: C.amber,
  },
];

/** Body-weight trend (kg) over the last 12 weeks, oldest → newest. */
export const weightTrend: number[] = [
  76.4, 76.1, 76.3, 75.8, 75.5, 75.6, 75.1, 74.8, 74.9, 74.4, 74.1, 73.8,
];

export const weightDomain: [number, number] = [70, 78];

/** Daily step totals over the last 90 days — the distribution behind today. */
export const stepDistribution: number[] = (() => {
  const rnd = mulberry32(88);
  const out: number[] = [];
  for (let i = 0; i < 90; i++) {
    const dow = i % 7;
    const base = dow === 6 ? 12500 : dow === 0 ? 6200 : 8600;
    const v = base + (rnd() - 0.5) * 5200;
    out.push(Math.round(clamp(v, 2400, 18500)));
  }
  return out;
})();

export const stepDistributionDomain: [number, number] = [2000, 19000];

/** Mean daily steps over the same 90-day window, for the "vs typical" delta. */
export const avgDailySteps = Math.round(
  stepDistribution.reduce((a, b) => a + b, 0) / stepDistribution.length,
);

/** Fitness percentile vs peers, one reading per week for 26 weeks (0–100). */
export const fitnessPercentile: number[] = (() => {
  const rnd = mulberry32(64);
  const out: number[] = [];
  let p = 47;
  for (let i = 0; i < 26; i++) {
    p += (rnd() - 0.38) * 6; // slow upward drift with wobble
    out.push(Math.round(clamp(p, 5, 95)));
  }
  return out;
})();

/** Weight forecast cone — 8 weeks ahead from the last actual. */
export const weightForecast = (() => {
  const mid = [73.5, 73.2, 72.9, 72.6, 72.4, 72.2, 72.0, 71.8];
  const p80 = mid.map((m, i): [number, number] => {
    const hw = 0.35 + i * 0.18;
    return [Math.round((m - hw) * 10) / 10, Math.round((m + hw) * 10) / 10];
  });
  return { mid, p80 };
})();
export const weightTarget = 72;
