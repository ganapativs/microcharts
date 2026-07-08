// ActivityGrid geometry — pure, React-free (plan/05 §3, S1 binned). The GitHub
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
  const rows = Math.max(1, opts.rows ?? 7);
  const cell = opts.cell ?? 10;
  const gap = opts.gap ?? 2;
  const levels = Math.max(2, opts.levels ?? 5);
  const offset = Math.max(0, Math.floor(opts.offset ?? 0)) % rows;
  const step = cell + gap;

  const n = data.length;
  const cols = n === 0 ? 0 : Math.ceil((n + offset) / rows);
  const width = cols > 0 ? cols * step - gap : 0;
  const height = rows > 0 ? rows * step - gap : 0;

  const e = opts.domain ?? extent(data);
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

  return { cells, cols, rows, width, height };
}
