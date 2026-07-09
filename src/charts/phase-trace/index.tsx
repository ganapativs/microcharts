// <PhaseTrace> — how two coupled signals move together: loops (lag/feedback),
// clusters (regimes), and where the system is now (plan/25 §17, plan/17 F16).
// Static, hook-free, RSC-safe. Path order carries time; the current state is a
// directed endpoint. Axes are named and stated, domains always linear.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { EN_PHASE_TRACE, type PhaseTraceStrings } from "../../core/strings-phase-trace.js";
import { isFiniteValue } from "../../core/types.js";
import { phaseTraceGeometry, type Heading, type Pt } from "./geometry.js";

export type PhaseTraceDatum = Pt;

export interface PhaseTraceProps {
  data: readonly PhaseTraceDatum[];
  xLabel?: string | undefined;
  yLabel?: string | undefined;
  xDomain?: [number, number] | undefined;
  yDomain?: [number, number] | undefined;
  /** Fraction of points drawn in accent — the "recent motion" read. */
  tail?: number | undefined;
  /** Anchors the path's origin for full-journey reads. */
  startDot?: boolean | undefined;
  /** Center hairlines splitting the plane into quadrants. */
  grid?: boolean | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: PhaseTraceStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

function extent(vals: number[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of vals) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo)) return [0, 1];
  if (lo === hi) return [lo - 1, hi + 1];
  return [lo, hi];
}

/** Shared summary — the current point + heading (named axes). */
export function phaseTraceSummary(
  data: readonly PhaseTraceDatum[],
  xLabel: string,
  yLabel: string,
  heading: Heading,
  strings: PhaseTraceStrings,
  fmt: (n: number) => string,
): string {
  let last: Pt | null = null;
  for (const p of data) if (isFiniteValue(p.x) && isFiniteValue(p.y)) last = p;
  if (!last) return strings.noData;
  return strings.phaseTrace(
    yLabel,
    xLabel,
    fmt(last.x),
    fmt(last.y),
    strings.phaseHeadings[heading],
  );
}

export function PhaseTrace(props: PhaseTraceProps): ReactNode {
  const {
    data,
    xLabel = "x",
    yLabel = "y",
    xDomain,
    yDomain,
    tail = 0.25,
    startDot = false,
    grid = false,
    width = 40,
    height = 32,
    format,
    locale,
    strings = EN_PHASE_TRACE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (title && (props.xLabel == null || props.yLabel == null))
    devWarn("<PhaseTrace> axes unnamed — pass xLabel/yLabel so the summary can read them.");

  const finite = data.filter((p) => isFiniteValue(p.x) && isFiniteValue(p.y));
  const xd = xDomain ?? extent(finite.map((p) => p.x));
  const yd = yDomain ?? extent(finite.map((p) => p.y));
  const fmt = makeFormatter(format, locale);
  const geo = phaseTraceGeometry({ data, xDomain: xd, yDomain: yd, tail, width, height });
  const accName =
    summary === false
      ? false
      : (summary ?? phaseTraceSummary(data, xLabel, yLabel, geo.heading, strings, fmt));

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-phase ${className}` : "mc-phase"}
      style={style}
    >
      {grid ? (
        <path
          d={`M${width / 2} 1V${height - 1}M1 ${height / 2}H${width - 1}`}
          fill="none"
          stroke="var(--mc-neutral)"
          strokeOpacity={0.18}
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.trailPath ? (
        <path
          d={geo.trailPath}
          data-mc-ink="muted"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ strokeWidth: "var(--mc-stroke-width)" }}
        />
      ) : null}
      {geo.tailPath ? (
        <path
          d={geo.tailPath}
          fill="none"
          stroke="var(--mc-accent)"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ strokeWidth: "calc(var(--mc-stroke-width) * 1.2)" }}
        />
      ) : null}
      {startDot && geo.start ? (
        <circle
          cx={geo.start.x}
          cy={geo.start.y}
          r={1.3}
          data-mc-ink="muted"
          style={{ fill: "var(--mc-neutral)", stroke: "none" }}
        />
      ) : null}
      {geo.arrow ? (
        <path
          d={geo.arrow}
          fill="none"
          stroke="var(--mc-accent)"
          strokeLinecap="round"
          style={{ strokeWidth: "calc(var(--mc-stroke-width) * 1.1)" }}
        />
      ) : null}
      {geo.end ? <circle cx={geo.end.x} cy={geo.end.y} r={1.6} fill="var(--mc-accent)" /> : null}
      {children}
    </Chart>
  );
}
