// EtaBar: The x-axis is
// TIME, not fraction: the remainder is sized by the OBSERVED rate, never linear
// interpolation. When the rate drops, the remainder visibly grows — that is the
// feature. Rate ≤ 0 / absent → indeterminate (stalled). never a fake countdown.
import { round2 } from "../../core/types.js";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function etaBarGeometry(opts: {
  progress: number;
  elapsed: number;
  rate: number | null;
  width: number;
  height: number;
}): {
  done: Rect;
  remaining: Rect | null;
  indeterminate: boolean;
  overflow: boolean;
  remainingTime: number | null;
  predictedTotal: number | null;
} {
  const { progress, elapsed, width, height } = opts;
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const inset = 1;
  const y = inset;
  const h = round2(height - inset * 2);
  const track = width - inset * 2;

  if (p >= 1) {
    return {
      done: { x: inset, y, width: round2(track), height: h },
      remaining: null,
      indeterminate: false,
      overflow: false,
      remainingTime: 0,
      predictedTotal: Number.isFinite(elapsed) ? elapsed : null,
    };
  }

  const rate =
    opts.rate != null && Number.isFinite(opts.rate)
      ? opts.rate
      : Number.isFinite(elapsed) && elapsed > 0
        ? p / elapsed
        : null;

  // stalled / indeterminate — rate unknown or non-positive
  if (rate == null || rate <= 0) {
    return {
      done: { x: inset, y, width: round2(Math.max(0, p * track)), height: h },
      remaining: { x: round2(inset + p * track), y, width: round2((1 - p) * track), height: h },
      indeterminate: true,
      overflow: false,
      remainingTime: null,
      predictedTotal: null,
    };
  }

  const remainingTime = (1 - p) / rate;
  const predictedTotal = (Number.isFinite(elapsed) ? elapsed : 0) + remainingTime;
  let doneFrac = predictedTotal > 0 ? (Number.isFinite(elapsed) ? elapsed : 0) / predictedTotal : 0;
  let overflow = false;
  // remainder ≫ elapsed → clamp done to 10% + overflow chevron (documented)
  if (doneFrac < 0.1) {
    doneFrac = 0.1;
    overflow = true;
  }
  const doneW = round2(doneFrac * track);
  return {
    done: { x: inset, y, width: doneW, height: h },
    remaining: { x: round2(inset + doneW), y, width: round2(track - doneW), height: h },
    indeterminate: false,
    overflow,
    remainingTime: round2(remainingTime),
    predictedTotal: round2(predictedTotal),
  };
}

/** Diagonal-hatch path across a rect (indeterminate remainder texture). */
export function hatchPath(r: Rect, step = 3): string {
  let d = "";
  const x1 = r.x;
  const x2 = r.x + r.width;
  const yTop = r.y;
  const yBot = r.y + r.height;
  // 45° lines sweeping left→right; clip by drawing only within the rect bounds
  for (let x = x1 - r.height; x < x2; x += step) {
    const ax = Math.max(x1, x);
    const ay = yBot - (ax - x);
    const bx = Math.min(x2, x + r.height);
    const by = yBot - (bx - x);
    if (ay < yTop || by < yTop) continue;
    d += `M${round2(ax)} ${round2(ay)}L${round2(bx)} ${round2(by)}`;
  }
  return d;
}
