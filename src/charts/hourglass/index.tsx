// <Hourglass> — how much time is gone AND how much remains, the two-sided story
// Progress can't tell. Sand area splits top (remaining) /
// bottom (elapsed). both AREA-TRUE. The stream is a binary "running" state mark,
// only while 0<value<1 — never animated in the static entry.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makePercentFormatter } from "../../core/format.js";
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
  locale?: string | string[] | undefined;
  strings?: HourglassStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

/**
 * A whole percent as rendered text — a real `Intl` percent, not `${n}%`, which is
 * an en-US percent (fr-FR wants a NBSP before the sign, tr-TR puts the sign
 * first). Takes the WHOLE percent rather than the fraction so elapsed and
 * remaining are rounded once and still sum to 100.
 *
 * `locale` comes from the chart's own prop, so a server render and its client
 * hydration produce the same string instead of each resolving its host default.
 * Trailing and optional: callers that never localized keep compiling. Exported
 * so the interactive entry's hover chip reads the SAME string the `label`
 * numeral prints.
 */
export function hourglassPct(whole: number, locale?: string | string[] | undefined): string {
  return makePercentFormatter(locale)(whole / 100);
}

export function hourglassSummary(
  value: number,
  strings: HourglassStrings = EN_HOURGLASS,
  locale?: string | string[] | undefined,
): string {
  const e = Math.round((Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0) * 100);
  return strings.hourglass(hourglassPct(e, locale), hourglassPct(100 - e, locale));
}

export function Hourglass(props: HourglassProps): ReactNode {
  const {
    value,
    stream = true,
    label = "none",
    color,
    height = 24,
    fontSize = 8,
    locale,
    strings = EN_HOURGLASS,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const e = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const pct = hourglassPct(
    label === "remaining" ? 100 - Math.round(e * 100) : Math.round(e * 100),
    locale,
  );
  const showLabel = label !== "none";
  // 0.72 em/char (not 0.62): the % glyph is wide and under-reserves at 0.62.
  // Measured off the FORMATTED string, so a locale that adds a NBSP before the
  // sign widens the gutter with it instead of spilling the numeral onto the page.
  const gutter = showLabel ? Math.ceil(pct.length * 0.72 * fontSize + 3) : 0;
  // The glass box tracks height so the instrument keeps a natural hourglass
  // proportion at ANY size — a fixed width made tall demos read as a thin sliver.
  const boxW = props.width ?? Math.max(12, Math.round(height * 0.66));
  const width = boxW + gutter;

  const geo = hourglassGeometry({ value, width: boxW, height, pad: PAD });
  const accName = resolveSummary(summary, () => hourglassSummary(value, strings, locale));

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Both chambers carry data — elapsed piles up from the base, remaining
      // hangs from the neck — so the bottom cap is frame chrome, not an
      // encoding floor, and the instrument centres on the cap band like the
      // other glyphs. The box is the cap plates, the one part `value` can't move.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={className ? `mc-hourglass ${className}` : "mc-hourglass"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      <path d={geo.frame} data-mc-ink="fill" />
      {/* Top sand (remaining). .mc-hourglass-sand scopes interactive fade. */}
      {geo.topSand ? (
        <path
          className="mc-hourglass-sand"
          d={geo.topSand}
          style={{ fill: color ?? "var(--mc-moon)", fillOpacity: 0.5 }}
        />
      ) : null}
      {geo.bottomSand ? (
        <path
          className="mc-hourglass-sand"
          d={geo.bottomSand}
          style={{ fill: color ?? "var(--mc-moon)" }}
        />
      ) : null}
      <path d={geo.frame} data-mc-ink="muted" style={{ fill: "none", strokeOpacity: 0.7 }} />
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
      {/* Stream cue while running; inline stroke for color override. */}
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
          {pct}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
