// <MicroScatter> — are these two variables related?
// Static, hook-free, RSC-safe. Dots at 75% opacity so overplot reads as
// density instead of lying by occlusion; duplicates are never jittered —
// position IS the encoding. Whenever the summary uses a relationship word it
// states r beside it (claim and evidence travel together).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { EN_SCATTER, type ScatterStrings } from "../../core/strings-scatter.js";
import { microScatterGeometry, relationshipTier } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface ScatterPoint {
  x: number;
  y: number;
}

export function microScatterSummary(
  count: number,
  r: number | null,
  strings: ScatterStrings,
): string {
  if (count === 0) return strings.noData;
  const base = strings.scatterCount(count);
  if (r === null) return base;
  const tier = relationshipTier(r);
  return `${base} ${strings.relationship(tier, r >= 0 ? "positive" : "negative", String(r))}`;
}

export interface MicroScatterProps {
  data: readonly ScatterPoint[];
  /** Least-squares line — linear only, never smoothed. */
  trend?: boolean | undefined;
  /** Index of one accented point — "this one, among all of them". */
  focal?: number | undefined;
  /** X-axis domain (scatter is the one core type with two value axes). */
  xDomain?: readonly [number, number] | undefined;
  /** Y-axis domain (the shared `domain` grammar name). */
  domain?: readonly [number, number] | undefined;
  /** Dot radius in viewBox units, clamped to [1, 3]. */
  r?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  strings?: ScatterStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function MicroScatter(props: MicroScatterProps): ReactNode {
  const {
    data,
    trend = false,
    focal,
    xDomain,
    domain,
    width = 40,
    height = 24,
    color,
    strings = EN_SCATTER,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  const rad = Math.min(3, Math.max(1, props.r ?? 1.5));

  if (data.length > 60) {
    devWarn(
      `<MicroScatter> ${data.length} points — past 60, overplot wins; bin instead (documented cap).`,
    );
  }

  const geo = microScatterGeometry({
    width,
    height,
    points: data,
    xDomain,
    yDomain: domain,
    trend,
    r: rad,
  });
  const accName = resolveSummary(summary, () =>
    microScatterSummary(geo.dots.length, geo.r, strings),
  );

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A 2-D field: the box bottom is the y-axis low end, an extent rather than
      // anything the dots stand on, so the plot frame centres on the cap band.
      // The frame is the radius-inset box the scales project into — using the
      // dots' own extent would rock the whole chart every time a value moved.
      seat={{ mode: "center", top: rad, bottom: height - rad }}
      className={className ? `mc-scatter ${className}` : "mc-scatter"}
      style={style}
    >
      {geo.trendLine ? (
        <line
          x1={geo.trendLine.x1}
          y1={geo.trendLine.y1}
          x2={geo.trendLine.x2}
          y2={geo.trendLine.y2}
          data-mc-ink="muted"
          data-mc-w="support"
          strokeOpacity={0.45}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.dots.map((dot) => {
        const isFocal = focal === dot.index;
        return (
          <circle
            key={dot.index}
            cx={dot.x}
            cy={dot.y}
            r={rad}
            data-mc-ink={isFocal ? "accent" : color ? undefined : "point"}
            fillOpacity={isFocal ? 1 : 0.75}
            style={!isFocal && color ? { fill: color } : undefined}
          />
        );
      })}
      {children}
    </Chart>
  );
}
