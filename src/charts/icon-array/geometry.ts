// IconArray: One
// stated rate made countable: filled units in a fixed N-unit grid, denominator
// visible. Filled units are CONTIGUOUS from the top-left in reading order
// (scattered fills are harder to count — medical-risk literature); the rest are
// hollow, shape-distinct. No partial-unit fills ever (a 37% unit is a lie in a
// counting chart). Coords 2-dp.
import { round2 } from "../../core/types.js";
import { cellMetrics, type CellShape } from "../../shared/cell.js";
import { labelFitsY, labelFont, textGutter } from "../../core/labels.js";

export type IconArrayN = 10 | 20 | 100;

/** cols × rows per denominator — legibility is designed, not arbitrary. */
const GRID_DIMS: Record<IconArrayN, [number, number]> = {
  10: [5, 2],
  20: [10, 2],
  100: [10, 10],
};

/**
 * Snap `total` to a designed denominator, defaulting to 20. `GRID_DIMS` has no
 * entry for anything else, and the lookup was destructured unguarded — a
 * `total` of 25, 0 or NaN (a JS caller, an untyped CMS field, a model emitting
 * the prop) threw "undefined is not iterable" and took the render down with it.
 * Resolve once so the painted denominator and the announced one are the same
 * number.
 */
export function resolveTotal(total: number | undefined): IconArrayN {
  return total === 10 || total === 100 ? total : 20;
}

export interface IconArrayGeometry {
  units: { x: number; y: number; filled: boolean; index: number }[];
  cell: number;
  rx: number;
  crisp: boolean;
  k: number;
  n: IconArrayN;
  cols: number;
  rows: number;
  /** "normal" | "none" (k=0) | "all" (k=n) | "sub" (rate>0 but rounds to 0). */
  note: "normal" | "none" | "all" | "sub";
  labelX: number;
  labelY: number;
  totalWidth: number;
  /** Top of the unit grid. The grid is centred in the box and capped at an
   *  8-unit cell, so on a tall chart it floats well inside the viewBox — the
   *  seat has to follow the grid, not the box. */
  y0: number;
  /** Bottom of the unit grid. */
  y1: number;
}

/** Resolve a 0–1 rate to a whole unit count, half-up, clamped to [0, n]. */
export function resolveK(value: number, n: number): number {
  if (!Number.isFinite(value)) return 0;
  const v = value < 0 ? 0 : value > 1 ? 1 : value;
  return Math.min(n, Math.max(0, Math.round(v * n)));
}

export interface IconArrayLabelPlan {
  /** Label size in viewBox units. */
  font: number;
  /** Characters of gutter to carve out of the width (0 when the label drops). */
  gutterCh: number;
  show: boolean;
}

/**
 * Whether the side label is affordable, and what it costs. Lives here so the
 * static and interactive entries cannot compute different gutters and paint
 * different grids.
 *
 * The ratio reserve is derived from the denominator, not fixed: `"100 in 100"`
 * is ten characters where `"3 in 20"` is seven, and reserving a flat nine
 * pushed the full 100-unit label up to 6.7 units past the right edge of the
 * viewBox (`.mc-root` is `overflow: visible`, so it spilled into the page).
 * `2 × digits + 5` is both sides of the ratio, the four characters of `" in "`,
 * and one character of slack — which reproduces the calibrated 9 for the 10-
 * and 20-unit grids exactly, so only the case that overflowed moves.
 */
export function iconArrayLabelPlan(opts: {
  label: "ratio" | "percent" | "none";
  total: IconArrayN;
  width: number;
  height: number;
}): IconArrayLabelPlan {
  const { label, total, width, height } = opts;
  // label a touch smaller than the strips so the countable grid stays the hero
  // (~0.5·height, clamped 7–10) — see coverage-strip
  const font = labelFont(height, 0.5);
  const wantCh = label === "ratio" ? 2 * `${total}`.length + 5 : label === "percent" ? 5 : 0;
  if (wantCh === 0) return { font, gutterCh: 0, show: false };
  // The label lives in a gutter carved OUT of the width. On a narrow box that
  // gutter can swallow the grid whole — the units collapse to nothing and the
  // text runs off the right edge. So the label is gated on the grid keeping a
  // countable cell (≥ 1.5 units per column, gaps included) after the gutter,
  // and on the text fitting the box vertically. When it drops, the gutter drops
  // with it and the grid gets the full width — the countable grid is the chart.
  const [cols] = GRID_DIMS[total];
  const show =
    labelFitsY(height / 2, font, height) &&
    width - textGutter(wantCh, font, 4) >= cols * 1.5 * 1.25;
  return { font, gutterCh: show ? wantCh : 0, show };
}

export function iconArrayGeometry(opts: {
  width: number;
  height: number;
  value: number;
  total: IconArrayN;
  shape: CellShape;
  gutterCh?: number;
  fontSize?: number;
}): IconArrayGeometry {
  const { width, height, value, shape } = opts;
  const n = resolveTotal(opts.total);
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? textGutter(gutterCh, fontSize, 4) : 0;

  const [cols, rows] = GRID_DIMS[n];
  const k = resolveK(value, n);
  const rate = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const note: IconArrayGeometry["note"] =
    k === 0 && rate > 0 ? "sub" : k === 0 ? "none" : k === n ? "all" : "normal";

  const plotW = width - gutter;
  const g = 0.25; // inter-cell gap as a fraction of cell size
  const cellW = plotW / (cols + (cols - 1) * g);
  const cellH = height / (rows + (rows - 1) * g);
  // cap the cell so a wide chart keeps a compact grid + the label hugs it,
  // rather than the units ballooning across the whole width
  const cell = Math.max(0, Math.min(cellW, cellH, 8));
  const pitch = cell * (1 + g);
  const gridW = cols * cell + (cols - 1) * cell * g;
  const gridH = rows * cell + (rows - 1) * cell * g;
  const startX = 0.5; // left-aligned so the label sits right after the grid
  const startY = round2((height - gridH) / 2);
  const gridRight = round2(startX + gridW);

  const m = cellMetrics(cell, shape);
  const units = Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    return {
      x: round2(startX + col * pitch + m.inset),
      y: round2(startY + row * pitch + m.inset),
      filled: i < k,
      index: i,
    };
  });

  return {
    units,
    cell: round2(cell - m.inset * 2),
    rx: m.rx,
    crisp: m.crisp,
    k,
    n,
    cols,
    rows,
    note,
    labelX: round2(gridRight + 4), // start-anchored, right after the grid
    labelY: round2(height / 2),
    totalWidth: width,
    y0: startY,
    y1: round2(startY + gridH),
  };
}
