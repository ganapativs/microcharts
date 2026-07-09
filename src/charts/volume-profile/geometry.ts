// VolumeProfile geometry — pure, React-free (plan/25 §16, plan/17 F15). A
// histogram turned PERPENDICULAR to the usual trend axis: y = level (binned),
// bars extend horizontally by activity mass at that level. The modal bin (POC)
// is accented and the value area (smallest contiguous span holding `valueArea`
// of mass around the POC) is shaded. 2-dp.
import { uniformBins } from "../../core/bin.js";
import { isFiniteValue, round2 } from "../../core/types.js";

export interface LevelRow {
  level: number;
  weight: number;
}

export interface ProfileBar {
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  poc: boolean;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isRaw(data: readonly (LevelRow | number)[]): data is readonly number[] {
  return data.length > 0 && typeof data[0] === "number";
}

/** Aggregate weight per uniform level bin (raw levels → counts). Robust to null
 *  entries in either shape. */
export function binMass(
  data: readonly (LevelRow | number | null)[],
  bins: number,
): { level: number; mass: number }[] {
  const weighted = data.some((d) => d != null && typeof d === "object");
  const levels = weighted
    ? data.map((d) => (d && typeof d === "object" && isFiniteValue(d.level) ? d.level : NaN))
    : data.map((v) => (typeof v === "number" ? v : NaN));
  const ub = uniformBins(levels, { bins });
  if (!ub) return [];
  const mass = Array.from({ length: ub.bins.length }, () => 0);
  if (weighted) {
    for (const d of data) {
      if (!d || typeof d !== "object" || !isFiniteValue(d.weight) || d.weight <= 0) continue;
      const i = ub.binOf(d.level);
      if (i >= 0) mass[i]! += d.weight;
    }
  } else {
    for (const v of data) {
      if (typeof v !== "number") continue;
      const i = ub.binOf(v);
      if (i >= 0) mass[i]! += 1;
    }
  }
  return ub.bins.map((b, i) => ({ level: (b.x0 + b.x1) / 2, mass: mass[i]! }));
}

export function volumeProfileGeometry(opts: {
  data: readonly (LevelRow | number)[];
  bins: number;
  valueArea: number;
  side: "left" | "right";
  width: number;
  height: number;
  gutter: number;
}): {
  bars: ProfileBar[];
  valueAreaRect: Rect | null;
  poc: { level: number; share: number } | null;
  even: boolean;
  vaLo: number;
  vaHi: number;
} {
  const { data, bins, valueArea, side, width, height, gutter } = opts;
  const rows = binMass(data, bins);
  const n = rows.length;
  const total = rows.reduce((s, r) => s + r.mass, 0);
  if (n === 0 || total === 0) {
    return { bars: [], valueAreaRect: null, poc: null, even: false, vaLo: 0, vaHi: 0 };
  }

  const pad = 1;
  const plotW = width - gutter - pad;
  const rowH = (height - pad * 2) / n;
  const maxMass = rows.reduce((m, r) => Math.max(m, r.mass), 0) || 1;

  // POC = modal bin (lowest level wins ties, deterministic)
  let pocIdx = 0;
  for (let i = 0; i < n; i++) if (rows[i]!.mass > rows[pocIdx]!.mass) pocIdx = i;

  // even distribution check: all bins within 15% of the mean
  const mean = total / n;
  const even = rows.every((r) => Math.abs(r.mass - mean) <= mean * 0.15);

  // value area: grow outward from the POC until `valueArea` of mass is covered
  let loI = pocIdx;
  let hiI = pocIdx;
  let covered = rows[pocIdx]!.mass;
  while (covered < valueArea * total && (loI > 0 || hiI < n - 1)) {
    const nextLo = loI > 0 ? rows[loI - 1]!.mass : -1;
    const nextHi = hiI < n - 1 ? rows[hiI + 1]!.mass : -1;
    if (nextHi >= nextLo) {
      hiI++;
      covered += rows[hiI]!.mass;
    } else {
      loI--;
      covered += rows[loI]!.mass;
    }
  }

  // bin i at y (bottom-up: lowest level at the bottom)
  const yOf = (i: number): number => round2(pad + (n - 1 - i) * rowH);
  const barLen = (mass: number): number => round2((mass / maxMass) * plotW);
  const anchorLeft = side === "left";

  const bars: ProfileBar[] = rows.map((r, i) => {
    const len = barLen(r.mass);
    const x = anchorLeft ? pad : round2(width - pad - len);
    return {
      x,
      y: yOf(i),
      width: len,
      height: round2(Math.max(0.6, rowH - 0.4)),
      level: r.level,
      poc: i === pocIdx,
    };
  });

  const valueAreaRect: Rect = {
    x: pad,
    y: yOf(hiI),
    width: round2(width - pad * 2),
    height: round2((hiI - loI + 1) * rowH),
  };

  return {
    bars,
    valueAreaRect,
    poc: { level: round2(rows[pocIdx]!.level), share: round2(rows[pocIdx]!.mass / total) },
    even,
    vaLo: round2(rows[loI]!.level),
    vaHi: round2(rows[hiI]!.level),
  };
}
