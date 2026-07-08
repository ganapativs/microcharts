// <Seismogram> — when did things happen, and how hard (plan/22 #8, S1 events).
// Static, hook-free, RSC-safe. Ticks-from-baseline over bars: density reads as
// texture, not magnitude comparison. Downsampling is max-per-bucket ONLY and
// the summary is always computed from the RAW values, never the buckets.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import { isFiniteValue, type Value } from "../../core/types.js";
import { seismogramGeometry } from "./geometry.js";

/** Factual event summary from RAW values (pre-downsample) — shared with the
 *  interactive entry. Count = non-zero finite slots; peak = |max| magnitude. */
export function seismogramSummary(
  data: readonly Value[],
  fmt: (n: number) => string,
  strings: DistStrings,
): string {
  let count = 0;
  let peak: number | null = null;
  for (const v of data) {
    if (!isFiniteValue(v) || v === 0) continue;
    count++;
    if (peak === null || Math.abs(v) > Math.abs(peak)) peak = v;
  }
  if (data.length === 0) return strings.noData;
  if (count === 0 || peak === null) return strings.noEvents;
  return strings.events(count, fmt(peak));
}

export interface SeismogramProps {
  /** Per-slot event intensity; 0/null = quiet slot. */
  data: readonly Value[];
  /** `"barcode"` collapses heights to uniform ticks — pure occurrence density. */
  mode?: "intensity" | "barcode" | undefined;
  /** Which sign is good — colors signed ticks by polarity. */
  positive?: "up" | "down" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: DistStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function Seismogram(props: SeismogramProps): ReactNode {
  const {
    data,
    mode = "intensity",
    positive,
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

  const geo = seismogramGeometry({ width, height, values: data, domain, mode });
  const fmt = makeFormatter(format, locale);
  const accName = summary === false ? false : (summary ?? seismogramSummary(data, fmt, strings));

  const hasNeg = geo.dNeg !== "";
  const goodDown = positive === "down";
  const tickStyle = (neg: boolean) => ({
    strokeWidth: 1,
    ...(color
      ? { stroke: color }
      : positive !== undefined && hasNeg
        ? { stroke: neg === goodDown ? "var(--mc-positive)" : "var(--mc-negative)" }
        : null),
  });

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-seismo ${className}` : "mc-seismo"}
      style={style}
    >
      {hasNeg || geo.ticks.length === 0 ? (
        /* midline for signed data; for a quiet strip it doubles as the
           designed empty state — a strip at rest, not a blank hole (§8a.3) */
        <line
          x1={0}
          y1={geo.baselineY}
          x2={width}
          y2={geo.baselineY}
          data-mc-ink="muted"
          strokeOpacity={0.4}
          vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: 0.75 }}
        />
      ) : null}
      {geo.dPos !== "" ? (
        <path
          d={geo.dPos}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={tickStyle(false)}
        />
      ) : null}
      {hasNeg ? (
        <path
          d={geo.dNeg}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={tickStyle(true)}
        />
      ) : null}
      {children}
    </Chart>
  );
}
