// <GradedBand> — how sure are we about one number? Nested
// central intervals graded by opacity, with a median tick.
// NEVER a bar from zero and no variant may add one (bar-plus-error-bar
// induces edge-literalism bias); opacity maps to probability level and nothing
// else.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, makePercentFormatter, type Format } from "../../core/format.js";
import { EN_QUANTILE, type QuantileStrings } from "../../core/strings-quantile.js";
import { round2, type Value } from "../../core/types.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { gradedBandGeometry, type GradedBandGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export function gradedBandSummary(
  geo: GradedBandGeometry,
  fmt: (n: number) => string,
  strings: QuantileStrings,
  /**
   * Formatter for the interval LEVEL (a percent), separate from `fmt` (the
   * value). The strings bundle used to receive the level as a bare number and
   * bake `%` into its own template, which made the level the one number on this
   * chart that a `locale` could not reach — and left the announcement and the
   * visible chip disagreeing once the chip started formatting properly.
   * Defaults to the host locale so existing callers keep working.
   */
  levelFmt: (fraction: number) => string = makePercentFormatter(undefined),
): string {
  if (geo.degenerate || geo.bands.length === 0) {
    return strings.bandPoint(fmt(geo.median.value));
  }
  // narrowest (most certain) + widest, in ascending level order — brief but honest
  const asc = [...geo.bands].sort((a, b) => a.p - b.p);
  const picked = asc.length > 2 ? [asc[0]!, asc[asc.length - 1]!] : asc;
  const clauses = picked
    .map((b) => strings.bandClause(levelFmt(b.p / 100), fmt(b.lo), fmt(b.hi)))
    .join(", ");
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
  format?: Format | undefined;
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
  const FONT = labelFont(height, 0.62);
  const fmt = makeFormatter(format, locale);
  // `labelFont` floors at 7 viewBox units: under a 7-unit box the median
  // readout cannot sit inside the frame, so it DROPS rather than painting above
  // and below it. The graded nesting is the primary read and survives alone.
  const showLabel = label === "median" && labelFitsY(height / 2, FONT, height);
  const bare = gradedBandGeometry({ width, height, data, levels, value, domain });
  const cls = className ? `mc-graded-band ${className}` : "mc-graded-band";

  if (bare === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        // Empty seats like the drawn band: same centre, no band to measure.
        seat={{ mode: "center", top: 0, bottom: height }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  // Right gutter (prop contract) — never over the band. Gutter width matches the
  // formatted median so the readout can't collide with the outer interval.
  const medText = showLabel ? fmt(bare.median.value) : "";
  const geo = showLabel
    ? gradedBandGeometry({
        width,
        height,
        data,
        levels,
        value,
        domain,
        gutterCh: medText.length,
        fontSize: FONT,
      })!
    : bare;

  const levelFmt = makePercentFormatter(locale);
  const accName = resolveSummary(summary, () => gradedBandSummary(geo, fmt, strings, levelFmt));
  const k = geo.bands.length;
  const outer = geo.bands[0];
  const bandColor = color ?? "var(--mc-accent)";
  // pin the label size to viewBox units (see coverage-strip)
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Seat the band, not the box: the median tick overshoots it by half a unit
      // and the frame is twice its height. Intervals are explicitly NEVER bars
      // from zero, so there is no floor here — the band centres on the cap band.
      seat={{ mode: "center", top: geo.bandY, bottom: geo.bandY + geo.bandH }}
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
          data-mc-cone="edge"
          style={
            {
              "--mc-cone-color": bandColor,
              "--mc-cone-opacity": OPACITY(0, k) * 0.5,
            } as CSSProperties
          }
        />
      ) : null}
      {/* The nested intervals are the whole read, and their paint is dynamic
          (accent, or the `color` prop, at a per-level opacity), so the chart
          sets the shared `--mc-cone-*` vars and styles.css owns the `fill` —
          the same move ForecastCone and FoldedDayBand make. Inline `fill` is
          what this used to do, and `.mc-root` sets `forced-color-adjust: none`:
          a 14%-opacity accent survives verbatim into High Contrast Mode, where
          it is not a visible interval. The shared rule maps all three to system
          ink and keeps their ordering. `ink="band"` is the wrong token here —
          it is a muted background, not accent data ink. */}
      {geo.bands.map((b) => (
        <rect
          key={b.p}
          x={b.x}
          y={geo.bandY}
          width={b.width}
          height={geo.bandH}
          rx={softEdge ? geo.bandH / 2 : 1}
          data-mc-cone={b.p}
          style={
            {
              "--mc-cone-color": bandColor,
              "--mc-cone-opacity": OPACITY(b.step, k),
            } as CSSProperties
          }
        />
      ))}

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
        // tick — the surface fill punches through the band beneath it, so it
        // overrides the `data` role's fill:none from an inline style. The
        // role's stroke is already this ring's stroke, so taking the role costs
        // nothing and is what carries the observation across a data change.
        <circle
          cx={geo.dot.x}
          cy={round2(height / 2)}
          r={1.8}
          data-mc-ink="data"
          style={{ fill: "var(--mc-surface)" }}
          data-mc-w="support"
        />
      ) : null}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="end"
          dominantBaseline="central"
          // The gutter readout is a direct value label like every other
          // chart's. Without the role it fell through to `.mc-root text`'s
          // `--mc-stroke`, a fixed dark hex that `forced-color-adjust: none`
          // preserves into High Contrast Mode — the median went invisible on a
          // dark system background. `label` is the role that carries the
          // CanvasText mapping. (`tabular-nums` came off with it: styles.css
          // already sets it on `.mc-root text`, and inline put it out of a
          // consumer's reach.)
          data-mc-ink="label"
          fontSize={FONT}
          style={{ fontWeight: 600 }}
        >
          {medText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
