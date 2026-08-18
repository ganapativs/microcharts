// <ParetoStrip> — what should we fix first? Descending bars + a
// cumulative-share line on a FIXED 0–100% scale (never rescaled to steepen the
// curve). Bars up to the threshold crossing are accent ("vital few"). the rest
// muted — the chart's one job is to say where to stop reading. 80% is a working
// REFERENCE, never a law; `Other` never participates in ranking.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { chartSide, round2 } from "../../core/types.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { makePercentFormatter } from "../../core/format.js";
import { EN_PARETO, type ParetoStrings } from "../../core/strings-pareto.js";
import {
  paretoGeometry,
  DEFAULT_HEIGHT,
  DEFAULT_MAX_ITEMS,
  DEFAULT_THRESHOLD,
  DEFAULT_WIDTH,
  type ParetoGeometry,
} from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

/** Cumulative + per-bar shares go through `Intl`'s own percent style. The old
 *  `${Math.round(frac * 100)}%` was an en-US percent (fr-FR wants a NBSP before
 *  the sign, tr-TR puts it first). `locale` is the chart's own prop, threaded so
 *  a server render and its client hydration resolve the same string instead of
 *  each taking its host default. Trailing and optional: callers that never
 *  localized keep compiling. */
export const paretoPercent = (
  locale?: string | string[] | undefined,
): ((fraction: number) => string) => makePercentFormatter(locale);

export function paretoSummary(
  geo: ParetoGeometry,
  opts: { unit: string; metric: string },
  strings: ParetoStrings,
  pct: (fraction: number) => string = paretoPercent(),
): string {
  if (geo.degenerate) return strings.paretoEmpty(opts.metric);
  if (geo.crossing === null) return strings.paretoTop(geo.topLabel, pct(geo.topShare));
  return strings.pareto(geo.vitalCount, geo.n, opts.unit, pct(geo.cumAtCrossing), opts.metric);
}

export interface ParetoStripProps {
  /** Categories with magnitudes (a composition — values ≥ 0). */
  data: readonly { label: string; value: number }[];
  /** Cumulative reference line % (default 80; `false` turns it off). */
  threshold?: number | false | undefined;
  /** Categories beyond `maxItems` roll up into Other (default 8). */
  maxItems?: number | undefined;
  /** Category noun for the summary (default "causes"). */
  unit?: string | undefined;
  /** Total-metric noun for the summary (default "the total"). */
  metric?: string | undefined;
  /** `"count"` states "K of N → cum%" in a gutter. */
  label?: "count" | "none" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  locale?: string | string[] | undefined;
  strings?: ParetoStrings | undefined;
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

export function ParetoStrip(props: ParetoStripProps): ReactNode {
  const {
    data,
    threshold = DEFAULT_THRESHOLD,
    maxItems = DEFAULT_MAX_ITEMS,
    unit = "causes",
    metric = "the total",
    label = "count",
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    color,
    locale,
    strings = EN_PARETO,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // Everything below reads the RESOLVED box, never the prop: `height={NaN}`
  // used to set `--mc-label-px: NaNpx` and a NaN seat on a 1×1 frame.
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

  const FONT = labelFont(height, 0.55, labelSize);
  const pct = paretoPercent(locale);
  const cls = className ? `mc-pareto-strip ${className}` : "mc-pareto-strip";

  const probe = paretoGeometry({ width, height, data, threshold, maxItems });
  // Degradation: `labelFont` floors at 7 viewBox units, so under a 7-unit-tall
  // box a line of text cannot be seated inside the plot at all. The readout
  // DROPS rather than spilling past the viewBox, and because the gutter is
  // derived from it the reserved space goes with it — the plot keeps its own
  // width and simply stops paying for text it no longer draws. Pure arithmetic:
  // the static path may never measure text.
  const showLabel =
    label === "count" &&
    probe != null &&
    probe.crossing != null &&
    labelFitsY(height / 2, FONT, height);
  // Gutter off the FORMATTED string, so a locale that widens the percent
  // ("82 %") reserves the extra character instead of spilling the viewBox.
  const labelText = showLabel
    ? strings.paretoCount(probe!.vitalCount, probe!.n, pct(probe!.cumAtCrossing))
    : "";
  const gutterCh = showLabel ? labelText.length : 0;

  const geo = paretoGeometry({
    width,
    height,
    data,
    threshold,
    maxItems,
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
        seat={{ mode: "floor", bottom: height }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () => paretoSummary(geo, { unit, metric }, strings, pct));
  const rootStyle = { ...style, "--mc-label-px": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // The ranked bars are the primary read and geometry already seats them
      // flush at `height` (unstroked fills need no bottom reserve — only the
      // cumulative line keeps the inset frame), so the bar floor is the box
      // bottom and the strip stands on the baseline.
      seat={{ mode: "floor", bottom: height }}
      className={cls}
      style={rootStyle}
    >
      {/* Vital few accent / rest muted; `color` overrides the vital few via an
          inline fill. The muted rest keeps the neutral ink ROLE instead of an
          inline `var(--mc-neutral)` — an inline fill survives `.mc-root`'s
          `forced-color-adjust: none` verbatim, so under High Contrast the
          muted bars painted a matte gray against the reader's own background
          rather than mapping to GrayText. */}
      {geo.painted.map((i) => {
        const b = geo.bars[i]!;
        const tinted = !!color && b.vital;
        return (
          <rect
            // The bar's rank, not its label: category names are caller data, so
            // two bars can share one ("Timeouts" twice, or a caller category
            // literally named "Other" beside the rolled-up one), and a
            // duplicate key lets React drop or duplicate a bar on re-render.
            key={i}
            x={b.x}
            y={b.y}
            width={b.width}
            height={b.height}
            data-mc-ink={tinted ? "bar" : b.vital ? "accent" : "neutral"}
            fillOpacity={b.vital ? 1 : 0.5}
            shapeRendering="crispEdges"
            style={tinted ? { fill: color } : undefined}
          />
        );
      })}
      {geo.line.d ? (
        <path d={geo.line.d} data-mc-ink="muted" data-mc-w="support" fill="none" />
      ) : null}
      {geo.thresholdY !== null ? (
        <line
          x1={0}
          y1={geo.thresholdY}
          x2={width}
          y2={geo.thresholdY}
          data-mc-ink="muted"
          data-mc-w="hair"
          strokeOpacity={0.55}
          strokeDasharray="2 2"
        />
      ) : null}
      {geo.crossing !== null && geo.thresholdY !== null ? (
        <circle
          cx={geo.crossing.x}
          cy={geo.thresholdY}
          r={1.6}
          data-mc-ink="accent"
          style={color ? { fill: color } : undefined}
        />
      ) : null}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={round2(height / 2)}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
