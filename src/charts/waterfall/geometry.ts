// Waterfall geometry — pure, React-free.
// Floating bars are the documented encoding exception to zero-anchoring: each
// bar's LENGTH is its own delta exactly; the connectors and the zero-anchored
// total bar are the mandatory keys back to reality. 2-dp.
import { clamp, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface WaterfallBar extends Rect {
  sign: 1 | -1 | 0;
  index: number;
}

export interface WaterfallGeometry {
  bars: WaterfallBar[];
  connectors: { x0: number; x1: number; y: number }[];
  totalBar: Rect | null;
  zeroY: number;
  /** Plot box top/bottom in viewBox units — the half-unit-inset value frame every
   *  bar, connector and the total bar are clamped into. Prop-derived, never
   *  data-derived (`zeroY` moves with the domain; this does not). */
  y0: number;
  y1: number;
  /** Running totals AFTER each step (2-dp, for the interactive readout). */
  levels: number[];
  /** Column pitch for interactive band lookup (total bar occupies the last). */
  pitch: number;
  /** Resolved value domain `[min,max]` — the annotation-host y-frame. */
  domain: readonly [number, number];
}

export function waterfallGeometry(opts: {
  width: number;
  height: number;
  deltas: readonly Value[];
  start: number;
  total: boolean;
  domain?: readonly [number, number] | undefined;
  gap?: number | undefined;
}): WaterfallGeometry {
  const { width, height, total, gap = 1 } = opts;
  const start = Number.isFinite(opts.start) ? opts.start : 0;
  const deltas = opts.deltas.map((d) => (isFiniteValue(d) ? d : 0));
  const n = deltas.length;
  if (n === 0) {
    return {
      bars: [],
      connectors: [],
      totalBar: null,
      zeroY: height - 1,
      y0: 0.5,
      y1: round2(height - 0.5),
      levels: [],
      pitch: 0,
      domain: [0, 0],
    };
  }

  const levels: number[] = [];
  let running = start;
  for (const d of deltas) {
    running += d;
    levels.push(round2(running));
  }

  const lo = Math.min(0, start, ...levels);
  const hi = Math.max(0, start, ...levels);
  const domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d)) ? opts.domain : ([lo, hi] as const);
  const y = (v: number) =>
    round2(clamp(scaleLinear(domain, [height - 0.5, 0.5])(v), 0.5, height - 0.5));
  const zeroY = y(0);

  const cols = n + (total ? 1 : 0);
  const colW = (width - gap * (cols - 1)) / cols;
  const pitch = colW + gap;

  const bars: WaterfallBar[] = [];
  const connectors: { x0: number; x1: number; y: number }[] = [];
  let level = start;
  deltas.forEach((d, index) => {
    const from = level;
    level += d;
    const yTop = y(Math.max(from, level));
    const yBot = y(Math.min(from, level));
    const x = round2(index * pitch);
    const h = Math.max(round2(yBot - yTop), 1); // zero delta → visible 1-unit tick
    bars.push({
      x,
      y: d === 0 ? round2(y(from) - 0.5) : yTop,
      w: round2(Math.min(colW, round2(width - x))),
      h: d === 0 ? 1 : h,
      sign: d > 0 ? 1 : d < 0 ? -1 : 0,
      index,
    });
    if (index < n - 1 || total) {
      const nx = round2((index + 1) * pitch);
      connectors.push({ x0: round2(x + bars[index]!.w), x1: nx, y: y(level) });
    }
  });

  let totalBar: Rect | null = null;
  if (total) {
    const x = round2(n * pitch);
    const yTop = y(Math.max(0, level));
    const yBot = y(Math.min(0, level));
    totalBar = {
      x,
      y: yTop,
      w: round2(Math.min(colW, round2(width - x))),
      h: Math.max(round2(yBot - yTop), 1),
    };
  }

  return {
    bars,
    connectors,
    totalBar,
    zeroY,
    y0: 0.5,
    y1: round2(height - 0.5),
    levels,
    pitch,
    domain,
  };
}

/** One label the caller wants placed under its column. `w` is an over-estimate
 *  (never measures text — unmeasurable server-side); `priority` orders drop-out. */
export interface WaterfallLabelInput {
  index: number;
  /** Column-center x. */
  cx: number;
  /** Estimated box width in viewBox units. */
  w: number;
  /** Drop-out rank: biggest magnitude survives collisions. */
  priority: number;
}

export interface PlacedWaterfallLabel {
  index: number;
  /** Clamped center x (text-anchor="middle"). */
  x: number;
}

/** Deterministic magnitude-priority drop-out for step labels: place the biggest
 *  movers first (ties by index), skip any label that would overlap a kept one or
 *  overrun the box. Pure — same inputs, same survivors, no text measurement. */
export function placeWaterfallLabels(
  items: readonly WaterfallLabelInput[],
  viewWidth: number,
  gap = 1,
): PlacedWaterfallLabel[] {
  const order = [...items].sort((a, b) => b.priority - a.priority || a.index - b.index);
  const kept: { x: number; half: number }[] = [];
  const out: PlacedWaterfallLabel[] = [];
  for (const it of order) {
    const half = Math.min(it.w / 2, viewWidth / 2);
    const x = clamp(it.cx, half, viewWidth - half);
    if (kept.some((k) => Math.abs(k.x - x) < k.half + half + gap)) continue;
    kept.push({ x, half });
    out.push({ index: it.index, x: round2(x) });
  }
  return out.sort((a, b) => a.index - b.index);
}
