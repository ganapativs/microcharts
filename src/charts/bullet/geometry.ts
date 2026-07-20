// Bullet geometry — pure, React-free.
// A measure bar against qualitative bands with a target tick. Horizontal scale
// anchored at zero. Coords 2-dp via the kernel.
import { clamp, scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

interface BulletRegion {
  x: number;
  width: number;
  /** 0-based band index (drives the graduated shade). */
  step: number;
}

export interface BulletGeometry {
  /** Full track [0, max]. */
  track: { x: number; width: number; y: number; height: number };
  /** Qualitative bands (ascending); empty when no thresholds given. */
  regions: BulletRegion[];
  /** The measure bar (0 → value, clamped to the track). */
  measure: { x: number; width: number; y: number; height: number };
  /** Target/comparative tick, or null. */
  tick: { x: number; y0: number; y1: number } | null;
  max: number;
}

export interface BulletGeometryOptions {
  width: number;
  height: number;
  value: number;
  target?: number | undefined;
  /** Ascending qualitative thresholds dividing [0, max] into bands. */
  bands?: readonly number[] | undefined;
  /** Explicit `[0, max]`; auto-fit to value/target/bands when omitted. */
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
}

export function bulletGeometry(opts: BulletGeometryOptions): BulletGeometry {
  const { width, height, pad = 1 } = opts;
  // Non-finite inputs are documented no-shows: NaN/±Infinity value → zero-width
  // measure, unusable target → no tick, bad bands/domain dropped. Degenerates
  // render as designed empties, never as NaN attributes.
  const hasValue = Number.isFinite(opts.value);
  const value = hasValue ? opts.value : 0;
  const target = Number.isFinite(opts.target) ? opts.target : undefined;
  const bands = (opts.bands ?? []).filter((b) => Number.isFinite(b));
  const domain =
    opts.domain && Number.isFinite(opts.domain[0]) && Number.isFinite(opts.domain[1])
      ? opts.domain
      : undefined;
  const x0 = pad;
  const x1 = width - pad;

  const candidates = [value, target ?? 0, ...bands, domain?.[1] ?? 0].filter((n) =>
    Number.isFinite(n),
  );
  const max = domain?.[1] ?? Math.max(1, ...candidates);
  const min = domain?.[0] ?? 0;
  const x = scaleLinear([min, max], [x0, x1]);

  const trackY = pad;
  const trackH = height - pad * 2;
  const track = { x: x0, width: round2(x1 - x0), y: round2(trackY), height: round2(trackH) };

  // Bands: [min..t1], [t1..t2], …, [tk..max]. Ascending, clamped, de-duped.
  const thresholds = bands.filter((t) => t > min && t < max).sort((a, b) => a - b);
  const edges = [min, ...thresholds, max];
  const regions: BulletRegion[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const rx = x(edges[i]!);
    const rw = x(edges[i + 1]!) - rx;
    if (rw > 0) regions.push({ x: round2(rx), width: round2(rw), step: i });
  }

  // Measure bar — centered, ~⅓ track height (Few's thin measure).
  const measureH = Math.max(2, trackH * 0.34);
  const measureY = trackY + (trackH - measureH) / 2;
  const vx = hasValue ? clamp(x(value), x0, x1) : x0;
  const measure = {
    x: x0,
    width: round2(Math.max(0, vx - x0)),
    y: round2(measureY),
    height: round2(measureH),
  };

  const tick =
    target === undefined
      ? null
      : {
          x: round2(clamp(x(target), x0, x1)),
          y0: round2(trackY + trackH * 0.12),
          y1: round2(trackY + trackH * 0.88),
        };

  return { track, regions, measure, tick, max };
}
