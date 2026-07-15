// Deterministic 1-D label layout ( discipline: pure arithmetic, no
// measurement). Given desired label positions on one axis, spread them to a
// minimum pitch inside [min, max] with the least total displacement — the
// classic greedy forward/backward sweep. Returns null when they cannot all
// fit (caller falls back to its drop-out rule).
import { round2 } from "./types.js";

/**
 * Canonical in-chart label size (viewBox units): scales with the chart's height
 * and holds a **floor of 7** so text never reads smaller than the rest of the
 * library. `factor` tunes weight per chart (default 0.55 — the common case;
 * label-forward charts use ~0.62, dense strips ~0.4). Capped at 11. This is the
 * one source of truth for label sizing — never hardcode a fixed fontSize.
 */
export function labelFont(height: number, factor = 0.55): number {
  return Math.min(11, Math.max(7, Math.round(height * factor)));
}

/**
 * Reserved gutter width (viewBox units) for a `chars`-long label at `fontSize`,
 * plus a fixed `pad` of breathing room. The `0.62 × fontSize` per-character
 * estimate is a deliberate slight over-estimate for the tabular-nums figures the
 * library renders — wide enough that a reserved gutter never clips — and
 * `Math.ceil` snaps the gutter onto integer viewBox coords. This is the one
 * source of truth for the per-char label estimate; never hardcode `* 0.62`
 * inline for a gutter. (The exact `Math.ceil(chars * fontSize * 0.62) + pad`
 * expression is preserved verbatim so migrated call sites stay bit-identical
 * regardless of whether `fontSize` is integer.)
 */
export function textGutter(chars: number, fontSize: number, pad: number): number {
  return Math.ceil(chars * fontSize * 0.62) + pad;
}

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
