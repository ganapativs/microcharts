// PartitionStrip geometry — pure, React-free. Two
// rows: parents on top (width = share of whole), children aligned exactly under
// their parents below. TWO LEVELS MAX — deeper hierarchies become unreadable
// texture, which is why treemaps fail the admission bar. Alignment is the
// comparison channel (children tile their parent's x-range to the 2-dp grid).
import { round2 } from "../../core/types.js";

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
  /** For a child: its share of its parent; null for parents. */
  parentShare: number | null;
  parent: string | null;
  /** Category index for coloring (parent index; children inherit it). */
  group: number;
}

const SEGMENT_CAP = 24;

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
  const { data, width, gap } = opts;
  const inset = 0.5;

  const parents = data.filter((p) => parentValue(p) > 0);
  const values = parents.map(parentValue);
  const total = values.reduce((a, b) => a + b, 0);
  const segments: PartitionSegment[] = [];
  if (total === 0) return { segments, total: 0, groups: 0 };

  const usableW = width - inset * 2 - gap * Math.max(0, parents.length - 1);
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
          parentShare: round2(cShare),
          parent: p.label,
          group: gi,
        });
        segCount++;
        cx += cShare * childUsable + childGap;
      }
    }

    x += share * usableW + gap;
  });

  return { segments, total: round2(total), groups: parents.length };
}
