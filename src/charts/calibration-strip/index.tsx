// <CalibrationStrip> — when a model says 70%, does it happen 70% of the time,
// and where is there enough data to even ask. Static,
// hook-free, RSC-safe. Predicted × observed against the identity diagonal, with
// an always-on support lane; low-support bins render open + faded so tiny bins
// never look authoritative. No single-number calibration score is ever shown.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_CALIBRATION, type CalibrationStrings } from "../../core/strings-calibration.js";
import {
  calibrationGeometry,
  isBinned,
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
  variant?: "dots" | "bars" | undefined;
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

function defaultMinSupport(data: readonly CalibrationStripDatum[]): number {
  const total = isBinned(data)
    ? data.reduce((s, r) => s + (Number.isFinite(r.count) ? r.count : 0), 0)
    : data.length;
  return Math.max(10, Math.round(total * 0.02));
}

export function CalibrationStrip(props: CalibrationStripProps): ReactNode {
  const {
    data,
    bins = 10,
    minSupport,
    variant = "dots",
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
  const ms = minSupport ?? defaultMinSupport(data);
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
      className={className ? `mc-calib ${className}` : "mc-calib"}
      style={style}
    >
      {/* support lane — flat siblings, plain attributes (up to `bins` bars +
          `bins` points can clear the 10-element SSR hot-path threshold) */}
      {geo.supportBars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.width}
          height={b.height}
          shapeRendering="crispEdges"
          data-mc-ink="neutral"
          fillOpacity={0.35}
        />
      ))}
      {/* identity diagonal — a reference axis (a path, not a connector line) */}
      <path
        d={`M${geo.diagonal.x1} ${geo.diagonal.y1}L${geo.diagonal.x2} ${geo.diagonal.y2}`}
        data-mc-ink="muted"
        data-mc-w="tick"
        strokeDasharray="2 1.5"
        vectorEffect="non-scaling-stroke"
      />

      {variant === "bars"
        ? geo.points.map((p, i) => {
            const dy = diagY(p.predicted);
            return (
              // primary bar-mode mark (the only per-point mark in this variant) —
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
                style={{ strokeWidth: "var(--mc-stroke-width)" }}
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
                r={1.6}
                fill="none"
                stroke="var(--mc-accent)"
                strokeOpacity={0.5}
                data-mc-w="support"
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <circle key={i} cx={p.x} cy={p.y} r={1.6} data-mc-ink="accent" />
            ),
          )}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
