// <PolarClock> — the shape of a day/week cycle: when is it busy? (,
// S1 cyclic, flagship). Each segment is a radial bar at its fixed cycle angle,
// length ∝ value, growing from an inner baseline. 0 at 12 o'clock, clockwise.
// The channel is radial LENGTH from r0 (not sector area — r0 > 0 curbs the
// outer-area distortion); `mode="opacity"` switches the channel to a 5-step fill
// for very small sizes. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_POLAR_CLOCK, type PolarClockStrings } from "../../core/strings-polar-clock.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import type { Value } from "../../core/types.js";
import { polarClockGeometry } from "./geometry.js";

export interface PolarClockProps {
  data: readonly Value[];
  /** Index of the current segment to accent (position + color, never color alone). */
  now?: number | undefined;
  /** Inner radius fraction r0 (the zero baseline all bars grow from). Default 0.35. */
  inner?: number | undefined;
  /** Index rendered at 12 o'clock (week-start / midnight rotation). Default 0. */
  origin?: number | undefined;
  /** `length` (radial bars, default) or `opacity` (fixed-length, 5-step fill). */
  mode?: "length" | "opacity" | undefined;
  /** Hairline cardinal ticks at 0/¼/½/¾ of the cycle — the at-rest orientation
   *  cue ("where is 12 o'clock"). One merged path node; default true. */
  labels?: boolean | undefined;
  /** Numeral of the peak value in a bottom gutter (`max`), or none (default). */
  label?: "max" | "none" | undefined;
  /** Segment index → label (default: HH:00 for n=24, weekday for n=7, else index). */
  segmentFormat?: ((index: number, n: number) => string) | undefined;
  size?: number | undefined;
  color?: string | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: PolarClockStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

function defaultSegmentLabel(strings: PolarClockStrings) {
  return (index: number, n: number): string => {
    if (n === 24) return `${String(index).padStart(2, "0")}:00`;
    if (n === 7) return strings.weekdays[((index % 7) + 7) % 7] ?? String(index);
    return String(index);
  };
}

export function polarClockSummary(
  data: readonly Value[],
  opts: {
    segmentFormat?: ((index: number, n: number) => string) | undefined;
    strings?: PolarClockStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { strings = EN_POLAR_CLOCK, format, locale } = opts;
  const fmt = makeFormatter(format, locale);
  const seg = opts.segmentFormat ?? defaultSegmentLabel(strings);
  const n = data.length;
  const finite = data
    .map((v, index) => ({ v, index }))
    .filter(
      (e): e is { v: number; index: number } => typeof e.v === "number" && Number.isFinite(e.v),
    );
  if (finite.length === 0) return strings.noData;

  let peak = finite[0]!;
  let low = finite[0]!;
  for (const e of finite) {
    if (e.v > peak.v) peak = e;
    if (e.v < low.v) low = e;
  }
  if (peak.v === low.v) return strings.polarClockFlat(fmt(peak.v));
  return strings.polarClock(seg(peak.index, n), fmt(peak.v), seg(low.index, n));
}

export function PolarClock(props: PolarClockProps): ReactNode {
  const {
    data,
    now,
    inner = 0.35,
    origin = 0,
    mode = "length",
    labels = true,
    label = "none",
    segmentFormat,
    size = 24,
    color,
    format,
    locale,
    strings = EN_POLAR_CLOCK,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  const fontSize = props.fontSize ?? labelFont(size);

  const geo = polarClockGeometry({ values: data, size, inner, origin, pad: PAD, mode, now });
  const accName =
    summary === false
      ? false
      : (summary ?? polarClockSummary(data, { segmentFormat, strings, format, locale }));
  const fmt = makeFormatter(format, locale);

  const labelBand = label === "max" ? Math.ceil(fontSize * 1.35) : 0;
  const peakText =
    label === "max" && geo.peakIndex >= 0 && typeof data[geo.peakIndex] === "number"
      ? fmt(data[geo.peakIndex] as number)
      : null;

  return (
    <Chart
      width={geo.size}
      height={geo.size + labelBand}
      title={title}
      summary={accName}
      id={id}
      // The dial is the mark, and it's radially symmetric — centre it on the cap
      // band. Seating the dial rather than the viewBox matters here: `label="max"`
      // appends a text band below, which would otherwise drag the dial upward.
      seat={{ mode: "center", top: PAD, bottom: geo.size - PAD }}
      className={className ? `mc-polar ${className}` : "mc-polar"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {/* zero baseline all bars grow from */}
      <circle
        cx={geo.guide.cx}
        cy={geo.guide.cy}
        r={geo.guide.r}
        data-mc-ink="muted"
        data-mc-w="hair"
        style={{ fill: "none", strokeOpacity: 0.5 }}
      />
      {labels && geo.cardinalPath ? (
        <path
          d={geo.cardinalPath}
          data-mc-ink="muted"
          data-mc-w="hair"
          style={{ strokeOpacity: 0.6 }}
        />
      ) : null}
      {mode === "opacity" ? (
        geo.levelPaths.map((lp) => (
          <path
            key={`l${lp.opacity}`}
            d={lp.d}
            data-mc-ink="cell"
            style={{ fillOpacity: lp.opacity }}
          />
        ))
      ) : geo.segmentsPath ? (
        <path d={geo.segmentsPath} data-mc-ink="bar" style={color ? { fill: color } : undefined} />
      ) : null}
      {/* now-segment: a FILLED sector. The accent-path CSS rule strokes (not
          fills) accent paths, so an inline fill is needed for it to read solid;
          the role is kept for the forced-colors Highlight mapping. */}
      {geo.accentPath ? (
        <path d={geo.accentPath} data-mc-ink="accent" style={{ fill: "var(--mc-accent)" }} />
      ) : null}
      {peakText !== null ? (
        <text
          x={geo.size / 2}
          y={geo.size + fontSize}
          fontSize={fontSize}
          textAnchor="middle"
          data-mc-ink="label"
        >
          {peakText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
