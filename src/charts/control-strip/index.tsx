// <ControlStrip> — is the process in control, or did something leave the band?
// (plan/23 #10). A Shewhart individuals control chart: the band is center ± 3σ̂
// (σ̂ = mean moving range / 1.128, stated — never a vague "±3 sigma"). Static,
// hook-free, RSC-safe. In-control points are bare vertices; only out-of-control
// points are marked (ringed, negative — the ring is a shape cue, not
// color-alone). An in-control process should look boring.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_CONTROL, type ControlStrings } from "../../core/strings-control.js";
import {
  controlGeometry,
  type ControlGeometry,
  type ControlLimits,
  type ControlRules,
} from "./geometry.js";

/** Factual control summary. Shared with the interactive entry. */
export function controlSummary(
  geo: ControlGeometry,
  fmt: (n: number) => string,
  strings: ControlStrings,
): string {
  const k = geo.points.filter((p) => p.out).length;
  const c = fmt(geo.center.value);
  const lo = fmt(geo.band.lo);
  const hi = fmt(geo.band.hi);
  const body =
    k > 0 ? strings.control(k, geo.n, c, lo, hi) : strings.controlInControl(geo.n, c, lo, hi);
  return geo.reliable ? body : body + strings.controlProvisional(geo.n);
}

export interface ControlStripProps {
  /** Sequential process measurements. */
  data: readonly number[];
  /** ±3σ̂ (default) or empirical p0.135/p99.865 for skewed processes. */
  limits?: ControlLimits | undefined;
  /** Known process center from a reference period (else = mean of data). */
  baseline?: number | undefined;
  /** Western Electric secondary run rules (WE-1/2/4 subset). */
  rules?: ControlRules | undefined;
  /** `"out"` (default) marks only out-of-control points; `"all"` marks every point. */
  dots?: "out" | "all" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: ControlStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function ControlStrip(props: ControlStripProps): ReactNode {
  const {
    data,
    limits = "sigma",
    baseline,
    rules = "none",
    dots = "out",
    domain,
    width = 80,
    height = 16,
    color,
    format,
    locale,
    strings = EN_CONTROL,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-control-strip ${className}` : "mc-control-strip";
  const geo = controlGeometry({ width, height, data, limits, baseline, rules, domain });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={summary === false ? false : (summary ?? strings.noData)}
        id={id}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = summary === false ? false : (summary ?? controlSummary(geo, fmt, strings));
  const flagIdx = new Set(geo.violations.filter((v) => v.rule !== "we1").map((v) => v.index));

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={cls}
      style={style}
    >
      {/* control band — the in-control zone; dashed when limits are provisional */}
      {geo.degenerate ? null : (
        <rect
          x={0}
          y={geo.band.y}
          width={width}
          height={geo.band.height}
          data-mc-ink="band"
          {...(geo.reliable
            ? {}
            : {
                stroke: "var(--mc-neutral)",
                strokeOpacity: 0.5,
                strokeDasharray: "2 2",
                strokeWidth: 0.5,
                vectorEffect: "non-scaling-stroke" as const,
              })}
        />
      )}
      {/* center hairline */}
      <line
        x1={0}
        y1={geo.center.y}
        x2={width}
        y2={geo.center.y}
        stroke="var(--mc-neutral)"
        strokeOpacity={0.55}
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
      />
      {/* faint connecting line — points carry the story, not the path */}
      <path
        d={geo.line.d}
        data-mc-ink="data"
        fill="none"
        strokeOpacity={0.4}
        vectorEffect="non-scaling-stroke"
        style={color ? { stroke: color } : undefined}
      />
      {/* secondary run-rule (WE-2/4) markers — hollow, distinct from the ✕/ring */}
      {geo.points.map((p, i) =>
        flagIdx.has(i) ? (
          <circle
            key={`f${p.x}`}
            cx={p.x}
            cy={p.y}
            r={2.4}
            fill="none"
            stroke="var(--mc-neutral)"
            strokeWidth={0.8}
            vectorEffect="non-scaling-stroke"
          />
        ) : null,
      )}
      {/* out-of-control points — ringed negative dot (ring = shape cue) */}
      {geo.points.map((p) =>
        p.out ? (
          <g key={`o${p.x}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={3}
              fill="none"
              stroke="var(--mc-negative)"
              strokeOpacity={0.5}
              strokeWidth={0.8}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={p.x} cy={p.y} r={1.6} fill="var(--mc-negative)" />
          </g>
        ) : dots === "all" ? (
          <circle
            key={`a${p.x}`}
            cx={p.x}
            cy={p.y}
            r={1}
            style={{ fill: color ?? "var(--mc-stroke)" }}
          />
        ) : null,
      )}
      {children}
    </Chart>
  );
}
