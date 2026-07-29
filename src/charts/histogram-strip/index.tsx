// <HistogramStrip> — what does the distribution look like.
// Mode, spread, skew in a cell: ≤ 12 uniform bins, zero-anchored counts, never
// density-smoothed. Contract: RAW observations in — pre-aggregated counts are
// not supported (docs steer to SparkBar).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import type { Value } from "../../core/types.js";
import { histogramGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export function histogramSummary(
  total: number,
  modal: { x0: number; x1: number } | undefined,
  fmt: (n: number) => string,
  strings: DistStrings,
): string {
  if (total === 0 || !modal) return strings.noData;
  return strings.distribution(total, fmt(modal.x0), fmt(modal.x1));
}

export interface HistogramStripProps {
  /** RAW observations — binned internally. */
  data: readonly Value[];
  /** Bin count; auto = min(12, ⌈√n⌉). */
  bins?: number | undefined;
  /** A VALUE whose bin gets accent — "where you fall in the distribution". */
  markValue?: number | undefined;
  /** Fixed bin edges across small multiples (calibration). */
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: DistStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function HistogramStrip(props: HistogramStripProps): ReactNode {
  const {
    data,
    bins,
    markValue,
    domain,
    width = 60,
    height = 16,
    color,
    format,
    locale,
    strings = EN_DIST,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = histogramGeometry({ width, height, values: data, domain, bins, markValue });
  const fmt = makeFormatter(format, locale);
  const modal = geo.modalBin >= 0 ? geo.bars[geo.modalBin] : undefined;
  const accName = resolveSummary(summary, () => histogramSummary(geo.total, modal, fmt, strings));
  const hasMark = geo.markBin >= 0;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Counts are zero-anchored and every bin's bottom edge is `height`; the
      // half-unit inset geometry reserves is at the TOP (headroom for the modal
      // bin), so the floor is the box bottom and the bins sit on the baseline.
      seat={{ mode: "floor", bottom: height }}
      className={className ? `mc-histogram ${className}` : "mc-histogram"}
      style={style}
    >
      {geo.bars.map((b) => {
        if (b.h <= 0) return null;
        // The marked bin takes the `accent` ink ROLE, not an inline
        // `fill: var(--mc-accent)`. `.mc-root` sets `forced-color-adjust: none`,
        // so an inline fill survives verbatim into High Contrast Mode — the one
        // emphasized bin kept the theme's accent hex while every other bar
        // became CanvasText, out of reach of the forced-colors mapping. The role
        // paints identically in the normal layer and maps to Highlight there.
        const marked = hasMark && b.index === geo.markBin;
        return (
          <rect
            key={b.index}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            shapeRendering="crispEdges"
            data-mc-ink={marked ? "accent" : "bar"}
            style={
              marked
                ? undefined
                : hasMark
                  ? { fillOpacity: 0.55, ...(color ? { fill: color } : null) }
                  : color
                    ? { fill: color }
                    : undefined
            }
          />
        );
      })}
      {children}
    </Chart>
  );
}
