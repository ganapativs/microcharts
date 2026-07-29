// <StreakSpark> — the current run against the record, with run texture.
// A pass/fail sequence collapses to RUNS: ok
// runs sit low and translucent, break (fail) runs sit thin and saturated, and
// the CURRENT run is the loud accent bar at the right. The record streak wears a
// small triangle tick. Direction is encoded by height + opacity AND color, never
// color alone; the count labels are plain integers, seat-gated.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_STREAK_SPARK, type StreakSparkStrings } from "../../core/strings-streak-spark.js";
import { chartSide, round2 } from "../../core/types.js";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  streakSparkFont,
  streakSparkGeometry,
  streakSparkRoom,
  type StreakDatum,
  type StreakLabel,
  type StreakSparkGeometry,
} from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface StreakSparkProps {
  data: readonly StreakDatum[];
  /** With numeric data, `v >= threshold` passes; without it, `v > 0` passes. */
  threshold?: number | undefined;
  /** Which outcome is the streak: `"up"` (pass, default) or `"down"` (fail). */
  positive?: "up" | "down" | undefined;
  /** Count labels: the current run (`"current"`, default), the record too
   *  (`"both"`), or neither (`"none"`). Seat-gated — they drop at small sizes. */
  label?: StreakLabel | undefined;
  width?: number | undefined;
  height?: number | undefined;
  /** Tints the current (accent) bar; valence runs keep their tokens. */
  color?: string | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: StreakSparkStrings | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — current run, record streak, and how often it broke. */
export function streakSparkSummary(
  geo: StreakSparkGeometry,
  strings: StreakSparkStrings,
  fmt: (n: number) => string,
): string {
  if (geo.runs.length === 0) return strings.noData;
  const word = geo.currentOn ? strings.streakWords[0] : strings.streakWords[1];
  if (geo.breaks === 0) return strings.streakSparkUnbroken(fmt(geo.currentLen), word);
  if (geo.recordLen === 0) return strings.streakSparkAllBreak(fmt(geo.currentLen), word);
  return strings.streakSpark(fmt(geo.currentLen), word, fmt(geo.recordLen), geo.breaks);
}

const PAD = 1;
const TRIANGLE_H = 2.2;

export function StreakSpark(props: StreakSparkProps): ReactNode {
  const {
    data,
    threshold,
    positive = "up",
    label = "current",
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    color,
    title,
    summary,
    format,
    locale,
    strings = EN_STREAK_SPARK,
    id,
    className,
    style,
    children,
  } = props;

  // Everything below reads the RESOLVED box, never the prop. `Chart` clamps the
  // frame it draws, but the geometry read the raw value: `height={NaN}` shipped
  // `--mc-label-size: NaNpx`, a NaN seat and `y="NaN"` runs inside a viewBox
  // that looked perfectly valid, and `width={0}` put every run at x = -1.5.
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

  const fmt = makeFormatter(format, locale);
  const fontSize = streakSparkFont(height);
  // Reserve the label's own band before geometry (canon: gutters are reserved,
  // never measured). One font is enough even for the record run, which carries a
  // triangle tick between bar and number: runs centre inside the band below the
  // reservation, so a run's top sits at `room + (band - h) / 2` and `h` is at
  // most half the band — that centring slack (≥ band / 4) already covers the
  // tick. Reserving `fontSize + TRIANGLE_H` instead would take 51% of a default
  // 20-unit box and shrink the current run from 10 units to 4.9, turning a
  // streak chart into a number with a hairline under it.
  const labelRoom = streakSparkRoom(height, label);
  const geo = streakSparkGeometry(data, { width, height, threshold, positive, labelRoom });
  if (geo.truncated)
    devWarn(
      "<StreakSpark> more than 40 runs — the oldest collapse into an ellipsis slot; pre-aggregate or window the data.",
    );
  const accName = resolveSummary(summary, () => streakSparkSummary(geo, strings, fmt));

  const currentRun = geo.runs.find((r) => r.current);
  const recordRun = geo.runs.find((r) => r.record);
  const currentIsRecord = !!recordRun && currentRun === recordRun;

  // Count label ABOVE a bar — no text-on-mark collision. Seats only when the top
  // margin (minus any record tick) clears the floor font; clamps x into the box.
  function topLabel(
    run: { x: number; y: number; width: number },
    text: string,
    tick: number,
    key: string,
  ): ReactNode {
    const room = run.y - tick;
    if (room < fontSize) return null;
    const half = (text.length * 0.62 * fontSize) / 2;
    const cx = Math.min(Math.max(run.x + run.width / 2, PAD + half), width - PAD - half);
    return (
      <text
        key={key}
        x={round2(cx)}
        y={round2(run.y - tick - fontSize * 0.22 - 0.3)}
        fontSize={fontSize}
        textAnchor="middle"
        data-mc-ink="label"
      >
        {text}
      </text>
    );
  }

  let triangle: ReactNode = null;
  if (recordRun) {
    const cx = recordRun.x + recordRun.width / 2;
    const bw = Math.min(1.6, cx, width - cx);
    const top = recordRun.y;
    const tTop = round2(Math.max(0, top - TRIANGLE_H));
    triangle = (
      <path
        d={`M${round2(cx - bw)} ${tTop} L${round2(cx + bw)} ${tTop} L${round2(cx)} ${round2(top)} Z`}
        data-mc-ink="point"
      />
    );
  }

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = { ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Runs are a midline-anchored lane — heights encode run TYPE, so the band's
      // bottom carries no meaning to stand on. It must be the run band and not the
      // box: `label` reserves room off the top, which moves the midline the runs
      // centre on, and seating the viewBox would ride that reservation.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={className ? `mc-streak ${className}` : "mc-streak"}
      style={rootStyle}
    >
      {geo.ellipsis ? (
        <rect
          x={geo.ellipsis.x}
          y={geo.ellipsis.y}
          width={geo.ellipsis.width}
          height={geo.ellipsis.height}
          data-mc-ink="gap"
          shapeRendering="crispEdges"
        />
      ) : null}
      {geo.runs.map((run) => {
        const ink = run.current ? "accent" : run.on ? "positive" : "negative";
        return (
          <rect
            key={run.index}
            x={run.x}
            y={run.y}
            width={run.width}
            height={run.height}
            data-mc-ink={ink}
            fillOpacity={run.current ? undefined : run.on ? 0.45 : 0.8}
            shapeRendering="crispEdges"
            style={color && run.current ? { fill: color } : undefined}
          />
        );
      })}
      {triangle}
      {label !== "none" && currentRun
        ? topLabel(currentRun, fmt(currentRun.len), currentIsRecord ? TRIANGLE_H : 0, "cur")
        : null}
      {label === "both" && recordRun && !currentIsRecord
        ? topLabel(recordRun, fmt(recordRun.len), TRIANGLE_H, "rec")
        : null}
      {children}
    </Chart>
  );
}
