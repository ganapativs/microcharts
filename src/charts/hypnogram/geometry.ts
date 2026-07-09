// Hypnogram geometry — pure, React-free (plan/25 §2, plan/17 F8). A categorical
// step strip that REFUSES interpolation: state is a fact, not a sample of a
// continuum, so runs are right-angle (H/V) only — never a diagonal. Consecutive
// same-state entries merge; the last state holds to domain[1]. 2-dp.
import { round2 } from "../../core/types.js";

export interface HypnoEntry {
  t: number;
  state: string;
}

export interface HypnoRun {
  x0: number;
  x1: number;
  /** Row-center y (steps) / lane-top y (lanes). */
  y: number;
  row: number;
  state: string;
  t0: number;
  t1: number;
}

const PAD = 1;

/** Sort by t, merge consecutive same-state runs into [t0, t1] spans. */
export function mergeRuns(data: readonly HypnoEntry[], domainEnd: number): HypnoEntry[] {
  const sorted = [...data].filter((d) => Number.isFinite(d.t)).sort((a, b) => a.t - b.t);
  const merged: HypnoEntry[] = [];
  for (const e of sorted) {
    if (merged.length === 0 || merged[merged.length - 1]!.state !== e.state) merged.push(e);
  }
  void domainEnd;
  return merged;
}

export function hypnogramGeometry(opts: {
  data: readonly HypnoEntry[];
  states: readonly string[];
  domain: [number, number];
  width: number;
  height: number;
  style: "steps" | "lanes";
}): { runs: HypnoRun[]; path: string; connectors: string; rowHeight: number } {
  const { data, states, domain, width, height, style } = opts;
  const merged = mergeRuns(data, domain[1]);
  if (merged.length === 0) return { runs: [], path: "", connectors: "", rowHeight: 0 };

  const [d0, d1] = domain;
  const span = d1 - d0 || 1;
  const innerW = width - PAD * 2;
  const innerH = height - PAD * 2;
  const n = Math.max(1, states.length);
  const rowH = innerH / n;

  const xOf = (t: number): number => round2(PAD + ((t - d0) / span) * innerW);
  const rowIndex = (state: string): number => {
    const i = states.indexOf(state);
    return i < 0 ? 0 : i;
  };
  const stepY = (row: number): number => round2(PAD + rowH * (row + 0.5));
  const laneY = (row: number): number => round2(PAD + rowH * row);

  const runs: HypnoRun[] = merged.map((e, i) => {
    const t0 = e.t;
    const t1 = i + 1 < merged.length ? merged[i + 1]!.t : d1;
    const row = rowIndex(e.state);
    return {
      x0: xOf(t0),
      x1: xOf(t1),
      y: style === "lanes" ? laneY(row) : stepY(row),
      row,
      state: e.state,
      t0,
      t1,
    };
  });

  // steps: horizontal segment per run (path) + vertical transition strokes
  // (connectors) kept separate so `connectors={false}` can drop them.
  let path = "";
  let connectors = "";
  if (style === "steps") {
    for (const r of runs) path += `M${r.x0} ${r.y}H${r.x1}`;
    for (let i = 1; i < runs.length; i++) {
      const x = runs[i]!.x0;
      connectors += `M${x} ${runs[i - 1]!.y}V${runs[i]!.y}`;
    }
  }

  return { runs, path, connectors, rowHeight: round2(rowH) };
}

/** Distinct states in first-appearance order (the default row order). */
export function firstAppearance(data: readonly HypnoEntry[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of [...data].sort((a, b) => a.t - b.t)) {
    if (!seen.has(d.state)) {
      seen.add(d.state);
      out.push(d.state);
    }
  }
  return out;
}
