// <PhaseTrace> — how two coupled signals move together: loops (lag/feedback).
// clusters (regimes). and where the system is now.
// Path order carries time; the current state is a
// directed endpoint. Axes are named and stated, domains always linear.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { resolveSummary } from "../../core/summary.js";
import { EN_PHASE_TRACE, type PhaseTraceStrings } from "../../core/strings-phase-trace.js";
import { chartSide, isFiniteValue } from "../../core/types.js";
import {
  DEFAULT_HEIGHT,
  DEFAULT_TAIL,
  DEFAULT_WIDTH,
  phaseTraceGeometry,
  type Heading,
  type Pt,
} from "./geometry.js";

export type PhaseTraceDatum = Pt;

export interface PhaseTraceProps {
  data: readonly PhaseTraceDatum[];
  xLabel?: string | undefined;
  yLabel?: string | undefined;
  xDomain?: readonly [number, number] | undefined;
  domain?: readonly [number, number] | undefined;
  /** Fraction of points drawn in accent — the "recent motion" read. */
  tail?: number | undefined;
  /** Anchors the path's origin for full-journey reads. */
  startDot?: boolean | undefined;
  /** Center hairlines splitting the plane into quadrants. */
  grid?: boolean | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: PhaseTraceStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
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
    domain,
    tail = DEFAULT_TAIL,
    startDot = false,
    grid = false,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
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

  // One resolved box for the frame, the marks and the grid — geometry rejects
  // the same non-finite props against the same defaults, so the viewBox and
  // what is drawn inside it can never describe two different boxes.
  const w = chartSide(width, DEFAULT_WIDTH);
  const h = chartSide(height, DEFAULT_HEIGHT);
  const fmt = makeFormatter(format, locale);
  const geo = phaseTraceGeometry({ data, xDomain, yDomain: domain, tail, width: w, height: h });
  const accName = resolveSummary(summary, () =>
    phaseTraceSummary(data, xLabel, yLabel, geo.heading, strings, fmt),
  );

  return (
    <Chart
      width={w}
      height={h}
      title={title}
      summary={accName}
      id={id}
      // The trajectory fills a plane whose bottom edge IS the y-domain's minimum,
      // so it stands on that edge the way any fitted-domain trace does. Centring
      // would sink half of a 32-unit plane below the baseline for no gain.
      seat={{ mode: "floor", bottom: geo.y1 }}
      className={className ? `mc-phase ${className}` : "mc-phase"}
      style={style}
    >
      {/* Quadrant hairlines, spelled like QuadrantDot's split cross: the muted
          ink role carries the neutral, so High Contrast Mode remaps it instead
          of preserving a fixed warm gray against the user's own background. */}
      {grid ? (
        <path
          d={`M${w / 2} 1V${h - 1}M1 ${h / 2}H${w - 1}`}
          data-mc-ink="muted"
          data-mc-w="hair"
          fill="none"
          strokeOpacity={0.18}
        />
      ) : null}
      {geo.trailPath ? (
        <path
          d={geo.trailPath}
          data-mc-ink="muted"
          data-mc-w="full"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      {geo.tailPath ? (
        <path
          d={geo.tailPath}
          data-mc-ink="accent"
          fill="none"
          stroke="var(--mc-accent)"
          strokeLinejoin="round"
          strokeLinecap="round"
          data-mc-w="heavy"
        />
      ) : null}
      {/* A filled neutral dot, so it takes the FILLED neutral role rather than
          the stroked muted one it had to override inline — an inline fill wins
          over the forced-colors mapping and painted #8a8986 verbatim there. */}
      {startDot && geo.start ? (
        <circle cx={geo.start.x} cy={geo.start.y} r={1.3} data-mc-ink="neutral" />
      ) : null}
      {geo.arrow ? (
        <path
          d={geo.arrow}
          data-mc-ink="flag"
          fill="none"
          stroke="var(--mc-accent)"
          strokeLinecap="round"
          data-mc-w="full"
        />
      ) : null}
      {/* "Now": the same flag role the arrowhead carries, so the accent comes
          from the ink role and maps to the system Highlight in forced colors. */}
      {geo.end ? <circle cx={geo.end.x} cy={geo.end.y} r={1.6} data-mc-ink="flag" /> : null}
      {children}
    </Chart>
  );
}
