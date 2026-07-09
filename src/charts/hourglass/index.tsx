// <Hourglass> — how much time is gone AND how much remains, the two-sided story
// Progress can't tell (plan/24 #7, S4). Sand area splits top (remaining) /
// bottom (elapsed), both AREA-TRUE. The stream is a binary "running" state mark,
// only while 0<value<1 — never animated in the static entry. Static, hook-free.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_HOURGLASS, type HourglassStrings } from "../../core/strings-hourglass.js";
import { hourglassGeometry } from "./geometry.js";

export interface HourglassProps {
  /** Elapsed fraction 0–1 (consistent with Progress; clamped). */
  value: number;
  /** The running-sand cue (default true). */
  stream?: boolean | undefined;
  /** Print the percent that matters to the context. */
  label?: "none" | "remaining" | "elapsed" | undefined;
  /** Override the elapsed-sand color (default --mc-stroke). */
  color?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  fontSize?: number | undefined;
  strings?: HourglassStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

export function hourglassSummary(value: number, strings: HourglassStrings = EN_HOURGLASS): string {
  const e = Math.round((Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0) * 100);
  return strings.hourglass(`${e}%`, `${100 - e}%`);
}

export function Hourglass(props: HourglassProps): ReactNode {
  const {
    value,
    stream = true,
    label = "none",
    color,
    height = 24,
    fontSize = 8,
    strings = EN_HOURGLASS,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const e = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const pct = label === "remaining" ? 100 - Math.round(e * 100) : Math.round(e * 100);
  const showLabel = label !== "none";
  // 0.72 em/char (not 0.62): the % glyph is wide and under-reserves at 0.62
  const gutter = showLabel ? Math.ceil(`${pct}%`.length * 0.72 * fontSize + 3) : 0;
  const boxW = props.width ?? 16;
  const width = boxW + gutter;

  const geo = hourglassGeometry({ value, width: boxW, height, pad: PAD });
  const accName = summary === false ? false : (summary ?? hourglassSummary(value, strings));

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-hourglass ${className}` : "mc-hourglass"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {/* top sand — remaining (muted) */}
      {geo.topSand ? <path d={geo.topSand} data-mc-ink="neutral" /> : null}
      {/* bottom sand — elapsed; dynamic color → inline */}
      {geo.bottomSand ? (
        <path d={geo.bottomSand} style={{ fill: color ?? "var(--mc-stroke)" }} />
      ) : null}
      {/* frame — two hairline triangles meeting at the neck */}
      <path d={geo.frame} data-mc-ink="muted" style={{ fill: "none", strokeOpacity: 0.7 }} />
      {/* running-sand cue — a state mark, only while 0<value<1 */}
      {stream && geo.stream ? (
        <line
          x1={geo.stream.x}
          y1={geo.stream.y1}
          x2={geo.stream.x}
          y2={geo.stream.y2}
          data-mc-ink="muted"
          style={{ strokeWidth: 0.75 }}
        />
      ) : null}
      {showLabel ? (
        <text
          x={boxW + 2}
          y={height / 2}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="start"
          data-mc-ink="label"
        >
          {`${pct}%`}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
