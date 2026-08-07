// <PartitionStrip> — what the whole is made of, and what the big parts are made
// of, with parentage visible.
// Two aligned rows beat a treemap because alignment is the comparison
// channel. Two levels max — grandchildren are ignored with a dev warning.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont, proseCharsThatFit } from "../../core/labels.js";
import { devWarn } from "../../core/dev.js";
import { makePercentFormatter, type Format } from "../../core/format.js";
import { EN_PARTITION, type PartitionStrings } from "../../core/strings-partition.js";
import {
  PARTITION_INSET,
  partitionBox,
  partitionStripGeometry,
  parentValue,
  type PartitionNode,
} from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";
import { round2 } from "../../core/types.js";

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
  /** Formats node values in the interactive readout + announcement (the static
   *  strip renders no numbers). Same grammar as every other chart. */
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: PartitionStrings | undefined;
  /** Minimum in-chart label size, in viewBox units. Geometry sizes labels from
   *  the mark and floors them at 7; this raises that floor and moves the
   *  reserved gutter with it. A label the box cannot seat at the raised floor
   *  drops rather than shrinking back under it. */
  labelSize?: number | undefined;
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
  /** Percent formatter (FRACTION in). The old `${Math.round(s * 100)}%` was an
   *  en-US percent, so `locale` reached the interactive chip's shares but not
   *  the accessible name's. */
  pctOf: (fraction: number) => string = makePercentFormatter(undefined),
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
    width: widthProp = 120,
    height: heightProp = 24,
    strings = EN_PARTITION,
    labelSize,
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

  const [width, height] = partitionBox(widthProp, heightProp);
  const geo = partitionStripGeometry({ data, width, height, gap: 1 });
  const fontSize = labelFont(height, 0.42, labelSize);
  const inset = PARTITION_INSET;
  const rowH = (height - inset * 2 - 1) / 2;
  // Shares take `locale` but never the value `format` (which carries units).
  const pctFmt = makePercentFormatter(props.locale);
  const accName = resolveSummary(summary, () => partitionStripSummary(data, strings, pctFmt));

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
      style={{ ...style, "--mc-label-px": `${fontSize}px` } as CSSProperties}
    >
      {geo.segments.flatMap((seg, i) => {
        const y = seg.row === 0 ? inset : inset + rowH + 1;
        // fills via ink/cat roles + .mc-partition rules in styles.css — flat
        // siblings, minimal attributes: the segment list is this chart's SSR
        // hot path (bench floor 20 charts/ms). fontSize stays an attribute
        // (the craft gate + containment estimates read it).
        let ink: Record<string, string | number | undefined>;
        let opacity: number | undefined;
        // A label on a muted segment steps back to the ordinary label ink
        // (TraceFold's `data-mc-dim`), because the knockout `--mc-on-cat` is
        // sized for a saturated category fill: on `--mc-neutral` at 0.55 the
        // dark ink reads 2.9:1 in dark mode, and under forced-colors a `Canvas`
        // knockout on `GrayText` disappears in both themes.
        let dim = false;
        if (emphasis) {
          if (seg.label === emphasis) {
            ink = { "data-mc-ink": "accent" };
            opacity = undefined;
          } else if (seg.group === emphGroup) {
            ink = { "data-mc-cat": (seg.group % CAT_N) + 1 };
            opacity = seg.row === 0 ? 1 : 0.55;
          } else {
            ink = { "data-mc-ink": "neutral" };
            opacity = 0.55;
            dim = true;
          }
        } else {
          ink = { "data-mc-cat": (seg.group % CAT_N) + 1 };
          opacity = seg.row === 0 ? 1 : 0.55;
        }
        const catFill =
          colors && ink["data-mc-cat"] !== undefined
            ? colors[seg.group % colors.length]
            : undefined;
        // seat gate: wide enough for the text AND a parent row tall enough to
        // hold the floor font without bleeding — else labels drop out cleanly.
        // The width test goes through `proseCharsThatFit`: these are
        // caller-supplied group names, not figures this library formatted, and
        // the digits rate this used to inline (0.6/char) seats a label the
        // browser paints at up to 0.95/char. Measured: "WWWW" in a 27-unit
        // leading segment painted 5.3 units past the viewBox, and `.mc-root` is
        // `overflow: visible`, so that is a spill into the page, not a clip.
        const fits =
          labels &&
          seg.row === 0 &&
          rowH >= fontSize + 0.8 &&
          seg.label.length <= proseCharsThatFit(seg.width, fontSize, 2);
        // Positional, not coordinate-derived: `seg.x` moves whenever any earlier
        // share changes, which minted a new key and remounted every segment on
        // an update — and a remounted node has no previous geometry to travel
        // from. The row and index together are stable for a partition laid out
        // in a fixed order.
        const key = `${seg.row}-${i}`;
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
              data-mc-dim={dim ? "" : undefined}
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
