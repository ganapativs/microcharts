// ControlStrip: Is the process in
// control, or did something leave the band? A Shewhart individuals chart: the
// control band is center ± 3σ̂ where σ̂ = mean moving range / 1.128 (the
// individuals estimator — sample SD is NOT used, it inflates limits under
// drift). In-control points are bare vertices; only out-of-control points are
// marked (ringed, negative) — an in-control process should look boring.
// Coords 2-dp, integer viewBox.
import { linePath } from "../../core/path.js";
import { quantiles } from "../../core/quantile.js";
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type XY } from "../../core/types.js";

export type ControlLimits = "sigma" | "percentile";
export type ControlRules = "none" | "we";

interface ControlViolation {
  index: number;
  rule: "we1" | "we2" | "we4";
}

export interface ControlGeometry {
  center: { y: number; value: number };
  band: { y: number; height: number; lo: number; hi: number };
  line: { d: string };
  points: { x: number; y: number; out: boolean }[];
  violations: ControlViolation[];
  /** false when n < 10 — limits provisional. */
  reliable: boolean;
  /** MR̄ = 0 → band collapses to the center hairline. */
  degenerate: boolean;
  n: number;
  /** Resolved value domain `[min,max]` — the annotation-host y-frame. */
  domain: readonly [number, number];
}

export function controlGeometry(opts: {
  width: number;
  height: number;
  data: readonly number[];
  limits?: ControlLimits | undefined;
  baseline?: number | undefined;
  rules?: ControlRules | undefined;
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
}): ControlGeometry | null {
  const data = opts.data.filter(isFiniteValue);
  const n = data.length;
  if (n === 0) return null;

  const { width, height } = opts;
  const pad = opts.pad ?? 2;
  const W = width - 2 * pad;

  const center =
    opts.baseline !== undefined && isFiniteValue(opts.baseline)
      ? opts.baseline
      : data.reduce((s, v) => s + v, 0) / n;

  // σ̂ from the mean moving range (Shewhart individuals): MR̄ / 1.128
  let mrSum = 0;
  for (let i = 1; i < n; i++) mrSum += Math.abs(data[i]! - data[i - 1]!);
  const mrBar = n > 1 ? mrSum / (n - 1) : 0;
  const sigmaHat = mrBar / 1.128;
  const degenerate = sigmaHat === 0;

  let lo: number;
  let hi: number;
  if (opts.limits === "percentile" && n >= 2) {
    const [q1, q2] = quantiles(data, [0.00135, 0.99865])! as [number, number];
    lo = q1;
    hi = q2;
  } else {
    lo = center - 3 * sigmaHat;
    hi = center + 3 * sigmaHat;
  }
  const sigma2 = sigmaHat; // 2σ band edge distance uses 2·σ̂ below

  // y-domain fits the data + the limits so nothing clips
  const dom: readonly [number, number] =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (() => {
          const e = extent([...data, lo, hi]) ?? [center - 1, center + 1];
          return e[0] === e[1] ? [e[0] - 1, e[1] + 1] : e;
        })();
  const yScale = scaleLinear(dom, [height - pad, pad]);
  const Y = (v: number) => round2(clamp(yScale(v), pad, height - pad));
  const X = (i: number) => round2(n === 1 ? (pad + width - pad) / 2 : pad + (W * i) / (n - 1));

  const bandTop = Y(hi);
  const bandBottom = Y(lo);

  const out = data.map((v) => v > hi + 1e-9 || v < lo - 1e-9);
  const pts: XY[] = data.map((v, i) => [X(i), Y(v)]);
  const points = pts.map((p, i) => ({ x: p[0], y: p[1], out: out[i]! }));

  // violations: WE-1 (beyond 3σ, always) + optional WE-2 / WE-4 run rules
  const violations: ControlViolation[] = [];
  data.forEach((_, i) => {
    if (out[i]) violations.push({ index: i, rule: "we1" });
  });
  if (opts.rules === "we" && !degenerate) {
    const up2 = data.map((v) => v > center + 2 * sigma2 + 1e-9);
    const dn2 = data.map((v) => v < center - 2 * sigma2 - 1e-9);
    // WE-2: 2 of 3 consecutive beyond 2σ on the same side (flag the 3rd)
    for (let i = 2; i < n; i++) {
      const upCount = (up2[i] ? 1 : 0) + (up2[i - 1] ? 1 : 0) + (up2[i - 2] ? 1 : 0);
      const dnCount = (dn2[i] ? 1 : 0) + (dn2[i - 1] ? 1 : 0) + (dn2[i - 2] ? 1 : 0);
      if ((upCount >= 2 || dnCount >= 2) && !out[i]) violations.push({ index: i, rule: "we2" });
    }
    // WE-4: 8 consecutive on one side of center (flag the 8th)
    for (let i = 7; i < n; i++) {
      let allUp = true;
      let allDn = true;
      for (let j = i - 7; j <= i; j++) {
        if (data[j]! <= center) allUp = false;
        if (data[j]! >= center) allDn = false;
      }
      if ((allUp || allDn) && !out[i]) violations.push({ index: i, rule: "we4" });
    }
  }

  return {
    center: { y: Y(center), value: round2(center) },
    band: {
      y: bandTop,
      height: round2(bandBottom - bandTop),
      lo: round2(lo),
      hi: round2(hi),
    },
    line: { d: linePath(pts) },
    points,
    violations,
    reliable: n >= 10,
    degenerate,
    n,
    domain: dom,
  };
}
