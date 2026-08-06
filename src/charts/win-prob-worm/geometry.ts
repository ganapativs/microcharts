// WinProbWorm: Who's winning, and when
// did it flip? A single win-probability series clamped to 0–100 on a FIXED
// 0–100 axis (never truncated — the honesty rule for a probability). split at
// every 50% crossing: the leading stretches (>50) read accent, the trailing
// stretches (<50) read neutral. Crossings are the lead changes; the largest
// |Δ| between adjacent points is the momentum swing. Coords 2-dp.
import { round2, isFiniteValue } from "../../core/types.js";
import { clamp } from "../../core/scale.js";
import type { WinProbWormStrings } from "../../core/strings-win-prob-worm.js";
import { textGutter } from "../../core/labels.js";

/** Symmetric inset (viewBox units) — the plot never touches the frame edge. */
export const PAD = 2;

/** The probability axis. Full range by default: a truncated frame turns a
 *  2-point edge into a rout, which is the one thing this chart must not do. */
const FRAME: readonly [number, number] = [0, 100];

/** The winning side's own probability (≥50 → v, else its complement). */
export const leaderProb = (v: number): number => (v >= 50 ? v : 100 - v);
const leaderSide = (v: number, sides: readonly [string, string]): string =>
  v >= 50 ? sides[0] : sides[1];
/**
 * A win probability (0–100) as a percent string.
 *
 * `pctFmt` takes the probability as a FRACTION and is a real percent formatter
 * (`makePercentFormatter`), so the sign's position and its spacing follow
 * `locale` — fr-FR writes "98 %", tr-TR puts the sign first. The old
 * `` `${fmt(v)}%` `` was an en-US percent, the one number on this chart that
 * `locale` never reached.
 *
 * A caller-supplied `format` still wins outright (it is the documented escape
 * hatch and often already ends in `%`): `pctFmt` is then a wrapper over their
 * formatter, and the `endsWith` guard below still stops a doubled sign.
 */
export const wormPct = (v: number, pctFmt: (fraction: number) => string): string => pctFmt(v / 100);

/** Wraps a caller's own `format` for the percent slot: their string wins, and a
 *  `%` is appended only when they did not already write one. */
export const wormCustomPct =
  (fmt: (n: number) => string) =>
  (fraction: number): string => {
    const s = fmt(fraction * 100);
    return s.endsWith("%") ? s : `${s}%`;
  };
const signed = (d: number, fmt: (n: number) => string): string =>
  `${d > 0 ? "+" : d < 0 ? "−" : ""}${fmt(Math.abs(d))}`;

export interface WinProbWormGeometry {
  /** Leading (>50) stretches — one <path> of accent strokes. */
  aboveD: string;
  /** Trailing (<50) stretches — one <path> of neutral strokes. */
  belowD: string;
  /** y of the 50% midline (= height/2 on the default frame + symmetric pad). */
  midY: number;
  /** Interpolated 50% crossings — the lead changes. */
  crossings: { x: number; y: number }[];
  /** Endpoint ("now") marker + its clamped value, or null when no finite point. */
  end: { x: number; y: number; value: number } | null;
  /** Largest |Δ| between consecutive finite points (the momentum swing). */
  swing: { i: number; x: number; yFrom: number; yTo: number; delta: number } | null;
  /** Lead-change count (= crossings.length). */
  flips: number;
  /** Last finite value (clamped) + its index, for the summary/readout. */
  last: number | null;
  lastIndex: number;
  /** min/max of the clamped finite values (allEqual ⇒ min === max). */
  minV: number;
  maxV: number;
  n: number;
  width: number;
  height: number;
}

export function winProbWormGeometry(opts: {
  width: number;
  height: number;
  data: readonly (number | null)[];
  /** Right gutter reserved for the "last" label (shrinks the plot). */
  gutterRight?: number | undefined;
  /** Probability extent. Default [0, 100]. */
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
}): WinProbWormGeometry | null {
  const { width, height, data } = opts;
  const n = data.length;
  const pad = opts.pad ?? PAD;
  const gutterRight = opts.gutterRight ?? 0;
  const plotH = height - 2 * pad;
  const plotW = Math.max(0, width - 2 * pad - gutterRight);
  const lastX = Math.max(1, n - 1);
  const sx = (i: number): number => pad + (i / lastX) * plotW;
  // Probabilities are clamped to 0–100 and the default frame is that range, so
  // the fraction only leaves [0,1] on a caller's narrowed `domain` — where the
  // mark belongs on the edge it ran off, never past it (the midline included).
  const [d0, d1] = opts.domain?.every(Number.isFinite) ? opts.domain : FRAME;
  const span = d1 - d0 || 1;
  const sy = (v: number): number => height - pad - clamp((v - d0) / span, 0, 1) * plotH;
  const midY = round2(sy(50));

  // pass 1 — min/max, last finite, endpoint marker
  let minV = Infinity;
  let maxV = -Infinity;
  let last: number | null = null;
  let lastIndex = -1;
  let end: WinProbWormGeometry["end"] = null;
  for (let i = 0; i < n; i++) {
    const raw = data[i];
    if (!isFiniteValue(raw)) continue;
    const v = clamp(raw, 0, 100);
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
    last = v;
    lastIndex = i;
    end = { x: round2(sx(i)), y: round2(sy(v)), value: v };
  }
  if (last === null) return null;

  // pass 2 — walk consecutive finite pairs → split at 50, collect crossings + swing.
  // D[0] = leading (>50) strokes, D[1] = trailing (<50); pen[k] tracks whether that
  // side's sub-path is open, so a switch of sides starts a fresh M.
  const D = ["", ""];
  const pen = [false, false];
  const seg = (x0: number, y0: number, x1: number, y1: number, above: boolean): void => {
    const k = above ? 0 : 1;
    D[k] += pen[k]
      ? ` L${round2(x1)} ${round2(y1)}`
      : `M${round2(x0)} ${round2(y0)} L${round2(x1)} ${round2(y1)}`;
    pen[k] = true;
    pen[1 - k] = false;
  };

  const crossings: { x: number; y: number }[] = [];
  let swing: WinProbWormGeometry["swing"] = null;
  for (let i = 0; i < n - 1; i++) {
    const a = data[i];
    if (!isFiniteValue(a)) {
      pen[0] = false;
      pen[1] = false;
      continue;
    }
    const b = data[i + 1];
    if (!isFiniteValue(b)) continue; // gap; pens reset when i reaches b's slot

    const va = clamp(a, 0, 100);
    const vb = clamp(b, 0, 100);
    const x0 = sx(i);
    const x1 = sx(i + 1);
    const y0 = sy(va);
    const y1 = sy(vb);
    const sa = va - 50;
    const sb = vb - 50;

    // momentum swing = the largest |Δ| step (first one wins ties)
    const d = vb - va;
    if (swing === null || Math.abs(d) > Math.abs(swing.delta)) {
      swing = { i: i + 1, x: round2(x1), yFrom: round2(y0), yTo: round2(y1), delta: round2(d) };
    }

    if (sa > 0 !== sb > 0 && sa !== 0 && sb !== 0) {
      // strict crossing — interpolate the 50% point
      const t = sa / (sa - sb);
      const xc = x0 + t * (x1 - x0);
      const yc = sy(50);
      seg(x0, y0, xc, yc, sa > 0);
      seg(xc, yc, x1, y1, sb > 0);
      crossings.push({ x: round2(xc), y: round2(yc) });
    } else {
      // single-side piece; a touch of exactly 50 is not a crossing
      const above = sa > 0 || sb > 0 || (sa === 0 && sb === 0);
      seg(x0, y0, x1, y1, above);
    }
  }

  return {
    aboveD: D[0]!,
    belowD: D[1]!,
    midY,
    crossings,
    end,
    swing,
    flips: crossings.length,
    last,
    lastIndex,
    minV: minV === Infinity ? 0 : round2(minV),
    maxV: maxV === -Infinity ? 0 : round2(maxV),
    n,
    width,
    height,
  };
}

/** Reserve a right gutter for the endpoint "last" label (shared with the client). */
export function wormGutter(text: string, font: number): number {
  return textGutter(text.length, font, 5);
}

/**
 * Two-pass geometry resolve shared by both entries: probe once to learn the
 * "last" label text, reserve its gutter, then re-measure so the plot + endpoint
 * sit correctly. Pure, so the static
 * and interactive entries compute identical numbers and cannot drift.
 */
export function resolveWormGeo(opts: {
  width: number;
  height: number;
  data: readonly (number | null)[];
  domain?: readonly [number, number] | undefined;
  label: "last" | "none";
  font: number;
  /** Percent formatter (FRACTION in) for the endpoint probability label. */
  pctFmt: (fraction: number) => string;
}): { geo: WinProbWormGeometry | null; gutter: number; lastText: string } {
  const { width, height, data, domain, label, font, pctFmt } = opts;
  const probe = winProbWormGeometry({ width, height, data, domain });
  const showLast = label === "last" && probe != null && probe.end != null && height >= font + 0.8;
  const lastText = showLast ? wormPct(leaderProb(probe!.last as number), pctFmt) : "";
  const gutter = showLast ? wormGutter(lastText, font) : 0;
  const geo =
    gutter > 0 ? winProbWormGeometry({ width, height, data, domain, gutterRight: gutter }) : probe;
  return { geo, gutter, lastText };
}

/**
 * Placement + seat-gate for the momentum-swing delta label. The label is
 * clamped fully inside the viewBox using the 0.62·fontSize/char estimate, then
 * SUPPRESSED (returns null) when it has no vertical room, would spill the frame
 * horizontally, or its estimated box would collide with any crossing / endpoint
 * dot — so the swing marker never lands on a mark or escapes (craft gate).
 */
export function swingMark(
  geo: WinProbWormGeometry,
  markSwing: boolean,
  font: number,
  fmt: (n: number) => string,
): { text: string; x: number; labelY: number; connectorY: number; yTo: number } | null {
  const s = geo.swing;
  const { width, height, midY } = geo;
  if (!markSwing || !s || s.delta === 0 || height < 22) return null;

  const text = signed(s.delta, fmt);
  const hw = (text.length * font * 0.62) / 2; // 0.62·fontSize/char, per the craft audit
  const x = s.x;
  if (x - hw < 0 || x + hw > width) return null; // would spill the frame horizontally

  // point below mid → label rides the top, else it hugs the bottom; the baseline
  // is set so the estimated text box (ascent .78, descent .22) stays fully inside
  const low = s.yTo > midY;
  const labelY = round2(low ? font * 0.78 : height - font * 0.22);
  const y0 = labelY - font * 0.78;
  const y1 = labelY + font * 0.22;

  // suppress if the clamped box would still collide with a dot (crossings r 1.8,
  // endpoint r 2.2), matching the craft audit's 1.0-tolerance box test
  const hits = (cx: number, cy: number, r: number): boolean =>
    Math.min(x + hw, cx + r) - Math.max(x - hw, cx - r) > 1 &&
    Math.min(y1, cy + r) - Math.max(y0, cy - r) > 1;
  if (geo.end && hits(geo.end.x, geo.end.y, 2.2)) return null;
  for (const c of geo.crossings) if (hits(c.x, c.y, 1.8)) return null;

  return { text, x, labelY, connectorY: round2(low ? y1 + 1 : y0 - 1), yTo: s.yTo };
}

export function winProbWormSummary(
  geo: WinProbWormGeometry,
  fmt: (v: number) => string,
  strings: WinProbWormStrings,
  sides: readonly [string, string],
  /** Percent formatter (FRACTION in) for the probabilities. */
  pctFmt: (fraction: number) => string = (f) => wormCustomPct(fmt)(f),
): string {
  const last = geo.last as number;
  const prob = wormPct(leaderProb(last), pctFmt);
  if (geo.minV === geo.maxV) {
    return last === 50
      ? strings.winProbWormTied(prob)
      : strings.winProbWormFlat(leaderSide(last, sides), prob);
  }
  const swingAt = geo.swing ? geo.swing.i : geo.lastIndex;
  const swingDelta = signed(geo.swing ? geo.swing.delta : 0, fmt);
  return strings.winProbWorm(leaderSide(last, sides), prob, geo.flips, swingAt, swingDelta);
}
