// DicePips geometry — pure, React-free. Canonical dice pip
// patterns 1–6 (subitized count) on a fixed 3×3 grid; 0 is an empty face, and
// > 6 is not subitizable so the face carries a centered numeral instead of an
// invented pattern (the spec'd honesty fallback). All coords 2-dp.
import { round2 } from "../../core/types.js";

export interface DicePipsGeometry {
  face: { x: number; y: number; width: number; height: number; rx: number };
  pips: { cx: number; cy: number; r: number }[];
  /** Set only when value > 6 — the centered numeral fallback. */
  numeral: string | null;
  /** Rounded, validated value (< 0 → null = invalid). */
  value: number | null;
}

// Which of the 9 row-major grid cells are lit for each face 1–6 (canonical).
//   0 1 2
//   3 4 5
//   6 7 8
const PIP_LAYOUT: readonly (readonly number[])[] = [
  [], // 0
  [4], // 1 — center
  [0, 8], // 2 — diagonal
  [0, 4, 8], // 3
  [0, 2, 6, 8], // 4 — corners
  [0, 2, 4, 6, 8], // 5
  [0, 3, 6, 2, 5, 8], // 6 — two columns of three
];

export function dicePipsGeometry(opts: {
  value: number;
  size: number;
  pad: number;
}): DicePipsGeometry {
  const { size, pad } = opts;
  const v = Number.isFinite(opts.value) ? Math.round(opts.value) : NaN;
  const value = Number.isNaN(v) || v < 0 ? null : v;

  const face = {
    x: 0.5,
    y: 0.5,
    width: round2(size - 1),
    height: round2(size - 1),
    rx: round2(size * 0.18),
  };

  // 3 columns / rows at pad, centre, size-pad
  const cols = [pad, size / 2, size - pad];
  const r = round2(size * 0.1);
  const pips =
    value !== null && value >= 1 && value <= 6
      ? PIP_LAYOUT[value]!.map((cell) => ({
          cx: round2(cols[cell % 3]!),
          cy: round2(cols[Math.floor(cell / 3)]!),
          r,
        }))
      : [];

  const numeral = value !== null && value > 6 ? String(value) : null;
  return { face, pips, numeral, value };
}
