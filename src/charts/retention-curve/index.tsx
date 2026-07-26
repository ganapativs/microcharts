// <RetentionCurve> — do they stay, and does the curve plateau?
// A step line on a domain LOCKED to [0,1] (the full range is the honest frame
// for a share). an optional dashed benchmark ghost behind, and a plateau marker
// that appears only when the documented criterion holds.
// Non-monotone bumps render as-is (never sorted/smoothed away).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { EN_RETENTION, type RetentionStrings } from "../../core/strings-retention.js";
import { retentionGeometry, type RetentionCurveType, type RetentionGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export function retentionSummary(
  geo: RetentionGeometry,
  fmt: (n: number) => string,
  unit: string,
  n: number,
  strings: RetentionStrings,
): string {
  const last = fmt(geo.last.value);
  return geo.plateau
    ? strings.retention(last, n, unit, geo.plateau.from)
    : strings.retentionNoPlateau(last, n, unit);
}

export interface RetentionCurveProps {
  /** Fraction retained per period (period 0 typically 1.0); 0–1 or 0–100. */
  data: readonly number[];
  /** Peer/industry curve, rendered as a subordinate dashed ghost. */
  compare?: readonly number[] | undefined;
  /**
   * @deprecated Use `compare`. The catalog word for "a second series to read
   * this one against" is `compare` (DualSparkline, StarSpoke) — this chart was
   * the only one calling it `benchmark`, and DualSparkline's own `compare` JSDoc
   * calls it "the benchmark series", which is how the two names drifted. Still
   * accepted, and it still wins over `compare` when both are passed, so no
   * existing caller changes behaviour by upgrading.
   */
  benchmark?: readonly number[] | undefined;
  /** Detect + mark a plateau (default true). */
  plateau?: boolean | undefined;
  /** Step (default — cohort periods are discrete) or smooth (editorial). */
  curve?: RetentionCurveType | undefined;
  /** Period noun for the summary (default "period"). */
  unit?: string | undefined;
  /** `"last"` states the final retention in a right gutter. */
  label?: "last" | "none" | undefined;
  /** Overrides the honest `[0,1]` frame — the docs say why you shouldn't. */
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: RetentionStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Percent formatting shared with the interactive entry. */
export const PCT: Intl.NumberFormatOptions = { style: "percent", maximumFractionDigits: 0 };

export function RetentionCurve(props: RetentionCurveProps): ReactNode {
  const {
    data,
    compare,
    // `benchmark` is the deprecated spelling and wins when both are given.
    benchmark = compare,
    plateau = true,
    curve = "step",
    unit = "period",
    label = "last",
    domain,
    width = 80,
    height = 20,
    color,
    format = PCT,
    locale,
    strings = EN_RETENTION,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const FONT = labelFont(height);
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-retention-curve ${className}` : "mc-retention-curve";

  const probe = retentionGeometry({ width, height, data, benchmark, plateau, curve, domain });
  // Degradation: `labelFont` floors at 7 viewBox units, so under a 7-unit-tall
  // box a line of text cannot be seated inside the plot at all. The readout
  // DROPS rather than spilling past the viewBox, and because the gutter is
  // derived from it the reserved space goes with it — the plot keeps its own
  // width and simply stops paying for text it no longer draws. Pure arithmetic:
  // the static path may never measure text.
  const showLabel = label === "last" && probe != null && labelFitsY(height / 2, FONT, height);
  const labelText = showLabel ? fmt(probe!.last.value) : "";
  const gutterCh = showLabel ? labelText.length : 0;

  const geo = retentionGeometry({
    width,
    height,
    data,
    benchmark,
    plateau,
    curve,
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
        seat={{ mode: "floor", bottom: height - 2 }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () =>
    retentionSummary(geo, fmt, unit, data.length, strings),
  );
  const lineColor = color ?? "var(--mc-accent)";
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  // annotations host contract: Marker x = period index across the shared span
  // (data ∪ benchmark), Threshold/TargetZone y = retained fractions on the frame.
  const yDomain: readonly [number, number] =
    domain && domain.every((d) => Number.isFinite(d)) ? domain : [0, 1];
  const span = Math.max(data.length, benchmark?.length ?? 0);
  const ann = resolveAnnotations(children, {
    x: scaleLinear([0, Math.max(1, span - 1)], [2, width - 2]),
    y: scaleLinear(yDomain, [height - 2, 2]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // The domain is locked to the full share range, so the frame's bottom is
      // an honest "nobody left" floor and the curve descends toward it — that
      // floor sits on the text baseline. The benchmark ghost shares the frame.
      seat={{ mode: "floor", bottom: geo.y1 }}
      className={cls}
      style={rootStyle}
    >
      {ann.under}
      {geo.ghost ? (
        <path
          d={geo.ghost.d}
          data-mc-ink="muted"
          data-mc-w="support"
          fill="none"
          strokeDasharray="2.5 2"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.plateau ? (
        <line
          x1={geo.plateau.fromX}
          y1={geo.plateau.y}
          x2={width}
          y2={geo.plateau.y}
          stroke="var(--mc-neutral)"
          strokeOpacity={0.5}
          strokeDasharray="1 1.5"
          data-mc-w="hair"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      <path
        d={geo.line.d}
        data-mc-ink="data"
        fill="none"
        vectorEffect="non-scaling-stroke"
        style={{ stroke: lineColor }}
      />
      <circle cx={geo.last.x} cy={geo.last.y} r={1.8} style={{ fill: lineColor }} />
      {showLabel ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {labelText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
