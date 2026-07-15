// <Hourglass> — how much time is gone AND how much remains, the two-sided story
// Progress can't tell. Sand area splits top (remaining) /
// bottom (elapsed), both AREA-TRUE. The stream is a binary "running" state mark,
// only while 0<value<1 — never animated in the static entry. Static, hook-free.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_HOURGLASS, type HourglassStrings } from "../../core/strings-hourglass.js";
import { hourglassGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

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
  // The glass box tracks height so the instrument keeps a natural hourglass
  // proportion at ANY size — a fixed width made tall demos read as a thin sliver.
  const boxW = props.width ?? Math.max(12, Math.round(height * 0.66));
  const width = boxW + gutter;

  const geo = hourglassGeometry({ value, width: boxW, height, pad: PAD });
  const accName = resolveSummary(summary, () => hourglassSummary(value, strings));

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
      {/* glass — a faint filled silhouette gives the instrument body */}
      <path d={geo.frame} data-mc-ink="fill" />
      {/* top sand — remaining (warm, lighter). The `mc-hourglass-sand` class
          scopes the interactive value cross-fade to the sand alone, so the
          static glass frame + outline never flicker on a tick. */}
      {geo.topSand ? (
        <path
          className="mc-hourglass-sand"
          d={geo.topSand}
          style={{ fill: color ?? "var(--mc-moon)", fillOpacity: 0.5 }}
        />
      ) : null}
      {/* bottom sand — elapsed (warm, full) */}
      {geo.bottomSand ? (
        <path
          className="mc-hourglass-sand"
          d={geo.bottomSand}
          style={{ fill: color ?? "var(--mc-moon)" }}
        />
      ) : null}
      {/* glass outline over the sand */}
      <path d={geo.frame} data-mc-ink="muted" style={{ fill: "none", strokeOpacity: 0.7 }} />
      {/* frame end-cap plates */}
      {geo.caps.map((c) => (
        <rect
          key={`cap${c.y}`}
          x={c.x}
          y={c.y}
          width={c.width}
          height={c.height}
          rx={c.r}
          data-mc-ink="neutral"
        />
      ))}
      {/* running-sand cue — a state mark, only while 0<value<1. `stroke` is
          dynamic (color override), so it stays inline; width is the role
          (orthogonal to ink), not a literal. */}
      {stream && geo.stream ? (
        <line
          x1={geo.stream.x}
          y1={geo.stream.y1}
          x2={geo.stream.x}
          y2={geo.stream.y2}
          data-mc-w="support"
          style={{ stroke: color ?? "var(--mc-moon)", strokeLinecap: "round" }}
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
