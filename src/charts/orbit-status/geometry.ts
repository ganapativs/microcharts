// How slow and how busy is this dependency right now? Orbit RADIUS = latency;
// orbit DASH DENSITY = call rate (quantized to 5 steps — denser = busier). which
// the interactive entry mirrors as angular SPEED. Both are LOW-precision ordinal
// channels (docs steer exact reads elsewhere). The satellite's static angle
// (top) encodes NOTHING — only its speed does. Both channels read against a
// stated reference when the caller passes no domain (see `ld`/`rateStep`). All
// coords 2-dp.
import { clamp, scaleLinear } from "../../core/scale.js";
import { evenDashes, polarPoint } from "../../core/arc.js";
import { isFiniteValue, round2 } from "../../core/types.js";

/** Dash counts per rate step 1–5 (denser dashes = busier). */
const DASH_COUNTS = [4, 8, 14, 22, 32] as const;

/** Latency reference (ms) with no `domain` and no `threshold` to derive one from. */
const LATENCY_REF_MS = 1000;

/** Documented default box, shared by the geometry and both entries. */
const DEFAULT_SIZE = 20;

/**
 * Glyph box, resolved once. `size` arrives from a host (a CSS var read back, a
 * collapsed flex measurement, an empty numeric input), and every coordinate
 * below derives from THIS value: the old code laid the marks out against the
 * raw prop while exporting a clamped box, so `size={NaN}` emitted `cx="NaN"`
 * inside the 1×1 viewBox `Chart` had already clamped to — an invisible glyph
 * still announcing a latency — and `size={-20}` put the orbit at cx=-10 with a
 * negative radius.
 */
function resolveSize(size: number): number {
  return isFiniteValue(size) ? Math.max(1, Math.round(size)) : DEFAULT_SIZE;
}

/**
 * Reserved gutter (viewBox units) for the ms numeral beside the orbit. The
 * per-char estimate is `textGutter`'s 0.62 widened to 0.7 because this label is
 * not digits-only — the "ms" glyphs run wider than tabular figures. Both
 * entries call this rather than each keeping a copy of the expression: they
 * size the same viewBox, and the interactive readout is positioned as a
 * percentage of it.
 */
export function orbitLabelBand(chars: number, fontSize: number): number {
  return Math.ceil(chars * 0.7 * fontSize + 2);
}

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
  const { pad } = opts;
  const size = resolveSize(opts.size);
  const cx = round2(size / 2);
  const cy = round2(size / 2);
  const rCenter = round2(size * 0.09);

  const unknown = !isFiniteValue(opts.latency) || !isFiniteValue(opts.rate);

  // Resolved once: the alert edge and the radius reserve below must agree on
  // whether this chart has a threshold at all.
  const threshold = isFiniteValue(opts.threshold) ? opts.threshold : null;
  const satBase = Math.max(1, size * 0.06);
  // The satellite RIDES on the orbit, so the outer bound has to leave room for
  // the satellite's own radius. The old fixed `- 1` was that radius back when
  // the satellite was always 1 unit; it stopped tracking once the satellite
  // grew with `size` and doubled on alert, and at the default size an alerted
  // satellite at the top of the domain hung 0.4 units ABOVE the viewBox
  // (`.mc-root` is `overflow: visible`, so that paints on the page).
  //
  // Reserve for the largest satellite this chart can ever draw, not the one it
  // is drawing now: a range that shrank the moment the threshold tripped would
  // pull the orbit inward as latency ROSE past it.
  const satReserve = threshold !== null ? satBase * 2 : satBase;
  const rMax = Math.max(0, size / 2 - pad - satReserve);
  // Ordered, or `clamp` returns `rMin` for every value — an orbit drawn outside
  // its own bound at box sizes where the inner floor no longer fits.
  const rMin = Math.min(rCenter + 1.5, rMax);

  const latency = unknown ? 0 : Math.max(0, opts.latency);
  const rate = unknown ? 0 : Math.max(0, opts.rate);

  // Default latency reference. `latency` is ONE number, so it carries no extent
  // of its own, and the old default read `[0, latency * 2]` — the datum defining
  // its own domain. Every input then landed at exactly half the radius range:
  // the orbit was a constant, two services 10× apart drew the same circle, and
  // only the summary carried the ms.
  //
  // So the frame comes from outside the datum. A `threshold` is the caller's own
  // scale (the budget this service is judged against), so it sets the reference
  // and the alert edge falls on the halfway orbit — the radius crosses the
  // middle of its range exactly when the satellite doubles. With no threshold
  // the reference is 0–1000 ms: one second is the human-scale ceiling on a
  // dependency call, it is the same frame for every glyph on the page (rows of a
  // service table compare), and anything slower rides the outer orbit while the
  // summary still states the exact ms.
  const twiceThreshold = threshold !== null && threshold > 0 ? threshold * 2 : 0;
  const ld: [number, number] =
    opts.latencyDomain && opts.latencyDomain.every((d) => Number.isFinite(d))
      ? [opts.latencyDomain[0]!, opts.latencyDomain[1]!]
      : [0, isFiniteValue(twiceThreshold) && twiceThreshold > 0 ? twiceThreshold : LATENCY_REF_MS];
  const rd: [number, number] | null =
    opts.rateDomain && opts.rateDomain.every((d) => Number.isFinite(d))
      ? [opts.rateDomain[0]!, opts.rateDomain[1]!]
      : null;

  const orbitR = round2(clamp(scaleLinear(ld, [rMin, rMax])(latency), rMin, rMax));

  // Rate → 1..5 step (0 when the rate is 0 → a solid, dash-free orbit).
  //
  // The default was `[0, rate * 2]`, which pinned every nonzero rate to step 3.
  // The replacement is not a fixed extent, because call rates run over orders of
  // magnitude (a nightly job at 0.2/s beside an edge service at 4k/s) and this
  // channel is five ordinal steps rather than a length: one step IS one decade —
  // under 1 call/s, then 1, 10, 100, 1000 and up. An explicit `rateDomain`
  // splits its own extent into the same five steps linearly.
  let rateStep: 0 | 1 | 2 | 3 | 4 | 5 = 0;
  if (rate > 0) {
    const step = rd
      ? rd[1] > rd[0]
        ? Math.ceil(clamp((rate - rd[0]) / (rd[1] - rd[0]), 0, 1) * 5)
        : 5
      : Math.floor(Math.log10(rate)) + 2;
    rateStep = clamp(step, 1, 5) as 1 | 2 | 3 | 4 | 5;
  }
  const dash = rateStep === 0 ? ([0, 0] as const) : evenDashes(orbitR, DASH_COUNTS[rateStep - 1]!);

  const alerted = !unknown && threshold !== null && latency >= threshold;
  // The `size / 2` cap only binds on a box too small to hold the satellite at
  // all (size ≤ 2), where an uncapped radius reaches past the box edge.
  const satR = round2(Math.min((alerted ? 2 : 1) * satBase, size / 2));

  // Satellite at the top (angle 0 = 12 o'clock); the angle encodes nothing.
  const [sx, sy] = polarPoint(cx, cy, orbitR, 0);

  return {
    center: { cx, cy, r: rCenter },
    orbit: { cx, cy, r: orbitR, dash, rateStep },
    satellite: { cx: round2(sx), cy: round2(sy), r: satR, alerted },
    unknown,
    size,
  };
}
