// WindBarb geometry — pure, React-free (plan/25 §8, plan/17 F3). Direction as a
// shaft angle + QUANTIZED magnitude as WMO barbs (pennant = 5·step, full = step,
// half = step/2). Quantization is the honesty, not a limitation. 0° = up/north,
// clockwise. Reused by station-glyph (chart-local import). 2-dp.
import { round2 } from "../../core/types.js";

export interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface WindBarbGeometry {
  shaft: Seg;
  /** Full + half barb strokes (drawn as one path by the component). */
  barbs: Seg[];
  /** Filled pennant triangles (5·step each) as path strings. */
  pennants: string[];
  calm: boolean;
  counts: { pennant: number; full: number; half: number };
  /** Center, for the calm-circle glyph. */
  center: { x: number; y: number };
}

function rot(x: number, y: number, a: number): [number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - y * s, x * s + y * c];
}

export function windBarbGeometry(opts: {
  direction: number;
  magnitude: number;
  step: number;
  width: number;
  height: number;
}): WindBarbGeometry {
  const { direction, magnitude, step, width, height } = opts;
  const cx = round2(width / 2);
  const cy = round2(height / 2);
  const R = Math.min(width, height) / 2 - 2;
  const m = Math.abs(magnitude);

  // 0° = up/north, clockwise: dir = (sinθ, −cosθ) in screen coords (y down)
  const θ = (direction * Math.PI) / 180;
  const dx = Math.sin(θ);
  const dy = -Math.cos(θ);
  const center = { x: cx, y: cy };

  if (!Number.isFinite(m) || m < step / 4) {
    return {
      shaft: { x1: cx, y1: cy, x2: cx, y2: cy },
      barbs: [],
      pennants: [],
      calm: true,
      counts: { pennant: 0, full: 0, half: 0 },
      center,
    };
  }

  const tipX = cx + dx * R;
  const tipY = cy + dy * R;
  const shaft: Seg = { x1: round2(cx), y1: round2(cy), x2: round2(tipX), y2: round2(tipY) };

  // quantize to pennant / full / half (nearest half-step overall)
  let rem = Math.round(m / (step / 2)) * (step / 2);
  let pennant = Math.floor(rem / (5 * step));
  rem -= pennant * 5 * step;
  let full = Math.floor(rem / step);
  rem -= full * step;
  let half = rem >= step / 2 ? 1 : 0;

  // barb direction: rotate the shaft direction back-and-to-the-side (~120°)
  const [bx, by] = rot(dx, dy, (120 * Math.PI) / 180);
  const barbLenFull = R * 0.55;
  const barbLenHalf = R * 0.3;
  const penLen = R * 0.55;
  const penW = 2.6;
  const spacing = 2.2;

  // Saturate at the shaft's capacity. A non-physical magnitude (e.g. 1e15) would
  // otherwise emit trillions of marks — unbounded allocation AND a viewBox
  // escape. Clamp the DRAWN glyph count to what fits along the shaft; the summary
  // still reports the true magnitude, so the encoding stays honest.
  const penStep = penW + 0.6;
  const maxPennant = Math.max(0, Math.floor(R / penStep));
  if (pennant > maxPennant) {
    pennant = maxPennant;
    full = 0;
    half = 0;
  } else {
    const maxFull = Math.max(0, Math.floor((R - pennant * penStep) / spacing));
    if (full > maxFull) {
      full = maxFull;
      half = 0;
    }
  }

  const barbs: Seg[] = [];
  const pennants: string[] = [];
  let d = 0; // distance from tip toward base

  const at = (dist: number): [number, number] => [tipX - dx * dist, tipY - dy * dist];

  for (let i = 0; i < pennant; i++) {
    const [ax, ay] = at(d);
    const apexX = ax + bx * penLen;
    const apexY = ay + by * penLen;
    const [ex, ey] = at(d + penW);
    pennants.push(
      `M${round2(ax)} ${round2(ay)}L${round2(apexX)} ${round2(apexY)}L${round2(ex)} ${round2(ey)}Z`,
    );
    d += penW + 0.6;
  }
  for (let i = 0; i < full; i++) {
    const [ax, ay] = at(d);
    barbs.push({
      x1: round2(ax),
      y1: round2(ay),
      x2: round2(ax + bx * barbLenFull),
      y2: round2(ay + by * barbLenFull),
    });
    d += spacing;
  }
  if (half) {
    // a lone half barb sits inset from the tip (convention); otherwise inline
    if (pennant === 0 && full === 0) d = spacing;
    const [ax, ay] = at(d);
    barbs.push({
      x1: round2(ax),
      y1: round2(ay),
      x2: round2(ax + bx * barbLenHalf),
      y2: round2(ay + by * barbLenHalf),
    });
  }

  return { shaft, barbs, pennants, calm: false, counts: { pennant, full, half }, center };
}
