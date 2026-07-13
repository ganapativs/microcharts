// <Bullet> — value vs target vs qualitative bands. Ships
// instead of a gauge (Few). Static, hook-free, RSC-safe. Graduated neutral
// bands sit lowest; the measure bar and target tick carry the reading. The tick
// is a distinct shape+position from the bar, so target vs measure never relies
// on color alone.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { bulletGeometry } from "./geometry.js";

/** Factual S4 summary — value, target, and where the value lands. Shared with
 *  the interactive entry (one wording, no drift). */
export function bulletSummary(value: string, target: string | null): string {
  return target ? `${value} of ${target} target.` : `${value}.`;
}

export interface BulletProps {
  value: number;
  target?: number | undefined;
  /** Ascending qualitative thresholds (e.g. `[50, 80]` on a 0–100 scale). */
  bands?: readonly number[] | undefined;
  /** Explicit `[0, max]`; auto-fit when omitted. */
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function Bullet(props: BulletProps): ReactNode {
  const {
    value,
    target,
    bands,
    domain,
    width = 80,
    height = 16,
    color,
    format,
    locale,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = bulletGeometry({ width, height, value, target, bands, domain });
  const fmt = makeFormatter(format, locale);

  const accName =
    summary === false
      ? false
      : typeof summary === "string"
        ? summary
        : Number.isFinite(value)
          ? bulletSummary(
              fmt(value),
              target !== undefined && Number.isFinite(target) ? fmt(target) : null,
            )
          : "No data.";

  // More bands → widen the shade spread so regions stay distinguishable.
  const steps = Math.max(1, geo.regions.length);

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-bullet ${className}` : "mc-bullet"}
      style={style}
    >
      {geo.regions.map((r) => (
        <rect
          key={r.step}
          x={r.x}
          y={geo.track.y}
          width={r.width}
          height={geo.track.height}
          shapeRendering="crispEdges"
          data-mc-ink="bar"
          style={{ fillOpacity: 0.05 + (r.step / steps) * 0.16 }}
        />
      ))}
      <rect
        x={geo.measure.x}
        y={geo.measure.y}
        width={geo.measure.width}
        height={geo.measure.height}
        shapeRendering="crispEdges"
        data-mc-ink="bar"
        style={color ? { fill: color } : undefined}
      />
      {geo.tick ? (
        <line
          x1={geo.tick.x}
          y1={geo.tick.y0}
          x2={geo.tick.x}
          y2={geo.tick.y1}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: "calc(var(--mc-stroke-width) * 1.33)" }}
        />
      ) : null}
      {children}
    </Chart>
  );
}
