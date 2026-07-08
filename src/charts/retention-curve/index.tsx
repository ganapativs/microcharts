// <RetentionCurve> — do they stay, and does the curve plateau? (plan/23 #7).
// A step line on a domain LOCKED to [0,1] (the full range is the honest frame
// for a share), an optional dashed benchmark ghost behind, and a plateau marker
// that appears only when the documented criterion holds. Static, hook-free,
// RSC-safe. Non-monotone bumps render as-is (never sorted/smoothed away).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_RETENTION, type RetentionStrings } from "../../core/strings-retention.js";
import { retentionGeometry, type RetentionCurveType, type RetentionGeometry } from "./geometry.js";

/** Factual retention summary. Shared with the interactive entry. */
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
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: RetentionStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PCT: Intl.NumberFormatOptions = { style: "percent", maximumFractionDigits: 0 };

export function RetentionCurve(props: RetentionCurveProps): ReactNode {
  const {
    data,
    benchmark,
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

  const FONT = Math.min(11, Math.max(7, Math.round(height * 0.55)));
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-retention-curve ${className}` : "mc-retention-curve";

  const probe = retentionGeometry({ width, height, data, benchmark, plateau, curve, domain });
  const showLabel = label === "last" && probe != null;
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
        summary={summary === false ? false : (summary ?? strings.noData)}
        id={id}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName =
    summary === false ? false : (summary ?? retentionSummary(geo, fmt, unit, data.length, strings));
  const lineColor = color ?? "var(--mc-accent)";
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={cls}
      style={rootStyle}
    >
      {/* benchmark ghost — dashed + muted, subordinate by construction */}
      {geo.ghost ? (
        <path
          d={geo.ghost.d}
          data-mc-ink="muted"
          fill="none"
          strokeDasharray="2.5 2"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {/* plateau marker — dotted horizontal, only when the criterion holds */}
      {geo.plateau ? (
        <line
          x1={geo.plateau.fromX}
          y1={geo.plateau.y}
          x2={width}
          y2={geo.plateau.y}
          stroke="var(--mc-neutral)"
          strokeOpacity={0.5}
          strokeDasharray="1 1.5"
          strokeWidth={0.6}
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
      {children}
    </Chart>
  );
}
