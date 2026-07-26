// VolumeProfile: A
// histogram turned PERPENDICULAR to the usual trend axis: y = level (binned).
// bars extend horizontally by activity mass at that level. The modal bin (POC)
// is accented and the value area (smallest contiguous span holding `valueArea`
// of mass around the POC) is shaded. 2-dp.
//
// Split into `binProfile` (bin + POC + value-area walk — O(data.length). the
// expensive pass) and `layoutProfile` (bar positions — O(bins). cheap). The
// static component needs the POC level before it knows the label gutter width,
// so it binned once and re-laid-out for the gutter; binning twice was the
// bench-floor regression (superaudit). `volumeProfileGeometry` composes both
// for callers that only need one shot (tests, the interactive entry).
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

interface BinnedProfile {
  rows: { level: number; mass: number }[];
  total: number;
  pocIdx: number;
  even: boolean;
  loI: number;
  hiI: number;
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

/** Bin the raw data + locate the POC + walk the value area outward from it —
 *  the O(data.length) pass, independent of pixel geometry. */
function binProfile(
  data: readonly (LevelRow | number)[],
  bins: number,
  valueArea: number,
): BinnedProfile {
  const rows = binMass(data, bins);
  const n = rows.length;
  const total = rows.reduce((s, r) => s + r.mass, 0);
  if (n === 0 || total === 0) {
    return { rows: [], total: 0, pocIdx: -1, even: false, loI: 0, hiI: 0 };
  }

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

  return { rows, total, pocIdx, even, loI, hiI };
}

/** Lay out bars + the value-area band from an already-binned profile — the
 *  O(bins) pass, safe to re-run once the POC-label gutter is known. */
function layoutProfile(
  binned: BinnedProfile,
  opts: { align: "left" | "right"; width: number; height: number; gutter: number },
): {
  bars: ProfileBar[];
  valueAreaRect: Rect | null;
  poc: { level: number; share: number } | null;
  even: boolean;
  vaLo: number;
  vaHi: number;
} {
  const { rows, total, pocIdx, even, loI, hiI } = binned;
  const n = rows.length;
  if (n === 0 || total === 0 || pocIdx < 0) {
    return { bars: [], valueAreaRect: null, poc: null, even: false, vaLo: 0, vaHi: 0 };
  }

  const { align, width, height, gutter } = opts;
  const pad = 1;
  const plotW = width - gutter - pad;
  const rowH = (height - pad * 2) / n;
  const maxMass = rows.reduce((m, r) => Math.max(m, r.mass), 0) || 1;

  // bin i at y (bottom-up: lowest level at the bottom)
  const yOf = (i: number): number => round2(pad + (n - 1 - i) * rowH);
  const barLen = (mass: number): number => round2((mass / maxMass) * plotW);
  const anchorLeft = align === "left";

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

/**
 * The full layout both entries must run: bin once, lay out to learn the POC
 * level, reserve the gutter its label needs, lay out again. Skipping the second
 * pass leaves every bar width — and, at `align="right"`, every bar x — out of
 * step with what is painted.
 */
export function profileLayout(opts: {
  data: readonly (LevelRow | number)[];
  bins: number;
  valueArea: number;
  align: "left" | "right";
  width: number;
  height: number;
  label: "poc" | "none";
  fontSize: number;
  fmt: (n: number) => string;
}): ReturnType<typeof layoutProfile> & { pocText: string | undefined } {
  const { data, bins, valueArea, align, width, height, label, fontSize, fmt } = opts;
  const binned = binProfile(data, bins, valueArea);
  const pre = layoutProfile(binned, { align, width, height, gutter: 0 });
  const wanted = label === "poc" && pre.poc ? fmt(pre.poc.level) : undefined;
  // Degradation: the POC price is a long string (`142.33`) set beside the bar,
  // and the gutter it needs does not shrink with the box — on a narrow profile
  // it asks for MORE than the whole width, collapsing the bars to nothing and
  // still painting past the left edge. It DROPS once it would cost more than
  // half the box, and the gutter drops with it so the bars get the width back.
  // Pure arithmetic on the per-char estimate: never measured.
  const want = wanted ? wanted.length * fontSize * 0.6 + 2 : 0;
  const pocText = want > 0 && want <= width * 0.5 ? wanted : undefined;
  const gutter = pocText ? want : 0;
  return { ...layoutProfile(binned, { align, width, height, gutter }), pocText };
}

export function volumeProfileGeometry(opts: {
  data: readonly (LevelRow | number)[];
  bins: number;
  valueArea: number;
  align: "left" | "right";
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
  const binned = binProfile(opts.data, opts.bins, opts.valueArea);
  return layoutProfile(binned, {
    align: opts.align,
    width: opts.width,
    height: opts.height,
    gutter: opts.gutter,
  });
}
