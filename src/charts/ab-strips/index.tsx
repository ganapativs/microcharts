// <ABStrips> — did B beat A, by more than the overlap? Two graded
// quantile strips on ONE shared scale: p5–95 outer, p25–75 inner, a median dot,
// row A muted, row B accent. The visible overlap of the middle halves is the
// answer, and the overlap number is always in the summary. Never a bare mean
// bar.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, makePercentFormatter, withPlus, type Format } from "../../core/format.js";
import { round2 } from "../../core/types.js";
import { EN_AB, type ABStrings } from "../../core/strings-ab.js";
import { labelFont, labelFitsBand } from "../../core/labels.js";
import { abStripsGeometry, abTagsFit, type ABStripsGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

/** Signed percent (or absolute when the base is 0) delta of B vs A.
 *  `pct` takes a FRACTION and is the chart's percent formatter — a literal
 *  `${n}%` would leave the delta in en-US while `locale` localized every other
 *  number here. `withPlus` supplies the leading `+`, and skips it when the
 *  formatter already emitted a sign. */
export function abDelta(
  geo: ABStripsGeometry,
  fmt: (n: number) => string,
  pct: (fraction: number) => string = makePercentFormatter(undefined),
): string {
  if (geo.aMedian === 0) return withPlus(geo.deltaMedian, fmt);
  return withPlus(geo.deltaMedian / Math.abs(geo.aMedian), pct);
}

export function abSummary(
  geo: ABStripsGeometry,
  fmt: (n: number) => string,
  seriesLabels: readonly [string, string],
  strings: ABStrings,
  pct: (fraction: number) => string = makePercentFormatter(undefined),
): string {
  const base = strings.ab(
    seriesLabels[1],
    fmt(geo.bMedian),
    seriesLabels[0],
    fmt(geo.aMedian),
    abDelta(geo, fmt, pct),
    pct(geo.overlap),
  );
  if (geo.overlap >= 1) return base + strings.abNoDiff;
  if (geo.overlap <= 0) return base + strings.abSeparated;
  return base;
}

export interface ABStripsProps {
  /** The two arms. */
  data: { a: readonly number[]; b: readonly number[] };
  /** Row identities for gutter tags + summary (default ["A", "B"]). */
  seriesLabels?: readonly [string, string] | undefined;
  /** Which direction of the B−A delta reads as good (colors the delta label). */
  positive?: "up" | "down" | undefined;
  /** `"delta"` (default) states the signed median delta in a gutter. */
  label?: "delta" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: ABStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function ABStrips(props: ABStripsProps): ReactNode {
  const {
    data,
    seriesLabels = ["A", "B"] as const,
    positive,
    label = "delta",
    domain,
    width = 80,
    height = 20,
    color,
    format,
    locale,
    strings = EN_AB,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // two stacked rows share the height, so the A/B tags of adjacent rows must
  // not collide — the row centers are only height/2 apart, so keep the font
  // safely under that (real-browser getBBox verified at 80×20, not just craft)
  const FONT = labelFont(height, 0.3);
  const fmt = makeFormatter(format, locale);
  // The delta + overlap are shares of their own, so they take `locale` but never
  // the value `format` (which carries the metric's units).
  const pctFmt = makePercentFormatter(locale);
  const cls = className ? `mc-ab-strips ${className}` : "mc-ab-strips";
  // Row tags are seat-gated — they drop, and give their lead gutter back to the
  // strips, once the two rows are pitched closer than one em (see `abTagsFit`).
  const showTags = abTagsFit(height, FONT);
  const labelChars = showTags ? Math.max(seriesLabels[0].length, seriesLabels[1].length) : 0;

  const probe = abStripsGeometry({
    width,
    height,
    a: data.a,
    b: data.b,
    labelChars,
    domain,
    fontSize: FONT,
  });
  // the delta rides the box's own midline, so it needs one em of box height
  const showLabel = label === "delta" && probe != null && labelFitsBand(height, FONT);
  // Gutter off the FORMATTED string, not a digit count: a locale that writes
  // "+15 %" needs the extra character reserved or the label spills the viewBox.
  const labelText = showLabel ? abDelta(probe!, fmt, pctFmt) : "";
  const gutterCh = showLabel ? labelText.length : 0;

  const geo = abStripsGeometry({
    width,
    height,
    a: data.a,
    b: data.b,
    labelChars,
    domain,
    gutterCh,
    fontSize: FONT,
  });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        // Empty seats like the drawn pair: same centre, no rows to measure.
        seat={{ mode: "center", top: 0, bottom: height }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () => abSummary(geo, fmt, seriesLabels, strings, pctFmt));
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  // delta valence: which direction is good (sign is also in the text) — B always
  // uses accent ink (or `color` if set); A stays neutral, the baseline row
  const goodUp = positive !== "down";

  // the contested zone = the x-overlap of the two middle halves (p25–75)
  const [rA, rB] = geo.rows;
  const ovX0 = Math.max(rA.inner.x, rB.inner.x);
  const ovX1 = Math.min(rA.inner.x + rA.inner.width, rB.inner.x + rB.inner.width);
  const ovTop = Math.min(rA.y, rB.y) - 2.6;
  const ovBot = Math.max(rA.y, rB.y) + 2.6;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Two arms as stacked rows on one shared value axis — the lower row is
      // arm B, a category, never a zero — so the pair centres on the cap band.
      // The rows split the padded frame evenly, which puts the stack's centre
      // exactly at the frame's; the delta gutter only widens the viewBox.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={cls}
      style={rootStyle}
    >
      {/* Overlap of the two p25–75 bands (skipped when they separate). */}
      {ovX1 > ovX0 ? (
        <rect
          x={round2(ovX0)}
          y={round2(ovTop)}
          width={round2(ovX1 - ovX0)}
          height={round2(ovBot - ovTop)}
          rx={1}
          data-mc-ink="neutral"
          fillOpacity={0.14}
        />
      ) : null}
      {/* Outer p5–95 + inner p25–75. A = neutral; B = accent (or `color`). */}
      {geo.rows.map((r, i) => {
        const isB = i === 1;
        // Accent fill without accent ink-role — otherwise motion stages B late.
        const bandFill = isB ? (color ?? "var(--mc-accent)") : undefined;
        const bandInk = isB ? undefined : "neutral";
        return (
          <g key={`band-${seriesLabels[i]}`}>
            <rect
              x={r.outer.x}
              y={round2(r.y - 0.9)}
              width={r.outer.width}
              height={1.8}
              rx={0.9}
              data-mc-ink={bandInk}
              fill={bandFill}
              fillOpacity={i === 0 ? 0.26 : 0.2}
            />
            <rect
              x={r.inner.x}
              y={round2(r.y - 2)}
              width={r.inner.width}
              height={4}
              rx={1.5}
              data-mc-ink={bandInk}
              fill={bandFill}
              fillOpacity={i === 0 ? 0.42 : 0.38}
            />
          </g>
        );
      })}
      <line
        x1={geo.rows[0].median.x}
        y1={geo.rows[0].y}
        x2={geo.rows[1].median.x}
        y2={geo.rows[1].y}
        data-mc-ink="muted"
        strokeOpacity={0.6}
        data-mc-w="tick"
        strokeDasharray="1.6 1.4"
        vectorEffect="non-scaling-stroke"
      />
      {geo.rows.map((r, i) => {
        const isB = i === 1;
        const custom = isB && color ? color : undefined;
        const ink = custom ? undefined : isB ? "accent" : "neutral";
        return (
          <g key={`mark-${seriesLabels[i]}`}>
            <circle cx={r.median.x} cy={r.y} r={1.7} data-mc-ink={ink} fill={custom} />
            {showTags ? (
              <text
                x={round2(2)}
                y={r.y}
                textAnchor="start"
                dominantBaseline="central"
                data-mc-ink="label"
                fontSize={FONT}
              >
                {seriesLabels[i]}
              </text>
            ) : null}
          </g>
        );
      })}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={round2(height / 2)}
          textAnchor="start"
          dominantBaseline="central"
          fontSize={FONT}
          data-mc-ink={
            geo.deltaMedian === 0
              ? "neutral"
              : geo.deltaMedian > 0 === goodUp
                ? "positive"
                : "negative"
          }
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
