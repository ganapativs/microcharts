// CohortTriangle: Which vintage retains
// worst, compared at equal maturity. Rows = cohorts (input order top→bottom).
// columns = age; each cell is a rect shaded by a discrete retention level.
// Ragged rows: a cohort observed for fewer ages leaves its trailing columns
// empty, so the block reads as the classic retention triangle. Shares arrive as
// 0–1 or 0–100 (auto-detected) and quantize to 5 levels — color encodes a binned
// share, never a continuous illusion; a measured-but-missing slot is a gap, not a
// zero. Coords 2-dp, integer viewBox.
import { stepIndex } from "../../shared/cell.js";
import { labelFont, textGutterProse } from "../../core/labels.js";
import { clamp, maxOf } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

/** Empty track + four intensity steps — the shared stepped ramp calibration. */
export const LEVELS = 5;
/** Default number format — whole-percent (shared by both entries). */
export const PCT_FORMAT: Intl.NumberFormatOptions = {
  style: "percent",
  maximumFractionDigits: 0,
};
/** Admission caps — beyond these the block stops being glanceable. */
export const MAX_COHORTS = 12;
export const MAX_AGES = 12;

export interface CohortRow {
  label: string;
  /** Retention at age i (`values[i]`); `null`/non-finite = a gap slot. */
  values: readonly Value[];
}

interface CohortCell {
  row: number;
  col: number;
  x: number;
  y: number;
  /** Normalized retention fraction 0–1, or `null` for a measured-but-missing slot. */
  value: number | null;
  /** Discrete level 0..LEVELS-1; -1 for a gap slot. */
  level: number;
  gap: boolean;
}

interface CohortLabel {
  row: number;
  label: string;
  x: number;
  y: number;
}

export interface CohortTriangleGeometry {
  cells: CohortCell[];
  labels: CohortLabel[];
  rows: number;
  cols: number;
  gutter: number;
  width: number;
  height: number;
  step: number;
  /** The resolved `cell` / `gap` the cells were actually laid out against.
   *  Both entries must paint from THESE, never from the raw props — see
   *  `resolve` for what a raw value can be. */
  cell: number;
  gap: number;
  fontSize: number;
  showLabels: boolean;
  /** Ring around the highlighted cohort row, if `highlight` matches a label. */
  ring: { x: number; y: number; width: number; height: number } | null;
  /** Deepest age observed by every cohort (contiguous from 0); -1 if none. */
  commonAge: number;
  /** Worst-retaining cohort at `commonAge` (min value; ties → earliest input). */
  worst: { label: string; age: number; value: number } | null;
  /** Newest cohort's (last row's) first finite reading. */
  newestFirst: { label: string; value: number } | null;
}

export interface CohortTriangleGeometryOptions {
  /** Cell edge length in viewBox units. */
  cell?: number | undefined;
  /** Gap between cells. */
  gap?: number | undefined;
  /** Reserve a left gutter and place cohort labels (seat-gated by cell size). */
  labels?: boolean | undefined;
  /** Cohort label to ring (equal-maturity comparison focus). */
  highlight?: string | undefined;
}

// A share may arrive as 0–1 or 0–100; a max over 1.001 means percent input.
function detectScale(rows: readonly CohortRow[]): number {
  let max = 0;
  for (const r of rows) for (const v of r.values) if (isFiniteValue(v) && v > max) max = v;
  return max > 1.001 ? 1 / 100 : 1;
}

const norm = (v: Value, scale: number): number | null =>
  isFiniteValue(v) ? round2(clamp(v * scale, 0, 1)) : null;

/** A sizing number the host computes rather than types: `cell={boxPx / ages}`
 *  with `ages` momentarily 0 is `Infinity`, and `Number(input.value)` on an
 *  empty field is `NaN`. Both flowed straight into `step`, so the chart emitted
 *  `viewBox="0 0 NaN NaN"` and vanished while its accessible name still read
 *  the retention correctly; a negative `gap` marched the rows up and left, out
 *  of a viewBox `.mc-root` does not clip. Repair once, here, so every caller
 *  reads the numbers the cells were built on. */
function resolve(raw: number | undefined, fallback: number): number {
  return raw !== undefined && Number.isFinite(raw) && raw >= 0 ? raw : fallback;
}

export function cohortTriangleGeometry(
  data: readonly CohortRow[],
  opts: CohortTriangleGeometryOptions = {},
): CohortTriangleGeometry {
  const cell = resolve(opts.cell, 9);
  const gap = resolve(opts.gap, 2);
  const step = cell + gap;

  const rows = data.slice(0, MAX_COHORTS);
  const nRows = rows.length;
  const scale = detectScale(rows);

  const fontSize = labelFont(cell, 0.6);
  // labels seat only when the row is tall enough to hold the floor font; the
  // gutter is then sized to the widest label, deterministically.
  const showLabels = opts.labels === true && nRows > 0 && cell >= fontSize + 0.8;
  // Cohort names are CALLER text ("Jan", "2024 ENTERPRISE"), not figures this
  // library formatted, so they take the prose estimate. `textGutter`'s
  // digit-calibrated 0.62 left an all-caps vintage painting ~27 units past the
  // left edge of a viewBox `.mc-root` does not clip.
  const gutter = showLabels
    ? textGutterProse(maxOf(rows.map((r) => r.label.length)), fontSize, 3)
    : 0;

  const cols = nRows === 0 ? 0 : Math.min(MAX_AGES, maxOf(rows.map((r) => r.values.length)));

  const cells: CohortCell[] = [];
  rows.forEach((r, i) => {
    const len = Math.min(cols, r.values.length);
    for (let j = 0; j < len; j++) {
      const value = norm(r.values[j] ?? null, scale);
      cells.push({
        row: i,
        col: j,
        x: round2(gutter + j * step),
        y: round2(i * step),
        value,
        level: value === null ? -1 : stepIndex(value, 0, 1, LEVELS),
        gap: value === null,
      });
    }
  });

  const labels: CohortLabel[] = showLabels
    ? rows.map((r, i) => ({
        row: i,
        label: r.label,
        x: round2(gutter - 3),
        y: round2(i * step + cell / 2),
      }))
    : [];

  // deepest maturity every cohort reached — contiguous from age 0.
  let commonAge = -1;
  for (let j = 0; j < cols; j++) {
    const all = rows.every((r) => j < r.values.length && isFiniteValue(r.values[j]));
    if (!all) break;
    commonAge = j;
  }

  // worst = min retention at the deepest common age; ties → earliest input.
  // Derived from the already-normalized cells (col===commonAge is finite for
  // every row by construction), so no value is re-scaled.
  let worst: CohortTriangleGeometry["worst"] = null;
  for (const c of cells) {
    if (c.col === commonAge && c.value !== null && (worst === null || c.value < worst.value)) {
      worst = { label: rows[c.row]!.label, age: commonAge, value: c.value };
    }
  }

  let newestFirst: CohortTriangleGeometry["newestFirst"] = null;
  if (nRows > 0) {
    const nr = rows[nRows - 1]!;
    for (const v of nr.values) {
      const f = norm(v, scale);
      if (f !== null) {
        newestFirst = { label: nr.label, value: f };
        break;
      }
    }
  }

  // Rings the highlighted row; its cells run contiguously col 0..len-1 from the
  // gutter, so the extent is derived without scanning `cells`.
  let ring: CohortTriangleGeometry["ring"] = null;
  if (opts.highlight != null) {
    const hi = rows.findIndex((r) => r.label === opts.highlight);
    const len = hi >= 0 ? Math.min(cols, rows[hi]!.values.length) : 0;
    if (len > 0) {
      ring = {
        x: round2(gutter - 0.5),
        y: round2(hi * step - 0.5),
        width: round2((len - 1) * step + cell + 1),
        height: round2(cell + 1),
      };
    }
  }

  // `cols * step - gap` goes NEGATIVE when every cohort is present but none has
  // a reading yet (cols 0), which used to make the box narrower than the label
  // gutter it still paints — the names hung off the left edge.
  const width = nRows === 0 ? gutter : round2(gutter + Math.max(0, cols * step - gap));
  const height = nRows === 0 ? 0 : round2(Math.max(0, nRows * step - gap));

  return {
    cells,
    labels,
    rows: nRows,
    cols,
    gutter,
    width,
    height,
    step,
    cell,
    gap,
    fontSize,
    showLabels,
    ring,
    commonAge,
    worst,
    newestFirst,
  };
}
