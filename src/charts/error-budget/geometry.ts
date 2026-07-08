// ErrorBudget geometry — pure, React-free (plan/23 #9). Are we burning the
// error budget too fast to survive the window? X = window elapsed 0→1, Y =
// budget remaining 1→0. The steady-burn diagonal (0,1)→(1,0) is the pace that
// exactly spends the window; faster burn-rate reference lines (Google-SRE
// 1×/6×/14.4× convention) sit below it as policy context — NOT physics, so
// they're configurable and rendered as faint region ink, never data ink.
// Coords 2-dp, integer viewBox.
import { linePath } from "../../core/path.js";
import { clamp } from "../../core/scale.js";
import { round2, type XY } from "../../core/types.js";

interface BudgetPoint {
  index: number;
  x: number;
  y: number;
  value: number;
  /** Local burn multiple ending at this step (÷ steady rate), 2-dp. */
  rate: number;
}

export interface ErrorBudgetGeometry {
  diagonal: { x1: number; y1: number; x2: number; y2: number };
  /** Faster-than-steady reference lines (rate > 1), faint region ink. */
  wedges: { rate: number; d: string }[];
  line: { d: string };
  remaining: { x: number; y: number; value: number };
  /** Observed burn multiple over the last k steps ÷ steady rate, 2-dp. */
  currentRate: number;
  /** Elapsed-fraction position of "now" (last observed step). */
  nowElapsed: number;
  /** Per-step positions + local burn rate — overlays + nearest-x. */
  points: BudgetPoint[];
  /** Budget hit 0 before the window ended. */
  exhausted: { x: number; index: number } | null;
  labelX: number;
  labelY: number;
  totalWidth: number;
}

export function errorBudgetGeometry(opts: {
  width: number;
  height: number;
  data: readonly number[];
  /** Total steps in the SLO window (default = data.length → "now" is window end). */
  window?: number | undefined;
  rates?: readonly number[] | undefined;
  pad?: number | undefined;
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
}): ErrorBudgetGeometry | null {
  const data = opts.data.filter((v) => Number.isFinite(v));
  const n = data.length;
  if (n === 0) return null;

  const { width, height } = opts;
  const pad = opts.pad ?? 2;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;

  const windowTotal = Math.max(n, opts.window ?? n);
  const W = width - 2 * pad;
  const H = height - 2 * pad;
  const X = (e: number) => round2(pad + clamp(e, 0, 1) * W);
  const Y = (r: number) => round2(pad + (1 - clamp(r, 0, 1)) * H);

  // elapsed of step i within the full window; last observed = "now"
  const elapsed = (i: number) => (windowTotal <= 1 ? 0 : i / (windowTotal - 1));
  const nowElapsed = elapsed(n - 1);

  // steady diagonal — the pace that exactly spends the window
  const diagonal = { x1: X(0), y1: Y(1), x2: X(1), y2: Y(0) };

  // faster reference lines: rate r hits remaining 0 at elapsed 1/r
  const rates = (opts.rates ?? [1, 6, 14.4]).filter((r) => r > 1);
  const wedges = rates.map((rate) => ({
    rate,
    d: linePath([
      [X(0), Y(1)],
      [X(1 / rate), Y(0)],
    ]),
  }));

  // actual remaining line, clamped to [0,1]; exhaustion = first 0-crossing
  let exhaustedIdx = -1;
  const pts: XY[] = [];
  for (let i = 0; i < n; i++) {
    const r = clamp(data[i]!, 0, 1);
    pts.push([X(elapsed(i)), Y(r)]);
    if (exhaustedIdx < 0 && r <= 0) exhaustedIdx = i;
  }

  const lastR = clamp(data[n - 1]!, 0, 1);
  const remaining = { x: X(nowElapsed), y: Y(lastR), value: round2(lastR) };

  // local burn multiple ending at step i: |Δremaining| / Δelapsed over the last
  // k steps ÷ steady(=1). k documented; index 0 has no prior → rate 0.
  const k = Math.max(2, Math.ceil(n / 6));
  const rateAt = (i: number): number => {
    if (i < 1) return 0;
    const startI = Math.max(0, i - k + 1);
    const dRem = clamp(data[startI]!, 0, 1) - clamp(data[i]!, 0, 1);
    const dElapsed = elapsed(i) - elapsed(startI);
    return dElapsed > 0 ? round2(dRem / dElapsed) : 0;
  };
  const currentRate = rateAt(n - 1);

  const points: BudgetPoint[] = pts.map((p, i) => ({
    index: i,
    x: p[0],
    y: p[1],
    value: round2(clamp(data[i]!, 0, 1)),
    rate: rateAt(i),
  }));

  return {
    diagonal,
    wedges,
    line: { d: linePath(pts) },
    remaining,
    currentRate,
    nowElapsed: round2(nowElapsed),
    points,
    exhausted: exhaustedIdx >= 0 ? { x: X(elapsed(exhaustedIdx)), index: exhaustedIdx } : null,
    labelX: round2(width + 3),
    // central-baseline box spans ≈ ±0.55·fontSize, so keep that margin from
    // both edges or a 0%-remaining (bottom) label escapes
    labelY:
      fontSize > 0
        ? round2(clamp(remaining.y, fontSize * 0.7, height - fontSize * 0.6))
        : remaining.y,
    totalWidth: width + gutter,
  };
}
