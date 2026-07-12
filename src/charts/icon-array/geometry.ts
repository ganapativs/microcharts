// IconArray geometry — pure, React-free. One
// stated rate made countable: filled units in a fixed N-unit grid, denominator
// visible. Filled units are CONTIGUOUS from the top-left in reading order
// (scattered fills are harder to count — medical-risk literature); the rest are
// hollow, shape-distinct. No partial-unit fills ever (a 37% unit is a lie in a
// counting chart). Coords 2-dp.
import { round2 } from "../../core/types.js";
import { cellMetrics, type CellShape } from "../../shared/cell.js";

export type IconArrayN = 10 | 20 | 100;

/** cols × rows per denominator — legibility is designed, not arbitrary. */
const GRID_DIMS: Record<IconArrayN, [number, number]> = {
  10: [5, 2],
  20: [10, 2],
  100: [10, 10],
};

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
}

/** Resolve a 0–1 rate to a whole unit count, half-up, clamped to [0, n]. */
export function resolveK(value: number, n: number): number {
  if (!Number.isFinite(value)) return 0;
  const v = value < 0 ? 0 : value > 1 ? 1 : value;
  return Math.min(n, Math.max(0, Math.round(v * n)));
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
  const { width, height, value, total: n, shape } = opts;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.62) + 4 : 0;

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
  };
}
