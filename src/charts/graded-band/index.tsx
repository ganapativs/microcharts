// <GradedBand> — how sure are we about one number? (plan/23 #4, S1). Nested
// central intervals graded by opacity, with a median tick. Static, hook-free,
// RSC-safe. NEVER a bar from zero and no variant may add one (bar-plus-error-bar
// induces edge-literalism bias); opacity maps to probability level and nothing
// else.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_QUANTILE, type QuantileStrings } from "../../core/strings-quantile.js";
import { round2, type Value } from "../../core/types.js";
import { gradedBandGeometry, type GradedBandGeometry } from "./geometry.js";

/** Factual graded-band summary. Shared with the interactive entry. */
export function gradedBandSummary(
  geo: GradedBandGeometry,
  fmt: (n: number) => string,
  strings: QuantileStrings,
): string {
  if (geo.degenerate || geo.bands.length === 0) {
    return strings.bandPoint(fmt(geo.median.value));
  }
  // narrowest (most certain) + widest, in ascending level order — brief but honest
  const asc = [...geo.bands].sort((a, b) => a.p - b.p);
  const picked = asc.length > 2 ? [asc[0]!, asc[asc.length - 1]!] : asc;
  const clauses = picked.map((b) => strings.bandClause(b.p, fmt(b.lo), fmt(b.hi))).join(", ");
  return strings.gradedBand(fmt(geo.median.value), clauses);
}

export interface GradedBandProps {
  /** Sample / posterior draws for one estimate. */
  data: readonly Value[];
  /** 1–3 nested central intervals (default `[50, 80, 95]`). */
  levels?: readonly number[] | undefined;
  /** Observed/point value overlaid as a dot (distinct shape from the median tick). */
  value?: number | undefined;
  /** Fade past the outermost band instead of a hard cut ("this is approximate"). */
  softEdge?: boolean | undefined;
  /** `"median"` states the median in a right gutter. */
  label?: "median" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: QuantileStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

// widest band faintest → narrowest strongest; VISIBLE at every level (the
// graded nesting is the whole read). Accent tint distinguishes it from
// BenchmarkStrip's neutral peer band.
const OPACITY = (step: number, k: number): number =>
  k <= 1 ? 0.34 : round2(0.14 + (step / (k - 1)) * 0.24);

export function GradedBand(props: GradedBandProps): ReactNode {
  const {
    data,
    levels,
    value,
    softEdge = false,
    label = "none",
    domain,
    width = 80,
    height = 12,
    color,
    format,
    locale,
    strings = EN_QUANTILE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // label size in viewBox units (~0.62·height, clamped 7–11) — see coverage-strip
  const FONT = Math.min(11, Math.max(7, Math.round(height * 0.62)));
  const fmt = makeFormatter(format, locale);
  const showLabel = label === "median";
  const geo = gradedBandGeometry({ width, height, data, levels, value, domain });
  const cls = className ? `mc-graded-band ${className}` : "mc-graded-band";

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

  const accName = summary === false ? false : (summary ?? gradedBandSummary(geo, fmt, strings));
  const k = geo.bands.length;
  const outer = geo.bands[0];

  // median value reads right at the median tick (over the faint band, like the
  // gallery), flipping to the tick's left near the right edge — never escapes
  const medText = showLabel ? fmt(geo.median.value) : "";
  const medW = medText.length * FONT * 0.62;
  const medFlip = geo.median.x + 3 + medW > width - 1;
  const medX = round2(medFlip ? geo.median.x - 3 : geo.median.x + 3);
  // pin the label size to viewBox units (see coverage-strip / plan/12)
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={cls}
      style={rootStyle}
    >
      {softEdge && outer && !geo.degenerate ? (
        // id-free soft edge: a wider, fainter halo behind the outer band
        <rect
          x={round2(Math.max(0, outer.x - 2))}
          y={geo.bandY}
          width={round2(outer.width + 4)}
          height={geo.bandH}
          rx={geo.bandH / 2}
          data-mc-ink="band"
          style={{ fill: color ?? "var(--mc-accent)", fillOpacity: OPACITY(0, k) * 0.5 }}
        />
      ) : null}
      {/* fill via inline STYLE (see benchmark-strip): the band ink-role CSS
          would override a fill attribute to the faint --mc-band token. plan/12. */}
      {geo.bands.map((b) => (
        <rect
          key={b.p}
          x={b.x}
          y={geo.bandY}
          width={b.width}
          height={geo.bandH}
          rx={softEdge ? geo.bandH / 2 : 1}
          data-mc-ink="band"
          style={{ fill: color ?? "var(--mc-accent)", fillOpacity: OPACITY(b.step, k) }}
        />
      ))}
      {/* median tick — the "data" ink role IS this mark exactly: no fill,
          data-ink stroke at the full primary width */}
      <line
        x1={geo.median.x}
        y1={geo.bandY - 0.5}
        x2={geo.median.x}
        y2={geo.bandY + geo.bandH + 0.5}
        data-mc-ink="data"
        vectorEffect="non-scaling-stroke"
      />
      {geo.dot ? (
        // the observed value is a distinct hollow ring, never confused with the
        // tick — fill stays the literal surface token (punches through the
        // band beneath it, so the "data" ink role's forced fill:none doesn't
        // fit); width alone moves to a role
        <circle
          cx={geo.dot.x}
          cy={round2(height / 2)}
          r={1.8}
          fill="var(--mc-surface)"
          stroke="var(--mc-stroke)"
          data-mc-w="support"
        />
      ) : null}
      {showLabel ? (
        <text
          x={medX}
          y={round2(height / 2)}
          textAnchor={medFlip ? "end" : "start"}
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {medText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
