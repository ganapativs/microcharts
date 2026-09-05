// PartitionStrip: Two
// rows: parents on top (width = share of whole). children aligned exactly under
// their parents below. TWO LEVELS MAX — deeper hierarchies become unreadable
// texture, which is why treemaps fail the admission bar. Alignment is the
// comparison channel (children tile their parent's x-range to the 2-dp grid).
import { round2 } from "../../core/types.js";

/** Vertical inset of the strip. Exported so the component seats on the same
 *  number the geometry lays out with, instead of its own copy of it. */
export const PARTITION_INSET = 0.5;

export interface PartitionNode {
  label: string;
  value?: number | undefined;
  children?: readonly { label: string; value: number }[] | undefined;
}

export interface PartitionSegment {
  label: string;
  row: 0 | 1;
  x: number;
  width: number;
  /** Share of the whole (2-dp). */
  share: number;
  /** The node's own magnitude — a parent's value (or its children's sum), a
   *  child's value. Shares are derived from it and can't be inverted back to it
   *  without the total, so the readout needs it carried through. */
  value: number;
  /** For a child: its share of its parent; null for parents. */
  parentShare: number | null;
  parent: string | null;
  /** Category index for coloring (parent index; children inherit it). */
  group: number;
}

/** The strip paints at most this many segments (parents + children, in layout
 *  order). Exported because the accessible name has to stop at the same place —
 *  it used to describe the whole tree and name a "largest" that was dropped. */
export const SEGMENT_CAP = 24;

/**
 * The box `<Chart>` will actually paint: it clamps a non-finite or non-positive
 * viewBox side to 1. Both entries have to resolve `width`/`height` the same way
 * or they lay the strip out against a box nobody drew — `width={NaN}` (a size
 * read off an unmounted element) put `width="NaN"` on every segment rect and
 * `--mc-seat: NaN` on the root, under a clean viewBox and a correct summary.
 */
export function partitionBox(width: number, height: number): readonly [number, number] {
  return [
    Number.isFinite(width) && width > 0 ? width : 1,
    Number.isFinite(height) && height > 0 ? height : 1,
  ];
}

/** Parent value = own value or the sum of its children (children win on mismatch). */
export function parentValue(p: PartitionNode): number {
  if (p.children && p.children.length > 0) {
    return p.children.reduce(
      (s, c) => s + (Number.isFinite(c.value) && c.value > 0 ? c.value : 0),
      0,
    );
  }
  return Number.isFinite(p.value) && (p.value ?? 0) > 0 ? (p.value as number) : 0;
}

export function partitionStripGeometry(opts: {
  data: readonly PartitionNode[];
  width: number;
  height: number;
  gap: number;
}): { segments: PartitionSegment[]; total: number; groups: number } {
  const [width] = partitionBox(opts.width, opts.height);
  const { data, gap } = opts;
  const inset = PARTITION_INSET;

  const parents = data.filter((p) => parentValue(p) > 0);
  const values = parents.map(parentValue);
  const total = values.reduce((a, b) => a + b, 0);
  const segments: PartitionSegment[] = [];
  if (total === 0) return { segments, total: 0, groups: 0 };

  const frame = width - inset * 2;
  // The gap is fixed per pair, so past ~`frame` groups the gaps alone outrun the
  // frame and every segment came out NEGATIVE — `width="-0.2"` is an SVG error,
  // so browsers drop the rect and the strip paints nothing at all. Thinning the
  // gap keeps at least half the frame for the marks, which degrades to a dense
  // strip instead of a blank one. Normal group counts never reach the clamp.
  const g = Math.min(gap, frame / Math.max(1, parents.length - 1) / 2);
  const usableW = frame - g * Math.max(0, parents.length - 1);
  let x = inset;
  let segCount = 0;
  parents.forEach((p, gi) => {
    const pv = values[gi]!;
    const share = pv / total;
    const w = round2(share * usableW);
    if (segCount < SEGMENT_CAP) {
      segments.push({
        label: p.label,
        row: 0,
        x: round2(x),
        width: w,
        share: round2(share),
        value: pv,
        parentShare: null,
        parent: null,
        group: gi,
      });
      segCount++;
    }

    // children tile the parent's x-range by their own share of the parent
    if (p.children && p.children.length > 0) {
      const kids = p.children.filter((c) => Number.isFinite(c.value) && c.value > 0);
      const childGap = Math.min(0.5, w / Math.max(1, kids.length) / 4);
      const childUsable = w - childGap * Math.max(0, kids.length - 1);
      let cx = x;
      for (const c of kids) {
        if (segCount >= SEGMENT_CAP) break;
        const cShare = c.value / pv;
        const cw = round2(cShare * childUsable);
        segments.push({
          label: c.label,
          row: 1,
          x: round2(cx),
          width: cw,
          share: round2(c.value / total),
          value: c.value,
          parentShare: round2(cShare),
          parent: p.label,
          group: gi,
        });
        segCount++;
        cx += cShare * childUsable + childGap;
      }
    }

    x += share * usableW + g;
  });

  return { segments, total: round2(total), groups: parents.length };
}
