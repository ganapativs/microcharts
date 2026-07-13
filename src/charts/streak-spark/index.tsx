// <StreakSpark> — the current run against the record, with run texture (
// §2). Static, hook-free, RSC-safe. A pass/fail sequence collapses to RUNS: ok
// runs sit low and translucent, break (fail) runs sit thin and saturated, and
// the CURRENT run is the loud accent bar at the right. The record streak wears a
// small triangle tick. Direction is encoded by height + opacity AND color, never
// color alone; the count labels are plain integers, seat-gated.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { labelFont } from "../../core/labels.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_STREAK_SPARK, type StreakSparkStrings } from "../../core/strings-streak-spark.js";
import { round2 } from "../../core/types.js";
import { streakSparkGeometry, type StreakDatum, type StreakSparkGeometry } from "./geometry.js";

export interface StreakSparkProps {
  data: readonly StreakDatum[];
  /** With numeric data, `v >= threshold` passes; without it, `v > 0` passes. */
  threshold?: number | undefined;
  /** Which outcome is the streak: `"up"` (pass, default) or `"down"` (fail). */
  positive?: "up" | "down" | undefined;
  /** Count labels: the current run (`"current"`, default), the record too
   *  (`"both"`), or neither (`"none"`). Seat-gated — they drop at small sizes. */
  label?: "current" | "both" | "none" | undefined;
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
    width = 96,
    height = 20,
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

  const fmt = makeFormatter(format, locale);
  const geo = streakSparkGeometry(data, { width, height, threshold, positive });
  if (geo.truncated)
    devWarn(
      "<StreakSpark> more than 40 runs — the oldest collapse into an ellipsis slot; pre-aggregate or window the data.",
    );
  const accName = summary === false ? false : (summary ?? streakSparkSummary(geo, strings, fmt));

  const fontSize = labelFont(height, 0.4);
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

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-streak ${className}` : "mc-streak"}
      style={style}
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
