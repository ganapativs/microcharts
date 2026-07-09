// <CometTrail> — where is the value now, and where has it just been? (plan/24 #21,
// S1 rolling window, motion type). The STATIC frame is a decaying dot-sparkline
// with zero JS: a fading trail of recent points + a bright head dot at the current
// value + the now-value numeral. Opacity encodes AGE only; the y position does
// value, so `trail` length is context, never data. The interactive entry eases
// the head to each new value and decays the old head into the trail (motion only
// on data change — no idle loop). Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_COMET_TRAIL, type CometTrailStrings } from "../../core/strings-comet-trail.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { cometTrailGeometry } from "./geometry.js";

export interface CometTrailProps {
  /** The rolling window, oldest → newest (last = now). */
  data: readonly number[];
  /** Points kept visible in the trail. Default 12 (cap 20). */
  trail?: number | undefined;
  /** Numeral after the head (`last`, default) or none. */
  label?: "last" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: CometTrailStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

export function cometTrailSummary(
  data: readonly number[],
  opts: {
    trail?: number | undefined;
    strings?: CometTrailStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { trail = 12, strings = EN_COMET_TRAIL, format, locale } = opts;
  const geo = cometTrailGeometry({ values: data, width: 60, height: 16, trail, pad: PAD });
  if (geo.count === 0) return strings.noData;
  const fmt = makeFormatter(format, locale);
  if (geo.count === 1) return strings.cometTrailNow(fmt(geo.last));
  return strings.cometTrail(fmt(geo.last), strings.cometTrends[geo.trend + 1]!, geo.count - 1);
}

export function CometTrail(props: CometTrailProps): ReactNode {
  const {
    data,
    trail = 12,
    label = "last",
    domain,
    width = 60,
    height = 16,
    color,
    format,
    locale,
    strings = EN_COMET_TRAIL,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  const fontSize = props.fontSize ?? labelFont(height);

  const labelBand = label === "last" ? fontSize * 3 : 0;
  const geo = cometTrailGeometry({
    values: data,
    width: width - labelBand,
    height,
    domain,
    trail,
    pad: PAD,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? cometTrailSummary(data, { trail, strings, format, locale }));
  const headFill = color ?? "var(--mc-accent)";
  const fmt = makeFormatter(format, locale);

  return (
    <Chart
      width={width}
      height={geo.height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-comet ${className}` : "mc-comet"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {/* trail — opacity encodes age (never value) */}
      {geo.trail.map((t) => (
        <circle
          key={`t${t.index}`}
          cx={t.cx}
          cy={t.cy}
          r={t.r}
          data-mc-ink="point"
          style={{ fillOpacity: t.opacity }}
        />
      ))}
      {/* head — the current value */}
      {geo.head ? (
        <circle
          className="mc-comet-head"
          cx={geo.head.cx}
          cy={geo.head.cy}
          r={geo.head.r}
          style={{ fill: headFill }}
        />
      ) : null}
      {label === "last" && geo.head && Number.isFinite(geo.last) ? (
        <text
          x={geo.labelX}
          y={Math.min(
            Math.max(geo.head.cy + fontSize * 0.34, fontSize),
            geo.height - fontSize * 0.3,
          )}
          fontSize={fontSize}
          textAnchor="start"
          data-mc-ink="label"
        >
          {fmt(geo.last)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
