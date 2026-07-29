// ActivityGrid: The GitHub
// contribution strip: value → discrete intensity level → cell. Column-major fill
// (each column is a week, filled top-to-bottom). Discrete levels keep it honest —
// color encodes a binned variable, never a continuous illusion. Coords are ints
// (grid marks are rectilinear; crispEdges).
import { extent } from "../../core/scale.js";
import { isFiniteValue, type Value } from "../../core/types.js";

interface Cell {
  x: number;
  y: number;
  size: number;
  /** Discrete intensity level 0..(levels-1); 0 = empty/track. */
  level: number;
  value: number | null;
  index: number;
  row: number;
  col: number;
}

export interface ActivityGridGeometry {
  cells: Cell[];
  cols: number;
  rows: number;
  width: number;
  height: number;
  /** The resolved `cell` / `gap` / `levels` the cells were actually laid out and
   *  bucketed against. Callers must paint from THESE, never from the raw opts —
   *  see `resolve` below for what a raw value can be. */
  cell: number;
  gap: number;
  levels: number;
}

export interface ActivityGridGeometryOptions {
  /** Rows: 7 (grid, default) or 1 (strip). */
  rows?: number | undefined;
  /** Cell edge length in viewBox units. */
  cell?: number | undefined;
  /** Gap between cells. */
  gap?: number | undefined;
  /** Discrete intensity levels including the empty level (default 5, GitHub-like). */
  levels?: number | undefined;
  /** Explicit `[min, max]` for level bucketing; auto-fit when omitted. */
  domain?: readonly [number, number] | undefined;
  /** Leading empty slots — aligns slot 0 to a real weekday (calendar retrofit).
   *  Layout-only: indices, levels and the summary still refer to `data`. */
  offset?: number | undefined;
}

/** A config number the host computes rather than types: `cell={boxPx / weeks}`
 *  with `weeks` momentarily 0 is `Infinity`, and `Number(input.value)` on an
 *  empty field is `NaN`. Both used to flow straight through into `width`, so
 *  the chart emitted `viewBox="0 0 NaN NaN"` and vanished; a negative `gap` put
 *  cells at negative x, outside the viewBox that `.mc-root` does not clip.
 *  Repair once, here, so every caller reads the numbers the cells were built on. */
function resolve(raw: number | undefined, fallback: number, min: number): number {
  return raw !== undefined && Number.isFinite(raw) && raw >= min ? raw : fallback;
}

/** Buckets a value into 0..(levels-1). 0 for ≤0 / empty; positives fill 1..max. */
function levelOf(value: number, min: number, max: number, levels: number): number {
  if (value <= 0) return 0;
  if (max <= 0 || max === min) return levels - 1;
  const frac = (value - Math.max(0, min)) / (max - Math.max(0, min));
  return Math.min(levels - 1, 1 + Math.floor(frac * (levels - 1 - 1e-9)));
}

export function activityGridGeometry(
  data: readonly Value[],
  opts: ActivityGridGeometryOptions = {},
): ActivityGridGeometry {
  const rows = Math.floor(resolve(opts.rows, 7, 1));
  const cell = resolve(opts.cell, 10, 0);
  const gap = resolve(opts.gap, 2, 0);
  // `levels` is a count of discrete bins, so it rounds to a whole number before
  // it is clamped — a fractional one made `levelOf` return fractional levels
  // that no opacity step in the ramp corresponds to.
  const levels = Math.max(2, Math.round(resolve(opts.levels, 5, 1)));
  const offset = Math.floor(resolve(opts.offset, 0, 0)) % rows;
  const step = cell + gap;

  const n = data.length;
  const cols = n === 0 ? 0 : Math.ceil((n + offset) / rows);
  const width = cols > 0 ? cols * step - gap : 0;
  const height = rows > 0 ? rows * step - gap : 0;

  // A caller `domain` has to be validated, not trusted: `[NaN, NaN]` (which is
  // what `[Math.min(...vals), Math.max(...vals)]` yields when `vals` holds one
  // NaN) makes `levelOf` return NaN and every cell paints `fill-opacity="NaN"`.
  // Same guard the other domain-taking charts already apply.
  const e = opts.domain?.every((d) => Number.isFinite(d)) ? opts.domain : extent(data);
  const [min, max] = e ?? [0, 0];

  const cells: Cell[] = data.map((v, i) => {
    const slot = i + offset;
    const col = Math.floor(slot / rows);
    const row = slot % rows;
    const finite = isFiniteValue(v);
    return {
      x: col * step,
      y: row * step,
      size: cell,
      level: finite ? levelOf(v, min, max, levels) : 0,
      value: finite ? v : null,
      index: i,
      row,
      col,
    };
  });

  return { cells, cols, rows, width, height, cell, gap, levels };
}
