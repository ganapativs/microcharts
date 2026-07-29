// A measure bar against qualitative bands with a target tick. Horizontal scale
// anchored at zero. Coords 2-dp via the kernel.
import { clamp, maxOf, scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";
import { textGutter } from "../../core/labels.js";

/** Drawn-band ceiling — one band is one DOM node and `bands` is caller data. */
const MAX_BANDS = 200;

interface BulletRegion {
  x: number;
  width: number;
  /** 0-based band index (drives the graduated shade). */
  step: number;
}

export interface BulletGeometry {
  track: { x: number; width: number; y: number; height: number };
  /** Qualitative bands (ascending); empty when no thresholds given. */
  regions: BulletRegion[];
  measure: { x: number; width: number; y: number; height: number };
  /** Target tick, or null. */
  tick: { x: number; y0: number; y1: number } | null;
  max: number;
  /** viewBox width including right label gutter */
  totalWidth: number;
  labelX: number;
  labelY: number;
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
  /** Chars in the reserved right-hand label gutter (0 = none). */
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
}

export function bulletGeometry(opts: BulletGeometryOptions): BulletGeometry {
  const { width, height, pad = 1, gutterCh = 0, fontSize = 0 } = opts;
  // Non-finite inputs are documented no-shows: NaN/±Infinity value → zero-width
  // measure, unusable target → no tick, bad bands/domain dropped. Degenerates
  // render as designed empties, never as NaN attributes.
  const hasValue = Number.isFinite(opts.value);
  const value = hasValue ? opts.value : 0;
  const target = Number.isFinite(opts.target) ? opts.target : undefined;
  const bands = (opts.bands ?? []).filter((b) => Number.isFinite(b));
  // A domain also has to ASCEND to be usable. The measure bar always grows
  // rightward from x0, so an inverted `[100, 0]` leaves its length meaning
  // "distance from the domain max" — a value under target then paints past the
  // target tick while the summary says it is under. A flat `[50, 50]` is worse:
  // the kernel maps every value to the range midpoint, so the bands collapse to
  // zero width (no track at all) and the bar reads half-full whatever the data
  // says. Both drop to auto-fit, the same rule a non-finite domain takes.
  const d = opts.domain;
  const domain = d && Number.isFinite(d[0]) && Number.isFinite(d[1]) && d[1] > d[0] ? d : undefined;
  const x0 = pad;
  const x1 = width - pad;

  const candidates = [value, target ?? 0, ...bands, domain?.[1] ?? 0].filter((n) =>
    Number.isFinite(n),
  );
  // `maxOf`, never `Math.max(...candidates)`: `bands` is caller-sized and the
  // spread throws RangeError past ~125k arguments — a bands array that long
  // crashed the render instead of drawing it.
  const max = domain?.[1] ?? maxOf(candidates, 1);
  const min = domain?.[0] ?? 0;
  const x = scaleLinear([min, max], [x0, x1]);

  const trackY = pad;
  // Below `2 * pad` of height this went negative: a negative `height` on a
  // <rect> is an SVG error, and the measure bar centred inside it painted above
  // y=0 — `.mc-root` is overflow: visible, so that spills into the page.
  const trackH = Math.max(0, height - pad * 2);
  const track = { x: x0, width: round2(x1 - x0), y: round2(trackY), height: round2(trackH) };

  // Bands: [min..t1], [t1..t2], …, [tk..max]. Ascending, clamped, de-duped.
  // One threshold is one <rect> and `bands` is unbounded caller data, so the
  // lowest MAX_BANDS survive and the rest merge into the top region — which
  // still runs to `max`, so the track stays covered end to end.
  const thresholds = bands
    .filter((t) => t > min && t < max)
    .sort((a, b) => a - b)
    .slice(0, MAX_BANDS);
  const edges = [min, ...thresholds, max];
  const regions: BulletRegion[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const rx = x(edges[i]!);
    const rw = x(edges[i + 1]!) - rx;
    if (rw > 0) regions.push({ x: round2(rx), width: round2(rw), step: i });
  }

  // Measure bar — centered, ~⅓ track height (Few's thin measure). The 2-unit
  // floor keeps it visible on a short chart, but never past the track itself:
  // on a track thinner than that the bar would hang outside the viewBox.
  const measureH = Math.min(trackH, Math.max(2, trackH * 0.34));
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

  // Label gutter is reserved OUTSIDE the track (Progress idiom): the viewBox
  // widens, the track/measure never shrink, so the same value renders the same
  // bar length whatever the label says.
  const gutter = gutterCh > 0 ? textGutter(gutterCh, fontSize, 5) : 0;

  return {
    track,
    regions,
    measure,
    tick,
    max,
    totalWidth: round2(width + gutter),
    labelX: round2(width + gutter),
    labelY: round2(height / 2),
  };
}
