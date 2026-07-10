// <SpiralYear> — how did the year breathe? Seasonality at a glance (plan/24 #18,
// S1 calendar). A calendar series wound onto an Archimedean spiral: angle =
// position in the year (Jan 1 at 12 o'clock, clockwise), each turn outward = the
// next year. The value is a 5-step (or 3-step) opacity — an ORDINAL channel, the
// weakest ordered one — so this is a PATTERN instrument; point reads steer to
// ActivityGrid/HeatStrip. Spiral radius encodes time only, never value. Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_SPIRAL_YEAR, type SpiralYearStrings } from "../../core/strings-spiral-year.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { dayOfYear } from "../../core/calendar-grid.js";
import type { Value } from "../../core/types.js";
import { spiralYearGeometry } from "./geometry.js";

/** Opacity ramp indexed by step (up to 5). Newest/highest = most opaque. */
const OPACITY = [0.16, 0.34, 0.52, 0.72, 1] as const;
const OPACITY_3 = [0.24, 0.56, 1] as const;

export interface SpiralYearProps {
  data: readonly Value[];
  /** Cadence; inferred from length (≈52 → week, else day) when omitted. */
  cadence?: "day" | "week" | undefined;
  /** ISO date anchoring index 0 to a calendar angle. */
  startDate?: string | undefined;
  /** Opacity quantization. Default 5. */
  steps?: 3 | 5 | undefined;
  /** The 12 faint radial month ticks (default true). */
  monthTicks?: boolean | undefined;
  /** `dot` (default) or `arc` (short segments — continuous-ribbon feel). */
  mark?: "dot" | "arc" | undefined;
  size?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: SpiralYearStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

function inferCadence(n: number, explicit?: "day" | "week"): "day" | "week" {
  if (explicit) return explicit;
  return n > 0 && n <= 60 ? "week" : "day";
}

export function periodLabel(index: number, cadence: "day" | "week"): string {
  return cadence === "week" ? `week ${index + 1}` : `day ${index + 1}`;
}

export function spiralYearSummary(
  data: readonly Value[],
  opts: {
    cadence?: "day" | "week" | undefined;
    strings?: SpiralYearStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { strings = EN_SPIRAL_YEAR, format, locale } = opts;
  const fmt = makeFormatter(format, locale);
  const cadence = inferCadence(data.length, opts.cadence);
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
  return strings.spiralYear(
    finite.length,
    cadence,
    fmt(peak.v),
    periodLabel(peak.index, cadence),
    periodLabel(low.index, cadence),
  );
}

export function SpiralYear(props: SpiralYearProps): ReactNode {
  const {
    data,
    cadence: cadenceProp,
    startDate,
    steps = 5,
    monthTicks = true,
    mark = "dot",
    size = 24,
    color,
    format,
    locale,
    strings = EN_SPIRAL_YEAR,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const cadence = inferCadence(data.length, cadenceProp);
  const doy = startDate ? dayOfYear(startDate) : null;
  const startIndex = doy === null ? 0 : cadence === "week" ? Math.floor(doy / 7) : doy;

  const geo = spiralYearGeometry({
    values: data,
    size,
    steps,
    cadence,
    startIndex,
    pad: PAD,
    mark,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? spiralYearSummary(data, { cadence: cadenceProp, strings, format, locale }));
  const ramp = steps === 3 ? OPACITY_3 : OPACITY;
  const isArc = mark === "arc";

  return (
    <Chart
      width={geo.size}
      height={geo.size}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-spiral ${className}` : "mc-spiral"}
      style={style}
    >
      {monthTicks && geo.monthTicksPath ? (
        <path
          d={geo.monthTicksPath}
          data-mc-ink="muted"
          data-mc-w="hair"
          style={{ strokeOpacity: 0.5 }}
        />
      ) : null}
      {geo.stepPaths.map((d, step) =>
        d ? (
          <path
            key={`s${ramp[step]}`}
            d={d}
            data-mc-ink={isArc ? "data" : "bar"}
            data-mc-w={isArc ? "support" : undefined}
            style={
              isArc
                ? { ...(color ? { stroke: color } : null), strokeOpacity: ramp[step] }
                : { ...(color ? { fill: color } : null), fillOpacity: ramp[step] }
            }
          />
        ) : null,
      )}
      {children}
    </Chart>
  );
}
