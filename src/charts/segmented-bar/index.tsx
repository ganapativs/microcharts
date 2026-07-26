// <SegmentedBar> — what is this made of, and in what proportions (S3).
// Segments always sum to the full bar; past
// `maxSegments` the tail rolls into a labeled "Other" — nothing is silently
// dropped. A flat bar beats a donut of the same data at every size we ship.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, makePercentFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { isFiniteValue } from "../../core/types.js";
import {
  largestRemainderPercents,
  rollup,
  segmentedBarGeometry,
  type RolledDatum,
} from "./geometry.js";
import type { MiniBarDatum } from "../mini-bar/index.js";
import { resolveSummary } from "../../core/summary.js";

export type SegmentedBarDatum = MiniBarDatum;

/** Shared composition summary — largest-remainder percents, joined clauses. */
export function sharesSummary(
  rolled: readonly RolledDatum[],
  strings: CompositionStrings,
  /** Percent formatter (FRACTION in) — the largest-remainder integers still sum
   *  to 100, they just stop being spelled out as an en-US percent. */
  pct: (fraction: number) => string = makePercentFormatter(undefined),
): string {
  if (rolled.length === 0) return strings.noData;
  const total = rolled.reduce((s, d) => s + d.value, 0);
  const pcts = largestRemainderPercents(rolled.map((d) => d.value / total));
  const list = rolled
    .map((d, i) => strings.shareClause(d.label, pct((pcts[i] ?? 0) / 100)))
    .join(", ");
  return strings.shares(list);
}

export interface SegmentedBarProps {
  data: readonly SegmentedBarDatum[];
  /** Rollup threshold (legibility-derived; the rollup keeps honesty). */
  maxSegments?: number | undefined;
  /** `"data"` preserves inherent sequences; `"desc"` ranks the composition. */
  order?: "data" | "desc" | undefined;
  /** `"percent"` (default) | `"value"` centered per segment (deterministic drop-out). */
  label?: "none" | "percent" | "value" | undefined;
  /** Per-segment colours, cycled; overrides `--mc-cat-N` for this instance. The
   *  rolled-up "Other" segment stays neutral. */
  colors?: readonly string[] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: CompositionStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const CAT_N = 5; // --mc-cat-1 … --mc-cat-5 via data-mc-cat roles

export function SegmentedBar(props: SegmentedBarProps): ReactNode {
  const {
    data,
    maxSegments = 5,
    order = "data",
    label = "percent",
    colors,
    width = 60,
    height = 10,
    format,
    locale,
    strings = EN_COMPOSITION,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.some((d) => isFiniteValue(d.value) && d.value < 0)) {
    devWarn(
      "<SegmentedBar> negative values excluded — a part-to-whole cannot contain negative parts (use Waterfall).",
    );
  }

  let rolled = rollup(data, maxSegments, strings.otherLabel);
  if (order === "desc") {
    rolled = [...rolled].sort((a, b) =>
      a.label === strings.otherLabel ? 1 : b.label === strings.otherLabel ? -1 : b.value - a.value,
    );
  }
  const fontSize = label === "none" ? 0 : labelFont(height, 0.6);
  const geo = segmentedBarGeometry({
    width,
    height,
    values: rolled.map((d) => d.value),
    fontSize,
  });
  const fmt = label === "none" ? null : makeFormatter(format, locale);
  const pcts =
    label === "percent" ? largestRemainderPercents(geo.segments.map((s) => s.share)) : null;
  // Shares take `locale` but never the value `format` (which carries the units).
  const pctFmt = makePercentFormatter(locale);
  const accName = resolveSummary(summary, () => sharesSummary(rolled, strings, pctFmt));

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle =
    fontSize > 0 ? ({ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties) : style;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // The bar is one fixed-length rule inset a unit at top and bottom: the
      // segments partition its length, never its height, so no edge is a data
      // floor. It centres on the cap band and reads as punctuation in the line.
      seat={{ mode: "center", top: 1, bottom: height - 1 }}
      className={className ? `mc-segbar ${className}` : "mc-segbar"}
      style={rootStyle}
    >
      {geo.segments.map((seg, i) => {
        const d = rolled[seg.index]!;
        const isOther = d.members > 1;
        // The in-segment label is the FORMATTED percent, and the fit test below
        // reads that string's own length — a locale that writes "62 %" needs the
        // extra character to count against the segment's width.
        const text =
          label === "percent"
            ? pctFmt((pcts![i] ?? 0) / 100)
            : label === "value"
              ? fmt!(d.value)
              : undefined;
        return (
          <g key={seg.index}>
            <rect
              x={seg.x}
              y={1}
              width={seg.w}
              height={height - 2}
              shapeRendering="crispEdges"
              data-mc-ink={isOther ? "neutral" : undefined}
              data-mc-cat={isOther ? undefined : (i % CAT_N) + 1}
              style={colors && !isOther ? { fill: colors[i % colors.length] } : undefined}
            />
            {text !== undefined && seg.labelFits(text.length) ? (
              <text
                x={round2Mid(seg.x, seg.w)}
                y={height / 2}
                dominantBaseline="central"
                fontSize={fontSize}
                textAnchor="middle"
                style={{ fill: "var(--mc-surface, Canvas)" }}
              >
                {text}
              </text>
            ) : null}
          </g>
        );
      })}
      {children}
    </Chart>
  );
}

function round2Mid(x: number, w: number): number {
  return Math.round((x + w / 2) * 100) / 100;
}
