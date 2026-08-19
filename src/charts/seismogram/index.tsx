// <Seismogram> — when did things happen, and how hard.
// Ticks-from-baseline over bars: density reads as
// texture, not magnitude comparison. Downsampling is max-per-bucket ONLY and
// the summary is always computed from the RAW values, never the buckets.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import { chartSide, isFiniteValue, type Value } from "../../core/types.js";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, seismogramGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

/** From raw values (pre-downsample). Count = non-zero finite slots; peak = |max|. */
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
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
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

  // The box drives the geometry AND the inline seat, neither of which `Chart`'s
  // own clamp reaches: a NaN height shipped `V NaN` ticks and `--mc-seat: NaN`
  // inside a valid viewBox (see `chartSide`).
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

  const geo = seismogramGeometry({ width, height, values: data, domain, mode, anomaly });
  const fmt = makeFormatter(format, locale);
  const accName = resolveSummary(summary, () => seismogramSummary(data, fmt, strings));

  const goodDown = positive === "down";
  const baseStroke = color ? { stroke: color } : null;
  // Signed polarity coloring only engages when the author declares which way is
  // good. An ink ROLE, not an inline stroke: `.mc-root` sets
  // forced-color-adjust: none, so an inline `var(--mc-negative)` survived
  // verbatim into High Contrast Mode — the theme hue against the user's own
  // background — and a consumer could not restyle it either, since `:where()`
  // gives the stylesheet zero specificity and inline paint beats all of it.
  // Only the caller's own `color` stays inline.
  const polarity = (neg: boolean) =>
    positive === undefined ? "data" : neg === goodDown ? "positive" : "negative";
  // …and where valence is not painting, the polarity paths are plain data ink,
  // so the caller's `color` still reaches them.
  const polarityStroke = positive === undefined ? (baseStroke ?? undefined) : undefined;

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
        />
      ) : null}
      {geo.dData !== "" ? (
        <path d={geo.dData} data-mc-ink="data" style={baseStroke ?? undefined} />
      ) : null}
      {geo.dPos !== "" ? (
        <path
          d={geo.dPos}
          // literal, and load-bearing: it is the only signal the valence rules
          // read to keep an open mark hollow — without it the tick path takes
          // `stroke: none` from the fill family and vanishes
          fill="none"
          data-mc-ink={polarity(false)}
          data-mc-w="full"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={polarityStroke}
        />
      ) : null}
      {geo.dNeg !== "" ? (
        <path
          d={geo.dNeg}
          fill="none"
          data-mc-ink={polarity(true)}
          data-mc-w="full"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={polarityStroke}
        />
      ) : null}
      {geo.dFlag !== "" ? (
        /* anomaly spikes — alert token; redundant with height, never color-alone */
        <path
          d={geo.dFlag}
          fill="none"
          data-mc-ink="negative"
          data-mc-w="full"
          strokeLinecap="round"
        />
      ) : null}
      {children}
    </Chart>
  );
}
