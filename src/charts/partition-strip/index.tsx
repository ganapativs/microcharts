// <PartitionStrip> — what the whole is made of, and what the big parts are made
// of, with parentage visible (plan/25 §13, plan/17 F20). Static, hook-free,
// RSC-safe. Two aligned rows beat a treemap because alignment is the comparison
// channel. Two levels max — grandchildren are ignored with a dev warning.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont } from "../../core/labels.js";
import { ON_FILL_INK } from "../../core/color.js";
import { devWarn } from "../../core/dev.js";
import { EN_PARTITION, type PartitionStrings } from "../../core/strings-partition.js";
import { partitionStripGeometry, parentValue, type PartitionNode } from "./geometry.js";

export type PartitionStripDatum = PartitionNode;

export interface PartitionStripProps {
  data: readonly PartitionStripDatum[];
  /** Accents one node and its lineage (parent + siblings muted). */
  emphasis?: string | undefined;
  /** Parent-row labels with size drop-out. */
  labels?: boolean | undefined;
  width?: number | undefined;
  height?: number | undefined;
  strings?: PartitionStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const CAT = ["--mc-cat-1", "--mc-cat-2", "--mc-cat-3", "--mc-cat-4", "--mc-cat-5", "--mc-cat-6"];

/** Shared summary — group/part counts + the largest leaf and its parent. */
export function partitionStripSummary(
  data: readonly PartitionStripDatum[],
  strings: PartitionStrings,
): string {
  const parents = data.filter((p) => parentValue(p) > 0);
  if (parents.length === 0) return strings.noData;
  const total = parents.reduce((s, p) => s + parentValue(p), 0);
  let parts = 0;
  let bestChild: { label: string; parent: string; share: number } | null = null;
  let bestParent = { label: parents[0]!.label, share: parentValue(parents[0]!) / total };
  for (const p of parents) {
    const pv = parentValue(p);
    if (pv / total > bestParent.share) bestParent = { label: p.label, share: pv / total };
    const kids = (p.children ?? []).filter((c) => Number.isFinite(c.value) && c.value > 0);
    for (const c of kids) {
      parts++;
      const share = c.value / total;
      if (!bestChild || share > bestChild.share)
        bestChild = { label: c.label, parent: p.label, share };
    }
  }
  const pctOf = (s: number) => `${Math.round(s * 100)}%`;
  if (bestChild) {
    return strings.partition(
      parents.length,
      parts,
      bestChild.parent,
      bestChild.label,
      pctOf(bestChild.share),
    );
  }
  return strings.partitionFlat(parents.length, bestParent.label, pctOf(bestParent.share));
}

export function PartitionStrip(props: PartitionStripProps): ReactNode {
  const {
    data,
    emphasis,
    labels = true,
    width = 120,
    height = 24,
    strings = EN_PARTITION,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.some((p) => (p.children ?? []).some((c) => (c as { children?: unknown }).children)))
    devWarn(
      "<PartitionStrip> depth > 2 — grandchildren ignored (two levels max is the honesty feature).",
    );

  const geo = partitionStripGeometry({ data, width, height, gap: 1 });
  const fontSize = labelFont(height, 0.42);
  const inset = 0.5;
  const rowH = (height - inset * 2 - 1) / 2;
  const accName = summary === false ? false : (summary ?? partitionStripSummary(data, strings));

  const emphGroup = emphasis ? geo.segments.find((s) => s.label === emphasis)?.group : undefined;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-partition ${className}` : "mc-partition"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {geo.segments.map((seg) => {
        const y = seg.row === 0 ? inset : inset + rowH + 1;
        let fill: string;
        let opacity: number;
        if (emphasis) {
          if (seg.label === emphasis) {
            fill = "var(--mc-accent)";
            opacity = 1;
          } else if (seg.group === emphGroup) {
            fill = `var(${CAT[seg.group % CAT.length]})`;
            opacity = seg.row === 0 ? 0.85 : 0.55;
          } else {
            fill = "var(--mc-neutral)";
            opacity = 0.28;
          }
        } else {
          fill = `var(${CAT[seg.group % CAT.length]})`;
          opacity = seg.row === 0 ? 0.9 : 0.55;
        }
        const fits = labels && seg.row === 0 && seg.width >= seg.label.length * fontSize * 0.6 + 2;
        return (
          <g key={`${seg.row}-${seg.label}-${seg.x}`}>
            <rect
              x={seg.x}
              y={y}
              width={seg.width}
              height={rowH}
              rx={0.5}
              shapeRendering="crispEdges"
              data-mc-ink="band"
              style={{ fill, fillOpacity: opacity }}
            />
            {fits ? (
              <text
                x={round2(seg.x + seg.width / 2)}
                y={round2(y + rowH / 2)}
                dominantBaseline="central"
                textAnchor="middle"
                fontSize={fontSize}
                style={{ fill: ON_FILL_INK, fontWeight: 600 }}
              >
                {seg.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
