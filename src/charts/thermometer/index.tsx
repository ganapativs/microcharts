// <Thermometer> — where a value sits on a calibrated range, and how close to a
// goal (plan/24 #5, S4). A linear ticked tube; fill anchors at domain[0], never
// re-zeroed or log — the ticks calibrate the read. The bulb is instrument chrome
// (always full), never data. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_THERMOMETER, type ThermometerStrings } from "../../core/strings-thermometer.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import { thermometerGeometry, type Orientation } from "./geometry.js";

export interface ThermometerProps {
  value: number;
  /** Goal tick (the fundraising story). */
  target?: number | undefined;
  /** Tick count (even over domain) or explicit values. Default 5. */
  ticks?: number | readonly number[] | undefined;
  orientation?: Orientation | undefined;
  /** Draw the bulb reservoir (default true). */
  bulb?: boolean | undefined;
  /** Calibrated range. Default [0, 100] — a stated range, never auto-fit. */
  domain?: readonly [number, number] | undefined;
  /** Print the value numeral at the fill line. */
  label?: "none" | "value" | undefined;
  /** Override the fill/bulb color (default --mc-accent). */
  color?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: ThermometerStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 2;

export function thermometerSummary(
  value: number,
  opts: {
    domain?: readonly [number, number] | undefined;
    target?: number | undefined;
    strings?: ThermometerStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { domain = [0, 100], target, strings = EN_THERMOMETER, format, locale } = opts;
  if (!isFiniteValue(value)) return strings.noData;
  const fmt = makeFormatter(format, locale);
  const [lo, hi] = [fmt(domain[0]), fmt(domain[1])];
  return isFiniteValue(target)
    ? strings.thermometerTarget(fmt(value), lo, hi, fmt(target))
    : strings.thermometer(fmt(value), lo, hi);
}

export function Thermometer(props: ThermometerProps): ReactNode {
  const {
    value,
    target,
    ticks = 5,
    orientation = "vertical",
    bulb = true,
    domain = [0, 100],
    label = "none",
    color,
    fontSize = 8,
    format,
    locale,
    strings = EN_THERMOMETER,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const vertical = orientation === "vertical";
  const showLabel = label === "value" && isFiniteValue(value);
  const gutter = showLabel
    ? Math.ceil(`${makeFormatter(format, locale)(value)}`.length * 0.62 * fontSize + 2)
    : 0;
  const width = props.width ?? (vertical ? 16 + gutter : 48);
  const height = props.height ?? (vertical ? 48 : 16 + gutter);
  // the tube uses the base box; the gutter is reserved outside it
  const boxW = vertical ? width - gutter : width;
  const boxH = vertical ? height : height - gutter;

  const geo = thermometerGeometry({
    value,
    domain,
    target,
    ticks,
    width: boxW,
    height: boxH,
    orientation,
    bulb,
    pad: PAD,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? thermometerSummary(value, { domain, target, strings, format, locale }));
  const paint = color ?? "var(--mc-accent)";

  const labelPos = showLabel
    ? vertical
      ? { x: boxW + 1, y: geo.fillEdge, anchor: "start" as const }
      : { x: geo.fillEdge, y: boxH + fontSize * 0.9, anchor: "middle" as const }
    : null;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-thermo ${className}` : "mc-thermo"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {/* bulb reservoir — always full; dynamic color → inline */}
      {geo.bulb ? (
        <circle
          cx={geo.bulb.cx}
          cy={geo.bulb.cy}
          r={geo.bulb.r}
          style={{ fill: paint, stroke: "var(--mc-neutral)", strokeWidth: 0.5 }}
        />
      ) : null}
      {/* fill column — width == tube inner width, so no clip is needed */}
      <rect
        x={geo.fill.x}
        y={geo.fill.y}
        width={geo.fill.width}
        height={geo.fill.height}
        shapeRendering="crispEdges"
        style={{ fill: paint }}
      />
      {/* tube outline — instrument chrome, drawn over the fill */}
      <path d={geo.tube} data-mc-ink="muted" style={{ strokeOpacity: 0.55, fill: "none" }} />
      {/* calibration ticks */}
      {geo.tickLines.length ? (
        <path
          d={geo.tickLines.map((t) => `M${t.x1} ${t.y1}L${t.x2} ${t.y2}`).join("")}
          data-mc-ink="muted"
          style={{ strokeOpacity: 0.7 }}
        />
      ) : null}
      {/* target line — across the tube (distinct shape), accent via the flag role */}
      {geo.targetTick ? (
        <line
          x1={geo.targetTick.x1}
          y1={geo.targetTick.y1}
          x2={geo.targetTick.x2}
          y2={geo.targetTick.y2}
          data-mc-ink="flag"
          style={{ strokeWidth: 1.25 }}
        />
      ) : null}
      {labelPos ? (
        <text
          x={labelPos.x}
          y={labelPos.y}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor={labelPos.anchor}
          data-mc-ink="label"
        >
          {makeFormatter(format, locale)(value)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
