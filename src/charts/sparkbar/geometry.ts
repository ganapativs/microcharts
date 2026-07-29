// SparkBar: Discrete periods as bars,
// anchored at zero. Shares the placement idiom with
// the Sparkline but emits rects, not a path. Win-loss collapses magnitude to a
// three-state win/loss/tie glyph (tie = thin mid-line dash). Coords 2-dp via the kernel.
import { clamp, niceDomain, scaleLinear } from "../../core/scale.js";
import { chartSide, isFiniteValue, round2, type Value } from "../../core/types.js";
import { textGutter } from "../../core/labels.js";

export type SparkBarMode = "bar" | "winloss";

export const DEFAULT_WIDTH = 80;
export const DEFAULT_HEIGHT = 20;
/** Documented `gap` range and default — see `SparkBarGeometryOptions#gap`. */
const DEFAULT_GAP = 0.25;
const MAX_GAP = 0.9;

/**
 * A gap comes off a slider or a computed density, so `Number("")` → NaN and a
 * negative are both one keystroke away. NaN made every bar `x="NaN"
 * width="NaN"` — nothing painted, while the accessible name still read the
 * whole series out — and a negative widened bars past the slot until they
 * started at `x="-23.37"`, outside a frame that does not clip.
 */
function resolveGap(gap: number | undefined): number {
  return Number.isFinite(gap) ? clamp(gap as number, 0, MAX_GAP) : DEFAULT_GAP;
}

/**
 * An explicit domain is usually a host's own min/max over several series so a
 * row of sparkbars shares one scale; a gap in any of them yields NaN, and the
 * scale then flattens every bar onto the midline under a summary that still
 * names the real range. Each bound falls back to the auto fit on its own, so a
 * half-usable domain keeps its usable half.
 */
function resolveDomain(
  domain: readonly [number, number] | undefined,
  data: readonly Value[],
): readonly [number, number] {
  if (!domain) return niceDomain(data, true);
  const [d0, d1] = domain;
  if (isFiniteValue(d0) && isFiniteValue(d1) && Number.isFinite(d1 - d0)) return domain;
  const auto = niceDomain(data, true);
  const lo = isFiniteValue(d0) ? d0 : auto[0];
  const hi = isFiniteValue(d1) ? d1 : auto[1];
  // A span past the float range divides every value to zero — bars vanish under
  // a summary that still names them, the same silent lie in a different shape.
  return Number.isFinite(hi - lo) ? [lo, hi] : auto;
}

/** Endpoint-label metrics, anchored (never measures text — unmeasurable
 *  server-side). fontSize in viewBox units; gutter over-estimates width so the
 *  label never overruns. Kept local to avoid bundling the Sparkline.
 *
 *  Mirrors `sparkline/geometry.ts#labelMetrics` deliberately — the duplication is
 *  a bundling decision, so the two must stay behaviourally identical. When the
 *  label wants more than the ~45% budget the size shrinks (5-unit floor) instead
 *  of the gutter being clamped under a full-length string, which used to let a
 *  long value overhang the viewBox by ~6 units. */
export function labelMetrics(
  text: string,
  width: number,
  height: number,
): { fontSize: number; gutter: number } {
  const ideal = Math.max(6, Math.min(Math.round(height * 0.5), 11));
  const budget = Math.floor(width * 0.45);
  const needs = (size: number): number => textGutter(text.length, size, 6);

  let fontSize = ideal;
  if (needs(fontSize) > budget && text.length > 0) {
    const fitted = Math.floor((budget - 6) / (text.length * 0.62));
    fontSize = Math.max(5, Math.min(ideal, fitted));
  }
  return { fontSize, gutter: needs(fontSize) };
}

/** One placed bar. `sign` drives valence color; `gap` bars (null data) are dropped. */
export interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  index: number;
  sign: -1 | 0 | 1;
  last: boolean;
}

export interface SparkBarGeometry {
  bars: Bar[];
  /** y of the zero baseline (bar mode) or the mid-line (win-loss). */
  baselineY: number;
  /** Resolved y-domain (win-loss uses sign space [−1, 1]) — annotations frame. */
  domain: readonly [number, number];
  /** Slot pitch on x (annotations Marker x = data index). */
  slot: number;
  /** Left plot inset. */
  x0: number;
  /** Top edge of the plot box — the inline seat's upper bound. */
  y0: number;
  /** Bottom edge of the plot box — where bars land in bar mode. */
  y1: number;
}

export interface SparkBarGeometryOptions {
  width: number;
  height: number;
  mode?: SparkBarMode | undefined;
  domain?: readonly [number, number] | undefined;
  /** Fraction of each slot left empty between bars (0–0.9). */
  gap?: number | undefined;
  pad?: number | undefined;
  /** Reserve plot width on the right for a direct value label, so bars never sit
   *  under it (mirrors the Sparkline). */
  gutterRight?: number | undefined;
}

export function sparkBarGeometry(
  data: readonly Value[],
  opts: SparkBarGeometryOptions,
): SparkBarGeometry {
  const { mode = "bar", pad = 1, gutterRight = 0 } = opts;
  // Read the RESOLVED box, never the prop: `Chart` clamps the frame with the
  // same function, so geometry reading `height={NaN}` raw emitted NaN
  // coordinates inside a viewBox that was already valid.
  const width = chartSide(opts.width, DEFAULT_WIDTH);
  const height = chartSide(opts.height, DEFAULT_HEIGHT);
  const gap = resolveGap(opts.gap);
  const x0 = pad;
  const y0 = pad;
  // Bar mode seats its zero baseline flush with the box bottom (y = height) so
  // the chart aligns on the text baseline when rendered inline — bars are
  // crispEdges rects with no stroke, so filling to the edge bleeds nothing.
  // Win-loss keeps a symmetric mid-line, so it retains the bottom inset.
  const y1 = mode === "winloss" ? height - pad : height;
  const n = data.length;
  const slot = n > 0 ? Math.max(0, width - pad * 2 - gutterRight) / n : 0;
  const barW = round2(Math.max(0.5, slot * (1 - gap)));
  const inset = (slot - barW) / 2;

  // Last finite index → endpoint emphasis.
  let lastFinite = -1;
  for (let i = n - 1; i >= 0; i--) {
    if (isFiniteValue(data[i])) {
      lastFinite = i;
      break;
    }
  }

  if (mode === "winloss") {
    // Equal-height bars above/below a mid-line; magnitude discarded on purpose.
    const mid = round2((y0 + y1) / 2);
    // Under ~4 units tall the half-band goes to zero or negative, and the wins
    // and losses rendered as `height="-0.5"` — dropped by the renderer, so the
    // streak vanished while the summary still read it out. Floor at the same
    // 0.5 minimum mark bar mode uses; the band stays inside the frame because
    // it is measured from the mid-line either way.
    const h = Math.max(0.5, round2((y1 - y0) / 2 - 0.5));
    const bars: Bar[] = [];
    for (let i = 0; i < n; i++) {
      const v = data[i];
      if (!isFiniteValue(v)) continue;
      const sign: -1 | 0 | 1 = v > 0 ? 1 : v < 0 ? -1 : 0;
      const y = sign >= 0 ? mid - h : mid;
      bars.push({
        x: round2(x0 + i * slot + inset),
        y: sign === 0 ? round2(mid - 0.5) : y,
        width: barW,
        height: sign === 0 ? 1 : h,
        value: v,
        index: i,
        sign,
        last: i === lastFinite,
      });
    }
    return { bars, baselineY: mid, domain: [-1, 1], slot, x0, y0, y1 };
  }

  const domain = resolveDomain(opts.domain, data);
  const yScale = scaleLinear(domain, [y1, y0]);
  // The zero anchor is clamped INTO the domain first, so the baseline is always
  // already inside the plot box whichever way the domain runs.
  const baselineY = round2(yScale(Math.min(Math.max(0, domain[0]), domain[1])));

  const bars: Bar[] = [];
  for (let i = 0; i < n; i++) {
    const v = data[i];
    if (!isFiniteValue(v)) continue;
    // Clamp the ENDS, then derive the height. Clamping only `y` afterwards left
    // the full height intact, so a value outside an explicit domain — a row of
    // sparkbars pinned to one scale, one series overshooting — painted a
    // `height="38"` bar in a 20-unit frame, straight across the text around it.
    // Truncating at the frame reads as "off the top"; overflow reads as a bug.
    const top = clamp(yScale(v), y0, y1);
    const h = Math.max(0.5, Math.abs(top - baselineY));
    // A ~zero bar sitting on a floor baseline still pushes its min-height below
    // y1, so nudge it back inside rather than overflow.
    let y = Math.min(top, baselineY);
    if (y + h > y1) y = y1 - h;
    if (y < y0) y = y0;
    bars.push({
      x: round2(x0 + i * slot + inset),
      y: round2(y),
      width: barW,
      height: round2(h),
      value: v,
      index: i,
      sign: v > 0 ? 1 : v < 0 ? -1 : 0,
      last: i === lastFinite,
    });
  }
  return { bars, baselineY, domain, slot, x0, y0, y1 };
}
