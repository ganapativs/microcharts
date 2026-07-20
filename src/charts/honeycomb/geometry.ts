// Honeycomb geometry — pure, React-free. Occupancy of capacity
// as filled cells in an area-filling hex grid (unit counting — units are
// countable, total ≤ 60). Two merged <path> nodes (filled + empty) keep the node
// count O(1) regardless of total. Pointy-top hexes, odd-row offset, near-square,
// filled row-major from the top-left (occupancy reads as a sweep). All coords 2-dp.
import { round2 } from "../../core/types.js";

export interface HoneycombGeometry {
  cells: { cx: number; cy: number; filled: boolean; index: number }[];
  filledPath: string;
  emptyPath: string;
  filledCount: number;
  width: number;
  height: number;
  /** Comb block, top and bottom edges — the outer hex row extents, not the
   *  padded/ceiled viewBox. */
  y0: number;
  y1: number;
}

const SQRT3 = Math.sqrt(3);

// Saturate drawn cells at a legible-comb bound. `total` is a caller prop; a
// non-physical value (e.g. 1e15) would otherwise loop unbounded, allocating
// trillions of cell objects (OOM) and blowing the auto-sized viewBox to a huge
// coordinate. Occupancy still reads correctly — the summary reports the true
// total/value; only the grid saturates. Catalog admits total ≤ 60 typical.
export const HONEYCOMB_MAX_CELLS = 400;

/** Pointy-top hexagon path at (cx, cy) with circumradius r. */
export function hexPath(cx: number, cy: number, r: number): string {
  const hw = round2((SQRT3 / 2) * r);
  const hr = round2(r / 2);
  const top = round2(cy - r);
  const bot = round2(cy + r);
  const x = round2(cx);
  const xl = round2(cx - hw);
  const xr = round2(cx + hw);
  const yu = round2(cy - hr);
  const yd = round2(cy + hr);
  return `M${x} ${top}L${xr} ${yu}L${xr} ${yd}L${x} ${bot}L${xl} ${yd}L${xl} ${yu}Z`;
}

export function honeycombGeometry(opts: {
  total: number;
  value: number;
  rows: number | "auto";
  cellR: number;
  pad: number;
}): HoneycombGeometry {
  const { cellR: r, pad } = opts;
  const total = Math.min(Math.max(0, Math.floor(opts.total)), HONEYCOMB_MAX_CELLS);
  const value = Math.max(0, Math.round(opts.value));
  const filledCount = Math.min(value, total);

  const rows =
    opts.rows === "auto"
      ? Math.max(1, Math.round(Math.sqrt(total)))
      : Math.max(1, Math.floor(opts.rows));
  const cols = total === 0 ? 0 : Math.ceil(total / rows);

  const colSpace = SQRT3 * r; // horizontal spacing (pointy-top)
  const rowSpace = 1.5 * r; // vertical spacing
  const halfW = (SQRT3 / 2) * r;

  const cells: HoneycombGeometry["cells"] = [];
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const cx = round2(pad + halfW + col * colSpace + (row % 2 === 1 ? colSpace / 2 : 0));
    const cy = round2(pad + r + row * rowSpace);
    cells.push({ cx, cy, filled: i < filledCount, index: i });
  }

  // Draw each hex a hair smaller than its layout cell so touching neighbours
  // leave a thin gutter — without it, filled cells merge into one solid blob and
  // the comb structure (the whole point) disappears.
  const drawR = round2(r * 0.85);
  let filledPath = "";
  let emptyPath = "";
  for (const c of cells) {
    const d = hexPath(c.cx, c.cy, drawR);
    if (c.filled) filledPath += d;
    else emptyPath += d;
  }

  // width: cols (+ half for the offset rows), height: rows
  const offset = rows > 1 ? colSpace / 2 : 0;
  const width = Math.max(1, Math.ceil(pad * 2 + cols * colSpace + offset));
  const height = Math.max(1, Math.ceil(pad * 2 + r + (rows - 1) * rowSpace + r));

  return {
    cells,
    filledPath,
    emptyPath,
    filledCount,
    width,
    height,
    y0: round2(pad),
    y1: round2(pad + 2 * r + (rows - 1) * rowSpace),
  };
}
