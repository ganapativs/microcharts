// ConfusionGrid: A k×k
// labeled agreement matrix at glyph scale: rows = actual, columns = predicted.
// Cell ink = row-normalized share by default (the recall view — "of the actual
// X, where did predictions go?"); the diagonal is agreement, accented by SHAPE
// (never color-alone). 2-dp.
import { round2 } from "../../core/types.js";

export interface ConfusionCell {
  x: number;
  y: number;
  w: number;
  row: number;
  col: number;
  count: number;
  /** Row-normalized (or global) share, 0–1; null for an all-zero row. */
  share: number | null;
  diagonal: boolean;
}

export function confusionGridGeometry(opts: {
  size: number;
  k: number;
  counts: readonly (readonly number[])[];
  normalize: "row" | "none";
  gutterCh: number;
}): {
  cells: ConfusionCell[];
  rowTotals: number[];
  accuracy: number;
  maxErrorCell: { row: number; col: number } | null;
  /** Matrix block, top and bottom edges — below the reserved axis-label gutter. */
  y0: number;
  y1: number;
} {
  const { size, k, counts, normalize, gutterCh } = opts;
  const inset = gutterCh; // reserve top + left for axis labels
  const grid = size - inset - 1;
  const cellW = grid / k;

  const clean = (v: number): number => (Number.isFinite(v) && v > 0 ? v : 0);
  const rowTotals = counts.map((row) => row.reduce((s, v) => s + clean(v), 0));
  let globalMax = 0;
  for (const row of counts) for (const v of row) if (clean(v) > globalMax) globalMax = clean(v);

  let trace = 0;
  let total = 0;
  let maxError = -1;
  let maxErrorCell: { row: number; col: number } | null = null;

  const cells: ConfusionCell[] = [];
  for (let r = 0; r < k; r++) {
    for (let c = 0; c < k; c++) {
      const count = clean(counts[r]?.[c] ?? 0);
      total += count;
      if (r === c) trace += count;
      if (r !== c && count > maxError) {
        maxError = count;
        maxErrorCell = { row: r, col: c };
      }
      const rt = rowTotals[r]!;
      const share =
        normalize === "row" ? (rt > 0 ? count / rt : null) : globalMax > 0 ? count / globalMax : 0;
      cells.push({
        x: round2(inset + c * cellW),
        y: round2(inset + r * cellW),
        w: round2(cellW),
        row: r,
        col: c,
        count,
        share: share == null ? null : round2(share),
        diagonal: r === c,
      });
    }
  }

  return {
    cells,
    rowTotals,
    accuracy: total > 0 ? round2(trace / total) : 0,
    maxErrorCell: maxError > 0 ? maxErrorCell : null,
    y0: round2(inset),
    y1: round2(inset + k * cellW),
  };
}
