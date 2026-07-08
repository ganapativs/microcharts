// ForecastCone geometry — pure, React-free (plan/23 #11). Will we land where we
// need to? History as a solid line, then a fan of prediction bands (p80, p50)
// widening over the horizon with a DASHED median (an estimate never renders as
// fact). The fan's whole honesty is visible confidence decay, so: at most 2
// bands (50/80 — a 95% band reads as false tail confidence at micro scale), the
// mid is always dashed, and non-widening input is flagged, never auto-inflated.
// Coords 2-dp, integer viewBox.
import { linePath } from "../../core/path.js";
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type XY } from "../../core/types.js";

export interface ForecastInput {
  mid: readonly number[];
  p80: readonly (readonly [number, number])[];
  p50?: readonly (readonly [number, number])[] | undefined;
}

interface ConePoint {
  x: number;
  y: number;
  /** 1-based period across the whole axis. */
  period: number;
  kind: "history" | "forecast";
  value: number;
  /** Forecast-region interval (p80). */
  lo: number | null;
  hi: number | null;
}

export interface ForecastConeGeometry {
  history: { d: string };
  boundary: { x: number; y: number };
  /** Per-period positions across history + forecast — overlays + nearest-x. */
  points: ConePoint[];
  mid: { d: string };
  /** Closed area paths, faintest (80) first. */
  bands: { p: 50 | 80; d: string }[];
  target: { y: number } | null;
  landing: { x: number; y: number; value: number };
  /** Median forecast at the horizon + the p80 interval there (summary). */
  horizon: { mid: number; lo: number; hi: number };
  /** History's last actual (summary "from N today"). */
  now: number | null;
  /** false ⇒ the input cone fails to widen (input-honesty failure). */
  widening: boolean;
  labelX: number;
  labelY: number;
  totalWidth: number;
}

// normalize a [lo,hi] pair (swap if reversed)
const pair = (p: readonly [number, number]): [number, number] =>
  p[0] <= p[1] ? [p[0], p[1]] : [p[1], p[0]];

export function forecastConeGeometry(opts: {
  width: number;
  height: number;
  data: readonly number[];
  forecast: ForecastInput;
  target?: number | undefined;
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
}): ForecastConeGeometry | null {
  const history = opts.data.filter(isFiniteValue);
  const mids = opts.forecast.mid.filter(isFiniteValue);
  const F = mids.length;
  if (F === 0) return null;

  const { width, height } = opts;
  const pad = opts.pad ?? 2;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;

  const H = history.length;
  const n = H + F; // total points on the axis
  const W = width - 2 * pad;
  const X = (i: number) => round2(n <= 1 ? (pad + width - pad) / 2 : pad + (W * i) / (n - 1));

  // aligned band pairs (cap at 2 bands: 80 outer, 50 inner)
  const p80 = opts.forecast.p80.slice(0, F).map(pair);
  const p50 = opts.forecast.p50?.slice(0, F).map(pair);

  const allVals = [
    ...history,
    ...mids,
    ...p80.flat(),
    ...(p50 ? p50.flat() : []),
    ...(opts.target !== undefined && isFiniteValue(opts.target) ? [opts.target] : []),
  ];
  const dom: readonly [number, number] =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (() => {
          const e = extent(allVals) ?? [0, 1];
          return e[0] === e[1] ? [e[0] - 1, e[1] + 1] : e;
        })();
  const yScale = scaleLinear(dom, [height - pad, pad]);
  const Y = (v: number) => round2(clamp(yScale(v), pad, height - pad));

  // history line + boundary (today)
  const histPts: XY[] = history.map((v, i) => [X(i), Y(v)]);
  const boundary = H > 0 ? { x: X(H - 1), y: Y(history[H - 1]!) } : { x: X(0), y: Y(mids[0]!) };

  // forecast x positions start right after the boundary
  const fx = (j: number) => X(H + j);

  // cone band polygons emanate from the boundary point (narrow) and widen
  const coneD = (pairs: [number, number][]): string => {
    const hi: XY[] = pairs.map((pr, j) => [fx(j), Y(pr[1])]);
    const lo: XY[] = pairs.map((pr, j) => [fx(j), Y(pr[0])]);
    const start: XY = H > 0 ? [boundary.x, boundary.y] : hi[0]!;
    const pts = [start, ...hi, ...[...lo].reverse()];
    return "M" + pts.map((p) => `${p[0]} ${p[1]}`).join(" L") + " Z";
  };

  const bands: { p: 50 | 80; d: string }[] = [{ p: 80, d: coneD(p80) }];
  if (p50) bands.push({ p: 50, d: coneD(p50) });

  // mid path — connects the join then dashes across the forecast
  const midPts: XY[] = [];
  if (H > 0) midPts.push([boundary.x, boundary.y]);
  mids.forEach((v, j) => midPts.push([fx(j), Y(v)]));

  const points: ConePoint[] = [
    ...history.map(
      (v, i): ConePoint => ({
        x: X(i),
        y: Y(v),
        period: i + 1,
        kind: "history",
        value: round2(v),
        lo: null,
        hi: null,
      }),
    ),
    ...mids.map(
      (v, j): ConePoint => ({
        x: fx(j),
        y: Y(v),
        period: H + j + 1,
        kind: "forecast",
        value: round2(v),
        lo: round2(p80[j]![0]),
        hi: round2(p80[j]![1]),
      }),
    ),
  ];

  const landing = { x: fx(F - 1), y: Y(mids[F - 1]!), value: round2(mids[F - 1]!) };
  const horizon = {
    mid: round2(mids[F - 1]!),
    lo: round2(p80[F - 1]![0]),
    hi: round2(p80[F - 1]![1]),
  };

  // widening check: p80 width at horizon ≥ width at start − ε (2% of domain)
  const eps = 0.02 * (dom[1] - dom[0]);
  const startW = F > 0 ? p80[0]![1] - p80[0]![0] : 0;
  const endW = F > 0 ? p80[F - 1]![1] - p80[F - 1]![0] : 0;
  const widening = F < 2 || endW >= startW - eps;

  return {
    history: { d: linePath(histPts) },
    boundary,
    points,
    mid: { d: linePath(midPts) },
    bands,
    target: opts.target !== undefined && isFiniteValue(opts.target) ? { y: Y(opts.target) } : null,
    landing,
    horizon,
    now: H > 0 ? round2(history[H - 1]!) : null,
    widening,
    labelX: round2(width + 3),
    labelY:
      fontSize > 0 ? round2(clamp(landing.y, fontSize * 0.7, height - fontSize * 0.6)) : landing.y,
    totalWidth: width + gutter,
  };
}
