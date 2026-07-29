// ShiftHistogram: Did the fix actually
// change the distribution? Mirrored bins (before up, after down) over SHARED bin
// edges, with the median shift as the precise takeaway. Heights are per-side
// PROPORTIONS (each side's counts ÷ that side's n) on ONE shared height scale
// (max proportion across both) — so unequal sample sizes cannot fake a shift.
// Coords 2-dp, integer viewBox.
import { uniformBins } from "../../core/bin.js";
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2 } from "../../core/types.js";

// median of an already-finite array (avoids pulling the whole quantile module
// into a histogram bundle for one 0.5 quantile)
function median(finite: readonly number[]): number {
  const s = [...finite].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export type ShiftMode = "mirror" | "overlay";

interface ShiftBin {
  x: number;
  width: number;
  /** viewBox heights (up = before, down = after). */
  up: number;
  down: number;
  x0: number;
  x1: number;
  beforeShare: number;
  afterShare: number;
}

export interface ShiftHistogramGeometry {
  centerY: number;
  /** Plot box top/bottom in viewBox units — the padded mirror frame the tallest
   *  bin on either side can reach. Prop-derived, never data-derived. */
  y0: number;
  y1: number;
  bins: ShiftBin[];
  medians: {
    before: { x: number; value: number } | null;
    after: { x: number; value: number } | null;
  };
  /** after − before median, 2-dp; null if a side is empty. */
  shift: number | null;
  nBefore: number;
  nAfter: number;
  labelX: number;
  totalWidth: number;
}

export function shiftHistogramGeometry(opts: {
  width: number;
  height: number;
  before: readonly number[];
  after: readonly number[];
  bins?: number | undefined;
  mode?: ShiftMode | undefined;
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
}): ShiftHistogramGeometry | null {
  const beforeAll = opts.before.filter(isFiniteValue);
  const afterAll = opts.after.filter(isFiniteValue);
  if (beforeAll.length === 0 && afterAll.length === 0) return null;

  const { width, height } = opts;
  const pad = opts.pad ?? 2;
  const fontSize = opts.fontSize ?? 0;
  const gutterCh = opts.gutterCh ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;

  // shared union domain + a single auto bin count → shared edges for both sides.
  // A caller `domain` is normalized ascending the way uniformBins normalizes it:
  // reversed, the bins came back on the sorted domain while the median rules
  // were placed on the raw descending scale, so the bars said "moved down" and
  // the two rules said "moved up" in the same chart.
  const dom: readonly [number, number] =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain[0] <= opts.domain[1]
        ? opts.domain
        : [opts.domain[1], opts.domain[0]]
      : (() => {
          const e = extent([...beforeAll, ...afterAll]) ?? [0, 1];
          return e[0] === e[1] ? [e[0] - 0.5, e[1] + 0.5] : e;
        })();

  // Only the values the shared bins COUNT are part of the reading. `domain`
  // windows the plot (values outside it are not binned), and medians taken over
  // the whole sample described a distribution nothing painted — a window past
  // the data left an empty plot still announcing "Median fell from 116 to 92",
  // with both rules clamped onto the left edge.
  const inDomain = (v: number) => v >= dom[0] && v <= dom[1];
  const before = beforeAll.filter(inDomain);
  const after = afterAll.filter(inDomain);
  if (before.length === 0 && after.length === 0) return null;

  const union = [...before, ...after];
  // A `bins` a host computed is not always a bin count: `Number("")` → NaN
  // collapsed the bin array to empty (a blank plot under a summary that still
  // read the shift), and a ratio → Infinity threw RangeError out of Array.from
  // and took the whole render down. Non-finite falls back to the documented
  // auto count; more bins than observations is only slivers, so it also caps.
  const binCount =
    opts.bins !== undefined && Number.isFinite(opts.bins)
      ? Math.max(1, Math.min(opts.bins, union.length))
      : undefined;
  const shared = uniformBins(union, {
    ...(binCount !== undefined ? { bins: binCount } : {}),
    domain: dom,
  })!;
  const k = shared.bins.length;
  const bBins = uniformBins(before, { bins: k, domain: dom });
  const aBins = uniformBins(after, { bins: k, domain: dom });

  const plotW = width - 2 * pad;
  const centerY = round2(height / 2);
  const halfH = height / 2 - pad;
  const colW = plotW / k;

  // per-side proportions on one shared scale = max proportion across both sides
  const bShare = (i: number) => bBins?.bins[i]?.share ?? 0;
  const aShare = (i: number) => aBins?.bins[i]?.share ?? 0;
  let maxProp = 0;
  for (let i = 0; i < k; i++) maxProp = Math.max(maxProp, bShare(i), aShare(i));
  const hScale = maxProp > 0 ? halfH / maxProp : 0;

  const bins: ShiftBin[] = shared.bins.map((b, i) => ({
    x: round2(pad + i * colW + colW * 0.08),
    width: round2(colW * 0.84),
    up: round2(bShare(i) * hScale),
    down: round2(aShare(i) * hScale),
    x0: round2(b.x0),
    x1: round2(b.x1),
    beforeShare: round2(bShare(i)),
    afterShare: round2(aShare(i)),
  }));

  const xScale = scaleLinear(dom, [pad, width - pad]);
  const medX = (v: number) => round2(clamp(xScale(v), pad, width - pad));
  const bMed = before.length ? median(before) : null;
  const aMed = after.length ? median(after) : null;

  return {
    centerY,
    y0: round2(pad),
    y1: round2(height - pad),
    bins,
    medians: {
      before: bMed === null ? null : { x: medX(bMed), value: round2(bMed) },
      after: aMed === null ? null : { x: medX(aMed), value: round2(aMed) },
    },
    shift: bMed === null || aMed === null ? null : round2(aMed - bMed),
    nBefore: before.length,
    nAfter: after.length,
    labelX: round2(width + 3),
    totalWidth: width + gutter,
  };
}
