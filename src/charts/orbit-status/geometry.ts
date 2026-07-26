// How slow and how busy is this dependency right now? Orbit RADIUS = latency;
// orbit DASH DENSITY = call rate (quantized to 5 steps — denser = busier). which
// the interactive entry mirrors as angular SPEED. Both are LOW-precision ordinal
// channels (docs steer exact reads elsewhere). The satellite's static angle
// (top) encodes NOTHING — only its speed does. All coords 2-dp.
import { clamp, scaleLinear } from "../../core/scale.js";
import { evenDashes, polarPoint } from "../../core/arc.js";
import { round2 } from "../../core/types.js";

/** Dash counts per rate step 1–5 (denser dashes = busier). */
const DASH_COUNTS = [4, 8, 14, 22, 32] as const;

export interface OrbitStatusGeometry {
  center: { cx: number; cy: number; r: number };
  orbit: {
    cx: number;
    cy: number;
    r: number;
    dash: readonly [number, number];
    rateStep: 0 | 1 | 2 | 3 | 4 | 5;
  };
  satellite: { cx: number; cy: number; r: number; alerted: boolean };
  unknown: boolean;
  size: number;
}

export function orbitStatusGeometry(opts: {
  latency: number;
  rate: number;
  size: number;
  latencyDomain?: readonly [number, number] | undefined;
  rateDomain?: readonly [number, number] | undefined;
  threshold?: number | undefined;
  pad: number;
}): OrbitStatusGeometry {
  const { size, pad } = opts;
  const cx = round2(size / 2);
  const cy = round2(size / 2);
  const rCenter = round2(size * 0.09);
  const rMax = size / 2 - pad - 1;
  const rMin = rCenter + 1.5;

  const unknown =
    !(typeof opts.latency === "number" && Number.isFinite(opts.latency)) ||
    !(typeof opts.rate === "number" && Number.isFinite(opts.rate));

  const latency = unknown ? 0 : Math.max(0, opts.latency);
  const rate = unknown ? 0 : Math.max(0, opts.rate);

  const ld: [number, number] =
    opts.latencyDomain && opts.latencyDomain.every((d) => Number.isFinite(d))
      ? [opts.latencyDomain[0]!, opts.latencyDomain[1]!]
      : [0, Math.max(1, latency * 2)];
  const rd: [number, number] =
    opts.rateDomain && opts.rateDomain.every((d) => Number.isFinite(d))
      ? [opts.rateDomain[0]!, opts.rateDomain[1]!]
      : [0, Math.max(1, rate * 2)];

  const orbitR = round2(clamp(scaleLinear(ld, [rMin, rMax])(latency), rMin, rMax));

  // Rate → 1..5 step (0 when the rate is 0 → a solid, dash-free orbit).
  let rateStep: 0 | 1 | 2 | 3 | 4 | 5 = 0;
  if (rate > 0) {
    const frac = rd[1] > rd[0] ? clamp((rate - rd[0]) / (rd[1] - rd[0]), 0, 1) : 1;
    rateStep = Math.min(5, Math.max(1, Math.ceil(frac * 5))) as 1 | 2 | 3 | 4 | 5;
  }
  const dash = rateStep === 0 ? ([0, 0] as const) : evenDashes(orbitR, DASH_COUNTS[rateStep - 1]!);

  const alerted =
    !unknown &&
    typeof opts.threshold === "number" &&
    Number.isFinite(opts.threshold) &&
    latency >= opts.threshold;
  const satR = round2((alerted ? 2 : 1) * Math.max(1, size * 0.06));

  // Satellite at the top (angle 0 = 12 o'clock); the angle encodes nothing.
  const [sx, sy] = polarPoint(cx, cy, orbitR, 0);

  return {
    center: { cx, cy, r: rCenter },
    orbit: { cx, cy, r: orbitR, dash, rateStep },
    satellite: { cx: round2(sx), cy: round2(sy), r: satR, alerted },
    unknown,
    size: Math.max(1, Math.round(size)),
  };
}
