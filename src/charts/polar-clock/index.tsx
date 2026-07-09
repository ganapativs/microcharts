// <PolarClock> — the shape of a day/week cycle: when is it busy? (plan/24 #17,
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
import { polarClockGeometry } from "./geometry.js";

export interface PolarClockProps {
  data: readonly (number | null)[];
  /** Index of the current segment to accent (position + color, never color alone). */
  now?: number | undefined;
  /** Inner radius fraction r0 (the zero baseline all bars grow from). Default 0.35. */
  inner?: number | undefined;
  /** Index rendered at 12 o'clock (week-start / midnight rotation). Default 0. */
  start?: number | undefined;
  /** `length` (radial bars, default) or `opacity` (fixed-length, 5-step fill). */
  mode?: "length" | "opacity" | undefined;
  /** Hairline cardinal ticks at 0/¼/½/¾ of the cycle. */
  labels?: boolean | undefined;
  /** Numeral of the peak value in a bottom gutter (`max`), or none (default). */
  label?: "max" | "none" | undefined;
  /** Segment index → label (default: HH:00 for n=24, weekday for n=7, else index). */
  formatSegment?: ((index: number, n: number) => string) | undefined;
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
  data: readonly (number | null)[],
  opts: {
    formatSegment?: ((index: number, n: number) => string) | undefined;
    strings?: PolarClockStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { strings = EN_POLAR_CLOCK, format, locale } = opts;
  const fmt = makeFormatter(format, locale);
  const seg = opts.formatSegment ?? defaultSegmentLabel(strings);
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
    start = 0,
    mode = "length",
    labels = false,
    label = "none",
    formatSegment,
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

  const geo = polarClockGeometry({ values: data, size, inner, start, pad: PAD, mode, now });
  const accName =
    summary === false
      ? false
      : (summary ?? polarClockSummary(data, { formatSegment, strings, format, locale }));
  const fill = color ?? "var(--mc-stroke)";
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
      className={className ? `mc-polar ${className}` : "mc-polar"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {/* zero baseline all bars grow from */}
      <circle
        cx={geo.guide.cx}
        cy={geo.guide.cy}
        r={geo.guide.r}
        data-mc-ink="muted"
        style={{ fill: "none", strokeOpacity: 0.5, strokeWidth: 0.5 }}
      />
      {labels
        ? geo.cardinalTicks.map((t) => (
            <line
              key={`c${t.x1}-${t.y1}`}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              data-mc-ink="muted"
              style={{ strokeWidth: 0.5, strokeOpacity: 0.6 }}
            />
          ))
        : null}
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
        <path d={geo.segmentsPath} style={{ fill }} />
      ) : null}
      {geo.accentPath ? <path d={geo.accentPath} data-mc-ink="accent" /> : null}
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
