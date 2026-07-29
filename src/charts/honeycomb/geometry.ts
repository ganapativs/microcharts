// Honeycomb: Occupancy of capacity
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
  /** The circumradius the comb was actually laid out on. Callers must draw
   *  overlays (the pick ring) and hit-test from THIS, never the raw `cell` prop
   *  — see `resolveCell` for what a raw one can be. */
  cell: number;
}

const SQRT3 = Math.sqrt(3);

/** Component defaults, shared with `index.tsx` so a repaired prop repairs the
 *  painted comb and the announced count to the same number. */
export const HONEYCOMB_TOTAL = 10;
const HONEYCOMB_CELL = 4;

/* A config number the host computes rather than types: `total={Number(field.value)}`
   on an empty field is `NaN`, and `total={seats / perFloor}` with `perFloor`
   momentarily 0 is `Infinity`. Both flowed into the accessible name, so a comb of
   seven ordinary hexes announced "5 of NaN filled."; a non-finite `rows` or `cell`
   additionally emitted `d="MNaN NaN…"` under a `viewBox="0 0 1 1"`, and a negative
   `cell` put hexes at negative coords — outside the viewBox `.mc-root` does not
   clip. Repaired here, once, so geometry and summary read the same numbers. */

/** Capacity the comb is laid out and ANNOUNCED against: whole cells, ≥ 0. A
 *  negative capacity clamps to none (`total={0}`'s "No data."); a non-finite one
 *  is not a capacity at all, so it falls back to the documented default. */
export function resolveTotal(raw: number | undefined): number {
  return raw !== undefined && Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : HONEYCOMB_TOTAL;
}

/** Filled count the comb paints and ANNOUNCES: whole cells, ≥ 0. Non-finite is
 *  not a count — it reads as none, the repair `resolveK` makes in IconArray. */
export function resolveValue(raw: number): number {
  return Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
}

/** Hex circumradius: finite and non-negative, else the documented default. */
export function resolveCell(raw: number | undefined): number {
  return raw !== undefined && Number.isFinite(raw) && raw >= 0 ? raw : HONEYCOMB_CELL;
}

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
  const { pad } = opts;
  const r = resolveCell(opts.cellR);
  const total = Math.min(resolveTotal(opts.total), HONEYCOMB_MAX_CELLS);
  const filledCount = Math.min(resolveValue(opts.value), total);

  // A non-finite `rows` is not a row count; fall back to `auto` (the default).
  const asked =
    opts.rows === "auto" || !Number.isFinite(opts.rows)
      ? Math.max(1, Math.round(Math.sqrt(total)))
      : Math.max(1, Math.floor(opts.rows));
  const cols = total === 0 ? 0 : Math.ceil(total / asked);
  // Size from the rows the comb OCCUPIES, not the rows asked for: `rows={5}` on
  // 12 cells lays out 3 columns, which is 4 rows — reserving the fifth left a
  // dead band under the comb and pulled the inline seat (y1) off its middle.
  // `rows={100}` reserved 88 of them.
  const rows = cols === 0 ? 1 : Math.ceil(total / cols);

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
    cell: r,
  };
}
