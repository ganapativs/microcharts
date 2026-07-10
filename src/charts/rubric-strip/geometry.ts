// RubricStrip geometry — pure, React-free (plan/25 §6, plan/17 F13). Stacked
// horizontal mini-bars: bar THICKNESS = weight share of the height, bar LENGTH =
// score on a shared domain (zero-anchored). No composite/total bar exists and
// none may be added — the type structurally resists collapsing quality into one
// number. Thickness maps to weight share linearly (2-unit floor). 2-dp.
import { normalizeShares } from "../../core/stack.js";
import { clamp } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

export interface RubricInput {
  label: string;
  score: number;
  weight: number;
}

export interface RubricRow {
  label: string;
  y: number;
  height: number;
  barWidth: number;
  trackWidth: number;
  score: number;
  weightShare: number;
}

const MIN_THICK = 2;

export function rubricStripGeometry(opts: {
  data: readonly RubricInput[];
  domain: readonly [number, number];
  width: number;
  height: number;
  gutter: number;
  gap: number;
}): { rows: RubricRow[]; targetX: (target: number) => number } {
  const { data, domain, width, height, gutter, gap } = opts;
  const [d0, d1] = domain;
  const span = d1 - d0 || 1;
  const trackW = round2(Math.max(1, width - gutter));
  const scoreX = (s: number): number =>
    Number.isFinite(s) ? round2(((clamp(s, d0, d1) - d0) / span) * trackW) : 0;

  const n = data.length;
  const shares = normalizeShares(data.map((d) => d.weight));
  const equal = data.map(() => 1 / Math.max(1, n));
  const weightShares = shares ? shares.shares : equal;

  const inset = 0.5;
  const usableH = height - inset * 2 - gap * Math.max(0, n - 1);
  // Reserve the min thickness for every row first, then distribute the rest by
  // weight share — so a thin row stays visible AND the rows never overflow.
  const base =
    n > 0 && MIN_THICK * n <= usableH ? MIN_THICK : Math.max(0, usableH / Math.max(1, n));
  const remaining = Math.max(0, usableH - base * n);
  const rows: RubricRow[] = [];
  let y = inset;
  data.forEach((d, i) => {
    const share = weightShares[i] ?? equal[i]!;
    const h = round2(base + share * remaining);
    rows.push({
      label: d.label,
      y: round2(y),
      height: h,
      barWidth: scoreX(d.score),
      trackWidth: trackW,
      score: d.score,
      weightShare: round2(share),
    });
    y += h + gap;
  });

  return { rows, targetX: (t: number) => round2(gutter + scoreX(t)) };
}
