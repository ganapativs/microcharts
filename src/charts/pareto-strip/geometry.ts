// ParetoStrip geometry — pure, React-free (plan/23 #15). What should we fix
// first? Descending bars + a cumulative-share line on a FIXED 0–100% scale that
// spans the full plot height (never rescaled to steepen the curve). Bars up to
// the threshold crossing are "vital" (accent); the rest are muted — the chart's
// one job is to say where to stop reading. `Other` never participates in
// ranking. Coords 2-dp, integer viewBox.
import { round2 } from "../../core/types.js";

interface ParetoBar {
  x: number;
  width: number;
  y: number;
  height: number;
  label: string;
  share: number;
  cum: number;
  vital: boolean;
}

export interface ParetoGeometry {
  bars: ParetoBar[];
  line: { d: string };
  thresholdY: number | null;
  /** First bar whose cumulative share ≥ threshold. */
  crossing: { index: number; x: number } | null;
  other: { count: number; share: number } | null;
  /** Categories reaching the threshold + original category count. */
  vitalCount: number;
  n: number;
  cumAtCrossing: number;
  topLabel: string;
  topShare: number;
  degenerate: boolean;
  labelX: number;
  totalWidth: number;
}

export function paretoGeometry(opts: {
  width: number;
  height: number;
  data: readonly { label: string; value: number }[];
  threshold?: number | false | undefined;
  max?: number | undefined;
  pad?: number | undefined;
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
}): ParetoGeometry | null {
  // negatives are invalid for a composition — excluded (documented dev error)
  const valid = opts.data.filter((d) => Number.isFinite(d.value) && d.value >= 0);
  if (valid.length === 0) return null;

  const { width, height } = opts;
  const pad = opts.pad ?? 2;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;
  const max = Math.max(1, Math.min(12, Math.round(opts.max ?? 8)));
  const threshold = opts.threshold === false ? null : (opts.threshold ?? 80);

  // stable descending sort (input order breaks ties)
  const sorted = valid.map((d, i) => ({ ...d, i })).sort((a, b) => b.value - a.value || a.i - b.i);
  const nOriginal = sorted.length;

  // roll everything beyond `max` into Other (always last, never re-ranked)
  const head = sorted.slice(0, max);
  const tail = sorted.slice(max);
  const otherValue = tail.reduce((s, d) => s + d.value, 0);
  const rows: { label: string; value: number; isOther: boolean }[] = head.map((d) => ({
    label: d.label,
    value: d.value,
    isOther: false,
  }));
  if (tail.length > 0) rows.push({ label: "Other", value: otherValue, isOther: true });

  const total = valid.reduce((s, d) => s + d.value, 0);
  const degenerate = total === 0;

  const plotW = width - 2 * pad;
  const plotH = height - 2 * pad;
  const baseline = height - pad;
  const k = rows.length;
  const colW = plotW / k;
  const maxVal = Math.max(...rows.map((r) => r.value), 0);

  const thFrac = threshold === null ? null : threshold / 100;

  // cumulative shares + the crossing index (plain loop so it stays typed)
  const cums: number[] = [];
  let acc = 0;
  for (const r of rows) {
    acc += degenerate ? 0 : r.value / total;
    cums.push(acc);
  }
  let crossingIndex = -1;
  if (thFrac !== null) {
    for (let i = 0; i < k; i++) {
      if (!rows[i]!.isOther && cums[i]! >= thFrac - 1e-9) {
        crossingIndex = i;
        break;
      }
    }
  }
  const colCenter = (i: number) => round2(pad + i * colW + colW / 2);

  const bars: ParetoBar[] = rows.map((r, i) => {
    const h = maxVal > 0 ? round2((r.value / maxVal) * plotH) : 0;
    return {
      x: round2(pad + i * colW + colW * 0.1),
      width: round2(colW * 0.8),
      y: round2(baseline - h),
      height: h,
      label: r.label,
      share: round2(degenerate ? 0 : r.value / total),
      cum: round2(cums[i]!),
      // the accent stops at the crossing: every non-Other bar up to it is vital
      vital: crossingIndex >= 0 && i <= crossingIndex && !r.isOther,
    };
  });
  const crossing =
    crossingIndex >= 0 ? { index: crossingIndex, x: colCenter(crossingIndex) } : null;

  // cumulative line on the FIXED 0–100% scale (full height)
  const cumY = (c: number) => round2(baseline - Math.min(1, c) * plotH);
  const linePts = bars.map((b, i) => `${colCenter(i)} ${cumY(b.cum)}`);
  const line = { d: degenerate ? "" : "M" + linePts.join(" L") };

  const vitalCount = crossingIndex >= 0 ? crossingIndex + 1 : 0;

  return {
    bars,
    line,
    thresholdY: thFrac === null ? null : round2(baseline - thFrac * plotH),
    crossing,
    other:
      tail.length > 0 ? { count: tail.length, share: round2(otherValue / (total || 1)) } : null,
    vitalCount,
    n: nOriginal,
    cumAtCrossing: crossingIndex >= 0 ? round2(bars[crossingIndex]!.cum) : 0,
    topLabel: rows[0]!.label,
    topShare: bars[0]!.share,
    degenerate,
    labelX: round2(width + 3),
    totalWidth: width + gutter,
  };
}
