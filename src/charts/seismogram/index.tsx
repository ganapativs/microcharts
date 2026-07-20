// <Seismogram> — when did things happen, and how hard.
// Static, hook-free, RSC-safe. Ticks-from-baseline over bars: density reads as
// texture, not magnitude comparison. Downsampling is max-per-bucket ONLY and
// the summary is always computed from the RAW values, never the buckets.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import { isFiniteValue, type Value } from "../../core/types.js";
import { seismogramGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

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
  /** Magnitude threshold; ticks with `|v| ≥ anomaly` flare in the alert token. */
  anomaly?: number | undefined;
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

export function Seismogram(props: SeismogramProps): ReactNode {
  const {
    data,
    mode = "intensity",
    positive,
    anomaly,
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

  const geo = seismogramGeometry({ width, height, values: data, domain, mode, anomaly });
  const fmt = makeFormatter(format, locale);
  const accName = resolveSummary(summary, () => seismogramSummary(data, fmt, strings));

  const goodDown = positive === "down";
  const baseStroke = color ? { stroke: color } : null;
  // signed polarity coloring only engages when the author declares which way is good
  const polarity = (neg: boolean) =>
    positive !== undefined
      ? { stroke: neg === goodDown ? "var(--mc-positive)" : "var(--mc-negative)" }
      : baseStroke;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A trace that flares both ways off a midline has no floor to stand on, so
      // it centres on the cap band and reads as instrument tape set in the
      // sentence. The tick band is inset a symmetric half-unit top and bottom, so
      // its midpoint is the frame's midpoint — the frame gives the same seat for
      // fewer bytes, and it holds in signed mode too, where the ZERO line moves
      // but the box the ticks live in does not.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-seismo ${className}` : "mc-seismo"}
      style={style}
    >
      {geo.signed || geo.ticks.length === 0 ? (
        /* zero-reference midline for signed data; for a quiet strip it doubles
           as the designed empty state — a strip at rest, not a blank hole.
           Unsigned ticks are centered and imply their own axis. */
        <line
          x1={0}
          y1={geo.baselineY}
          x2={width}
          y2={geo.baselineY}
          data-mc-ink="muted"
          data-mc-w="tick"
          strokeOpacity={0.4}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {/* tick width inherits --mc-stroke-width (theme-tunable, matches peers) */}
      {geo.dData !== "" ? (
        <path
          d={geo.dData}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={baseStroke ?? undefined}
        />
      ) : null}
      {geo.dPos !== "" ? (
        <path
          d={geo.dPos}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={polarity(false) ?? undefined}
        />
      ) : null}
      {geo.dNeg !== "" ? (
        <path
          d={geo.dNeg}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={polarity(true) ?? undefined}
        />
      ) : null}
      {geo.dFlag !== "" ? (
        /* anomaly spikes — alert token; redundant with height, never color-alone */
        <path
          d={geo.dFlag}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={{ stroke: "var(--mc-negative)" }}
        />
      ) : null}
      {children}
    </Chart>
  );
}
