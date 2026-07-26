// Hypnogram geometry — pure, React-free. A categorical
// step strip that REFUSES interpolation: state is a fact, not a sample of a
// continuum, so runs are right-angle (H/V) only — never a diagonal. Consecutive
// same-state entries merge; the last state holds to domain[1]. 2-dp.
import { round2 } from "../../core/types.js";
import { labelFitsBand, labelFont, textGutterProse } from "../../core/labels.js";

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

/** Row-label layout: whether the state names are drawn, and the gutter they cost. */
export interface HypnoLabelLayout {
  show: boolean;
  /** Left gutter reserved for the names — 0 when they're dropped. */
  gutter: number;
  fontSize: number;
}

/**
 * Resolve the row-label gutter — the ONE place the static and interactive
 * entries agree on it, because the gutter shifts every run's x and a
 * second-guessed copy drifts the hit-test off the drawn marks.
 *
 * The names degrade in two directions, and either one drops them outright
 * rather than letting them overlap or spill:
 *
 *  - **Vertically** the rows are the budget. Each name is centred on its row, so
 *    once the row pitch is under one em the names of adjacent states stack on
 *    each other ("Awake" on "REM"), and the top and bottom rows push their
 *    em-boxes past the viewBox edge. `labelFont` floors at 7, so there is no
 *    smaller type to fall back to — the scaffold goes and the runs keep the box.
 *  - **Horizontally** the widest name is the budget, reserved at the library's
 *    PROSE per-char over-estimate. A state name is caller text ("Slow-wave", an
 *    all-caps "REM"), never a figure this chart formatted, so the digits rate
 *    `textGutter` is calibrated for under-reserves it — and `.mc-root` is
 *    `overflow: visible`, so the surplus paints into the page. Unknown width also
 *    means the reserve can outgrow the sensible share of a narrow chart (40%);
 *    when it does, the old behaviour was to CLAMP the gutter, which silently slid
 *    the text out through the left edge. Dropping is the honest degradation.
 *
 * The data is never the thing that degrades: the runs simply reclaim the gutter.
 */
export function hypnogramLabels(opts: {
  labels: boolean;
  width: number;
  height: number;
  rows: number;
  /** Chars in the widest state name. */
  maxChars: number;
}): HypnoLabelLayout {
  const { labels, width, height, rows, maxChars } = opts;
  const n = Math.max(1, rows);
  const fontSize = labelFont(height / n, 0.62);
  const gutter = textGutterProse(Math.max(1, maxChars), fontSize, 4);
  // the pitch geometry actually lays the rows out on — the padded band, split n ways
  const rowPitch = (height - PAD * 2) / n;
  const show = labels && labelFitsBand(rowPitch, fontSize) && gutter <= width * 0.4;
  return { show, gutter: show ? gutter : 0, fontSize };
}

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
  domain: readonly [number, number];
  width: number;
  height: number;
  style: "steps" | "lanes";
  /** Left gutter reserved for row labels (plot starts here). */
  gutter?: number;
}): {
  runs: HypnoRun[];
  path: string;
  connectors: string;
  rowHeight: number;
  rowY: number[];
  /** Row stack, top and bottom edges — the padded band the rows divide up. */
  y0: number;
  y1: number;
} {
  const { data, states, domain, width, height, style, gutter = 0 } = opts;
  const merged = mergeRuns(data, domain[1]);
  const n0 = Math.max(1, states.length);
  const rowY0 = Array.from({ length: n0 }, (_v, r) =>
    round2(PAD + ((height - PAD * 2) / n0) * (r + 0.5)),
  );
  if (merged.length === 0)
    return {
      runs: [],
      path: "",
      connectors: "",
      rowHeight: round2((height - PAD * 2) / n0),
      rowY: rowY0,
      y0: PAD,
      y1: round2(height - PAD),
    };

  const [d0, d1] = domain;
  const span = d1 - d0 || 1;
  const x0 = gutter + PAD;
  const innerW = width - gutter - PAD * 2;
  const innerH = height - PAD * 2;
  const n = Math.max(1, states.length);
  const rowH = innerH / n;

  const xOf = (t: number): number => round2(x0 + ((t - d0) / span) * innerW);
  const rowIndex = (state: string): number => {
    const i = states.indexOf(state);
    return i < 0 ? 0 : i;
  };
  const stepY = (row: number): number => round2(PAD + rowH * (row + 0.5));
  const laneY = (row: number): number => round2(PAD + rowH * row);
  const rowY = Array.from({ length: n }, (_v, r) => stepY(r));

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

  return {
    runs,
    path,
    connectors,
    rowHeight: round2(rowH),
    rowY,
    y0: PAD,
    y1: round2(height - PAD),
  };
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
