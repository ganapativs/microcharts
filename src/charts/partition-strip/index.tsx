// <PartitionStrip> — what the whole is made of, and what the big parts are made
// of, with parentage visible. Static, hook-free,
// RSC-safe. Two aligned rows beat a treemap because alignment is the comparison
// channel. Two levels max — grandchildren are ignored with a dev warning.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont } from "../../core/labels.js";
import { devWarn } from "../../core/dev.js";
import { EN_PARTITION, type PartitionStrings } from "../../core/strings-partition.js";
import { partitionStripGeometry, parentValue, type PartitionNode } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export type PartitionStripDatum = PartitionNode;

export interface PartitionStripProps {
  data: readonly PartitionStripDatum[];
  /** Accents one node and its lineage (parent + siblings muted). */
  emphasis?: string | undefined;
  /** Parent-row labels with size drop-out. */
  labels?: boolean | undefined;
  /** Per-group colours, cycled; overrides `--mc-cat-N` for this instance. The
   *  emphasised node and muted siblings keep their accent/neutral roles. */
  colors?: readonly string[] | undefined;
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

const CAT_N = 6; // --mc-cat-1 … --mc-cat-6 via data-mc-cat roles

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
    colors,
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
  const accName = resolveSummary(summary, () => partitionStripSummary(data, strings));

  const emphGroup = emphasis ? geo.segments.find((s) => s.label === emphasis)?.group : undefined;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Both rows always tile the full inset frame — row height is layout, not
      // data — so the block has no floor and its extent never moves with the
      // values. It centres on the cap band.
      seat={{ mode: "center", top: inset, bottom: height - inset }}
      className={className ? `mc-partition ${className}` : "mc-partition"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {geo.segments.flatMap((seg) => {
        const y = seg.row === 0 ? inset : inset + rowH + 1;
        // fills via ink/cat roles + .mc-partition rules in styles.css — flat
        // siblings, minimal attributes: the segment list is this chart's SSR
        // hot path (bench floor 20 charts/ms). fontSize stays an attribute
        // (the craft gate + containment estimates read it).
        let ink: Record<string, string | number | undefined>;
        let opacity: number | undefined;
        if (emphasis) {
          if (seg.label === emphasis) {
            ink = { "data-mc-ink": "accent" };
            opacity = undefined;
          } else if (seg.group === emphGroup) {
            ink = { "data-mc-cat": (seg.group % CAT_N) + 1 };
            opacity = seg.row === 0 ? 0.85 : 0.55;
          } else {
            ink = { "data-mc-ink": "neutral" };
            opacity = 0.55;
          }
        } else {
          ink = { "data-mc-cat": (seg.group % CAT_N) + 1 };
          opacity = seg.row === 0 ? 0.9 : 0.55;
        }
        const catFill =
          colors && ink["data-mc-cat"] !== undefined
            ? colors[seg.group % colors.length]
            : undefined;
        // seat gate: wide enough for the text AND a parent row tall enough to
        // hold the floor font without bleeding — else labels drop out cleanly
        const fits =
          labels &&
          seg.row === 0 &&
          rowH >= fontSize + 0.8 &&
          seg.width >= seg.label.length * fontSize * 0.6 + 2;
        const key = `${seg.row}-${seg.label}-${seg.x}`;
        const nodes = [
          <rect
            key={key}
            x={seg.x}
            y={y}
            width={seg.width}
            height={rowH}
            fillOpacity={opacity}
            {...ink}
            style={catFill ? { fill: catFill } : undefined}
          />,
        ];
        if (fits)
          nodes.push(
            <text
              key={`t-${key}`}
              x={round2(seg.x + seg.width / 2)}
              y={round2(y + rowH / 2)}
              dominantBaseline="central"
              textAnchor="middle"
              fontSize={fontSize}
            >
              {seg.label}
            </text>,
          );
        return nodes;
      })}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
