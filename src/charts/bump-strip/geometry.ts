// BumpStrip geometry — pure, React-free. Rank bands,
// #1 at the TOP (inverted y, stated in docs and self-keyed by "#" end labels).
// Step line only — a rank cannot be 2.4, and skipped periods stay gaps, never
// diagonal interpolation. 2-dp.
import { round2, type Value } from "../../core/types.js";
import { textGutter } from "../../core/labels.js";

interface BumpPoint {
  x: number;
  y: number;
  rank: number;
  index: number;
}

export interface BumpGeometry {
  /** Step-line path through the rank bands ("" when nothing plottable). */
  d: string;
  points: BumpPoint[];
  /** Rank-change moments (the dots). */
  changes: { x: number; y: number }[];
  firstLabel: { x: number; y: number; rank: number } | null;
  lastLabel: { x: number; y: number; rank: number } | null;
  /** Slot pitch for interactive lookup. */
  pitch: number;
}

export function bumpGeometry(opts: {
  width: number;
  height: number;
  ranks: readonly Value[];
  maxRank?: number | undefined;
  /** Left/right label gutters in ch (asymmetric: `label="last"` only pays right). */
  gutterLeftCh: number;
  gutterRightCh: number;
  fontSize: number;
}): BumpGeometry {
  const { width, height, ranks, gutterLeftCh, gutterRightCh, fontSize } = opts;
  const n = ranks.length;
  const gutterL = gutterLeftCh > 0 ? textGutter(gutterLeftCh, fontSize, 5) : 0;
  const gutterR = gutterRightCh > 0 ? textGutter(gutterRightCh, fontSize, 5) : 0;
  const x0 = gutterL + 1.5;
  const x1 = width - gutterR - 1.5;

  // ranks are 1-based integers; round non-integers (component dev-warns)
  const clean = ranks.map((r) =>
    typeof r === "number" && Number.isFinite(r) && r >= 1 ? Math.round(r) : null,
  );
  const dataMax = Math.max(1, ...clean.filter((r): r is number => r !== null));
  const maxRank = Math.max(opts.maxRank ?? dataMax, 1);

  const bandY = (rank: number): number => {
    const clamped = Math.min(rank, maxRank);
    // band centers: rank 1 at top
    return round2(1.5 + ((clamped - 1) / Math.max(1, maxRank - 1)) * (height - 3));
  };
  const pitch = n > 1 ? (x1 - x0) / (n - 1) : 0;

  const points: BumpPoint[] = [];
  clean.forEach((r, index) => {
    if (r === null) return;
    points.push({
      x: round2(n > 1 ? x0 + index * pitch : (x0 + x1) / 2),
      y: bandY(r),
      rank: r,
      index,
    });
  });

  // step path with gaps: horizontal to the next slot's x, then vertical
  let d = "";
  const changes: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    const prev = i > 0 ? points[i - 1]! : null;
    const contiguous = prev !== null && p.index === prev.index + 1;
    if (!contiguous) {
      d += `M${p.x} ${p.y}`;
    } else {
      d += `H${p.x}`;
      if (prev.rank !== p.rank) {
        d += `V${p.y}`;
        changes.push({ x: p.x, y: p.y });
      }
    }
  }
  // extend the final step to its slot (pure horizontal continuation)
  const last = points.at(-1);
  if (last && points.length > 1) d += `H${last.x}`;

  const first = points[0] ?? null;
  return {
    d,
    points,
    changes,
    firstLabel: first ? { x: round2(Math.max(0, x0 - 5)), y: first.y, rank: first.rank } : null,
    lastLabel: last ? { x: round2(Math.min(width, x1 + 5)), y: last.y, rank: last.rank } : null,
    pitch,
  };
}
