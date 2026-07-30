// <CalibrationStrip> — when a model says 70%, does it happen 70% of the time,
// and where is there enough data to even ask.
// Predicted × observed against the identity diagonal, with
// an always-on support lane; low-support bins render open + faded so tiny bins
// never look authoritative. No single-number calibration score is ever shown.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { round2 } from "../../core/types.js";
import { EN_CALIBRATION, type CalibrationStrings } from "../../core/strings-calibration.js";
import {
  calibrationGeometry,
  resolveMinSupport,
  supportPath,
  DOT_R,
  PAD,
  type BinnedRow,
  type CalibrationPoint,
  type RawPair,
} from "./geometry.js";

export type CalibrationStripDatum = RawPair | BinnedRow;

export interface CalibrationStripProps {
  data: readonly CalibrationStripDatum[];
  /** Uniform bin count for raw input. */
  bins?: number | undefined;
  /** Below this a bin is low-confidence (open + faded). Default max(10, 2%). */
  minSupport?: number | undefined;
  /** `"bars"` draws signed deviation columns from the diagonal.
   * */
  mode?: "dots" | "bars" | undefined;
  color?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: CalibrationStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — the largest gap and the count of low-support bins. */
export function calibrationSummary(
  points: readonly CalibrationPoint[],
  maxGap: { predicted: number; observed: number } | null,
  strings: CalibrationStrings,
  fmt: (n: number) => string,
): string {
  if (points.length === 0 || !maxGap) return strings.noData;
  const low = points.filter((p) => p.lowSupport).length;
  const gap = Math.abs(maxGap.observed - maxGap.predicted);
  if (gap < 0.05 && low === 0) return strings.calibrationGood(points.length);
  return strings.calibration(points.length, fmt(maxGap.predicted), fmt(maxGap.observed), low);
}

export function CalibrationStrip(props: CalibrationStripProps): ReactNode {
  const {
    data,
    bins = 10,
    minSupport,
    mode = "dots",
    color,
    width = 100,
    height = 32,
    format,
    locale,
    strings = EN_CALIBRATION,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const ms = resolveMinSupport(data, minSupport);
  const supportHeight = Math.max(4, Math.round(height * 0.18));
  const geo = calibrationGeometry({ data, bins, minSupport: ms, width, height, supportHeight });
  const accName =
    summary === false
      ? false
      : (summary ?? calibrationSummary(geo.points, geo.maxGap, strings, fmt));
  const diagY = (p: number) => geo.diagonal.y1 + (geo.diagonal.y2 - geo.diagonal.y1) * p;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Both lanes have a real bottom: observed = 0 is a true zero for the
      // scatter, and the support counts below it are zero-anchored columns. The
      // lowest of those is the mark's floor, so the strip stands on the text
      // baseline. The lane is always on, so this holds for every input.
      seat={{ mode: "floor", bottom: height - PAD }}
      className={className ? `mc-calib ${className}` : "mc-calib"}
      style={style}
    >
      {/* support lane — one path, one node, whatever `bins` is (see supportPath) */}
      {geo.supportBars.length > 0 ? (
        <path
          d={supportPath(geo.supportBars)}
          shapeRendering="crispEdges"
          data-mc-ink="neutral"
          fillOpacity={0.35}
        />
      ) : null}

      <path
        d={`M${geo.diagonal.x1} ${geo.diagonal.y1}L${geo.diagonal.x2} ${geo.diagonal.y2}`}
        data-mc-ink="muted"
        data-mc-w="tick"
        strokeDasharray="2 1.5"
        vectorEffect="non-scaling-stroke"
      />

      {mode === "bars"
        ? geo.points.map((p, i) => {
            const dy = diagY(p.predicted);
            return (
              // primary bar-mode mark (the only per-point mark in this mode) —
              // inherits full --mc-stroke-width rather than a width role, which
              // is reserved for secondary/decorative strokes
              <line
                key={i}
                x1={p.x}
                x2={p.x}
                y1={round2(dy)}
                y2={p.y}
                data-mc-ink="accent"
                strokeOpacity={p.lowSupport ? 0.4 : 1}
                style={{
                  strokeWidth: "var(--mc-sw)",
                  ...(color ? { stroke: color } : null),
                }}
                vectorEffect="non-scaling-stroke"
              />
            );
          })
        : geo.points.map((p, i) =>
            p.lowSupport ? (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={DOT_R}
                fill="none"
                // `data` is the hollow role, and its stroke loses to the inline
                // one — so this changes no paint and puts the low-support point
                // in the data-change transition alongside its confident
                // siblings, which already carry a role.
                data-mc-ink="data"
                style={{ stroke: color ?? "var(--mc-accent)" }}
                strokeOpacity={0.5}
                data-mc-w="support"
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={DOT_R}
                data-mc-ink="accent"
                style={color ? { fill: color } : undefined}
              />
            ),
          )}
      {children}
    </Chart>
  );
}
