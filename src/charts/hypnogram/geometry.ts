// Hypnogram: A categorical
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

/** One merged run, clipped to the window. */
export interface HypnoSpan {
  state: string;
  t0: number;
  t1: number;
}

/**
 * The runs a window actually holds: merge, then CLIP each span to `domain`.
 *
 * An explicit `domain` is a window — a caller overfetching around it is normal
 * — and a run outside it used to be scaled anyway. `.mc-root` is
 * `overflow: visible`, so it spills across the page rather than clipping:
 * `domain={[20, 60]}` over a 90-minute night painted x −5 → 211 in a 140-unit
 * box, and `domain={[-200, -100]}` painted the ENTIRE strip off the right edge
 * while the accessible name still read "6 transitions across 4 states".
 *
 * The state that HOLDS at the window start keeps its row and starts at the
 * edge — dropping it would misreport what the system was doing at t=d0 — and
 * the last state still holds to `domain[1]`. Both entries and the summary read
 * this one list, so the announced run count is the painted run count.
 */
export function hypnoSpans(
  data: readonly HypnoEntry[],
  domain: readonly [number, number],
): HypnoSpan[] {
  const [d0, d1] = domain;
  const merged = mergeRuns(data, d1);
  const spans: HypnoSpan[] = [];
  for (let i = 0; i < merged.length; i++) {
    const e = merged[i]!;
    const end = i + 1 < merged.length ? merged[i + 1]!.t : d1;
    // half-open: a run ending exactly at the window start contributes nothing
    if (end <= d0 || e.t >= d1) continue;
    spans.push({ state: e.state, t0: e.t < d0 ? d0 : e.t, t1: end > d1 ? d1 : end });
  }
  return spans;
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
  const spans = hypnoSpans(data, domain);
  const n0 = Math.max(1, states.length);
  const rowY0 = Array.from({ length: n0 }, (_v, r) =>
    round2(PAD + ((height - PAD * 2) / n0) * (r + 0.5)),
  );
  if (spans.length === 0)
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
  const x0 = gutter + PAD;
  const innerW = width - gutter - PAD * 2;
  const innerH = height - PAD * 2;
  const n = Math.max(1, states.length);
  const rowH = innerH / n;

  // `d1 - d0 || 1` was the old span, and it is not a scale: NaN, 0 and an
  // overflowing difference all became a span of ONE, so `domain={[0, NaN]}`
  // painted a 90-minute night ~8700 units wide in a 140-unit box. Callers
  // resolve the window first (`resolveDomain`); anything that still isn't a
  // usable span collapses the strip to the box centre, the way core
  // `scaleLinear` handles a degenerate domain — contained, and visibly wrong.
  const span = d1 - d0;
  const usable = Number.isFinite(span) && span > 0 && Number.isFinite(d0);
  const k = usable ? innerW / span : 0;
  const mid = round2(x0 + innerW / 2);
  const xOf = (t: number): number => (usable ? round2(x0 + (t - d0) * k) : mid);
  const rowIndex = (state: string): number => {
    const i = states.indexOf(state);
    return i < 0 ? 0 : i;
  };
  const stepY = (row: number): number => round2(PAD + rowH * (row + 0.5));
  const laneY = (row: number): number => round2(PAD + rowH * row);
  const rowY = Array.from({ length: n }, (_v, r) => stepY(r));

  const runs: HypnoRun[] = spans.map((s) => {
    const row = rowIndex(s.state);
    return {
      x0: xOf(s.t0),
      x1: xOf(s.t1),
      y: style === "lanes" ? laneY(row) : stepY(row),
      row,
      state: s.state,
      t0: s.t0,
      t1: s.t1,
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

/**
 * Distinct states in first-appearance order (the default row order).
 *
 * Non-finite `t` is filtered here for the same reason `mergeRuns` filters it:
 * a state that only ever appears at an unplottable time was still given a row,
 * so the strip drew an empty "B" lane while the accessible name counted one
 * state. Rows and runs read the same entries.
 */
export function firstAppearance(data: readonly HypnoEntry[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of [...data].filter((e) => Number.isFinite(e.t)).sort((a, b) => a.t - b.t)) {
    if (!seen.has(d.state)) {
      seen.add(d.state);
      out.push(d.state);
    }
  }
  return out;
}
