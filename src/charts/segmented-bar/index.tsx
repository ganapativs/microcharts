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
import { chartSide, isFiniteValue, round2 } from "../../core/types.js";
import {
  SEGBAR_INSET,
  largestRemainderPercents,
  MAX_SEGMENTS,
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
  // Percents come off the ROLLED VALUES, which is exactly what the painted
  // labels read. Dividing by the total first is the same arithmetic in theory
  // and a different float in practice, and the two surfaces have to agree to
  // the point.
  const pcts = largestRemainderPercents(rolled.map((d) => d.value));
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

const CAT_N = 5; // --mc-cat-1 … --mc-cat-5 via data-mc-cat roles
const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 10;

export function SegmentedBar(props: SegmentedBarProps): ReactNode {
  const {
    data,
    maxSegments = MAX_SEGMENTS,
    order = "data",
    label = "percent",
    colors,
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    format,
    locale,
    strings = EN_COMPOSITION,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // `Chart` clamps the frame, but the segments were laid out against the RAW
  // prop: a host-computed width (`Number("")` → NaN, a collapsed flex box → 0)
  // emitted `width="NaN"` rects inside a valid viewBox, and a NaN height went
  // on to poison `--mc-seat` and drag the inline baseline with it.
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

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
  const fontSize = label === "none" ? 0 : labelFont(height, 0.6, labelSize);
  const geo = segmentedBarGeometry({
    width,
    height,
    values: rolled.map((d) => d.value),
    fontSize,
  });
  const fmt = label === "none" ? null : makeFormatter(format, locale);
  // Indexed by ROLLED position, from the same values `sharesSummary` reads.
  // Deriving these from the geometry's 2-dp-rounded shares instead moved about
  // one composition in five by a point: the segment painted "55%" while the
  // accessible name announced 54%.
  const pcts = label === "percent" ? largestRemainderPercents(rolled.map((d) => d.value)) : null;
  // Shares take `locale` but never the value `format` (which carries the units).
  const pctFmt = makePercentFormatter(locale);
  const accName = resolveSummary(summary, () => sharesSummary(rolled, strings, pctFmt));

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle =
    fontSize > 0 ? ({ ...style, "--mc-label-px": `${fontSize}px` } as CSSProperties) : style;

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
      seat={{ mode: "center", top: SEGBAR_INSET, bottom: height - SEGBAR_INSET }}
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
            ? pctFmt((pcts![seg.index] ?? 0) / 100)
            : label === "value"
              ? fmt!(d.value)
              : undefined;
        return (
          <g key={seg.index}>
            <rect
              x={seg.x}
              y={SEGBAR_INSET}
              width={seg.w}
              height={height - SEGBAR_INSET * 2}
              shapeRendering="crispEdges"
              data-mc-ink={isOther ? "neutral" : undefined}
              data-mc-cat={isOther ? undefined : (i % CAT_N) + 1}
              style={colors && !isOther ? { fill: colors[i % colors.length] } : undefined}
            />
            {text !== undefined && seg.labelFits(text.length) ? (
              <text
                x={round2(seg.x + seg.w / 2)}
                y={height / 2}
                dominantBaseline="central"
                fontSize={fontSize}
                textAnchor="middle"
                // No inline fill: the ink belongs to the fill this label sits
                // ON, and `styles.css` picks it per cat (`rect[data-mc-cat=N] +
                // text`). This used to knock out with `--mc-surface` — the page
                // colour — which is 2.5:1 on cat-1 gold, the first and usually
                // widest segment, i.e. the one most likely to carry a label.
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
