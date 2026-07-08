// Deterministic 1-D label layout (plan/18 discipline: pure arithmetic, no
// measurement). Given desired label positions on one axis, spread them to a
// minimum pitch inside [min, max] with the least total displacement — the
// classic greedy forward/backward sweep. Returns null when they cannot all
// fit (caller falls back to its drop-out rule).
import { round2 } from "./types.js";

export function spreadLabels(
  desired: readonly number[],
  pitch: number,
  min: number,
  max: number,
): number[] | null {
  const n = desired.length;
  if (n === 0) return [];
  if ((n - 1) * pitch > max - min) return null;

  const order = desired.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y); // Array#sort is stable

  // forward sweep: enforce pitch going down
  const pos: number[] = [];
  for (let k = 0; k < n; k++) {
    const want = Math.min(Math.max(order[k]!.y, min), max);
    pos.push(k === 0 ? want : Math.max(want, pos[k - 1]! + pitch));
  }
  // backward sweep: pull the overflow back up from the bottom
  if (pos[n - 1]! > max) {
    pos[n - 1] = max;
    for (let k = n - 2; k >= 0; k--) {
      pos[k] = Math.min(pos[k]!, pos[k + 1]! - pitch);
    }
  }

  const out = Array.from<number>({ length: n });
  for (let k = 0; k < n; k++) out[order[k]!.i] = round2(pos[k]!);
  return out;
}
