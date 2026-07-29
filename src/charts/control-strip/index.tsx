// <ControlStrip> — is the process in control, or did something leave the band?
// A Shewhart individuals control chart: the band is center ± 3σ̂
// (σ̂ = mean moving range / 1.128, stated — never a vague "±3 sigma"). In-control points are bare vertices; only out-of-control
// points are marked (ringed, negative — the ring is a shape cue, not
// color-alone). An in-control process should look boring.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";
import { EN_CONTROL, type ControlStrings } from "../../core/strings-control.js";
import { resolveSummary } from "../../core/summary.js";
import {
  controlGeometry,
  type ControlGeometry,
  type ControlLimits,
  type ControlRules,
} from "./geometry.js";

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
  /** `"out"` (default) marks only out-of-control points; `"all"` marks every
   *  point; `"none"` draws no point marks at all. */
  dots?: "out" | "all" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
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
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        // Empty stands on the same padded floor a drawn trace would.
        seat={{ mode: "floor", bottom: height - 2 }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () => controlSummary(geo, fmt, strings));
  const flagIdx = new Set(geo.violations.filter((v) => v.rule !== "we1").map((v) => v.index));

  // Point marks scale with the plot, not with nothing. At the authored heights
  // a fixed r=3 ring is a neat halo around an out-of-control point; on a short
  // strip the plot band collapses to a few units while the ring does not, so
  // the centre hairline runs straight THROUGH the hollow ring and reads as a
  // line crossing out a point rather than a point sitting above the centre.
  // Tying the radii to the padded plot height keeps the ring a halo at every
  // size — the ring stays a shape cue (never color-alone), just smaller.
  const plotH = Math.max(0, height - 4);
  const markScale = Math.min(1, Math.max(0.45, plotH / 24));
  const rRing = round2(3 * markScale);
  const rFlag = round2(2.4 * markScale);
  const rOut = round2(1.6 * markScale);
  const rDot = round2(1 * markScale);
  // The ring is a HALO around an out-of-control point, and the centre hairline
  // is a reference rule — a rule crossing the empty middle of a ring reads as a
  // point struck through, not a point above centre. Scaling alone can't fix it:
  // on a squat strip the plot band is a couple of units tall, so centre and an
  // out point are barely apart at any radius. So the ring is drawn only where
  // it clears the hairline, per point. Without it the out point is still marked
  // — a negative dot at 1.6× the ordinary vertex, so the cue stays shape+size,
  // never color alone.
  const ringClears = (y: number) => Math.abs(y - geo.center.y) >= rRing;

  // annotations host contract: Marker x = data INDEX (point position),
  // Threshold/TargetZone y = data values on the shared value scale.
  const ann = resolveAnnotations(children, {
    x: (i) => geo.points[Math.round(i)]?.x ?? NaN,
    y: scaleLinear(geo.domain, [height - 2, 2]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A trace over a fitted value domain, so it stands on the plot's padded
      // floor like a sparkline — the same 2-unit inset the annotation frame
      // above uses. The band is centre ± 3σ̂, i.e. DATA: seating that would make
      // the strip bob down the page every time the process shifted.
      seat={{ mode: "floor", bottom: height - 2 }}
      className={cls}
      style={style}
    >
      {ann.under}
      {geo.degenerate ? null : (
        <rect x={0} y={geo.band.y} width={width} height={geo.band.height} data-mc-ink="band" />
      )}
      {/* Provisional limits (n<10): dashed outline (band role kills stroke). */}
      {geo.degenerate || geo.reliable ? null : (
        <rect
          x={0}
          y={geo.band.y}
          width={width}
          height={geo.band.height}
          data-mc-ink="muted"
          data-mc-w="hair"
          strokeOpacity={0.5}
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <line
        x1={0}
        y1={geo.center.y}
        x2={width}
        y2={geo.center.y}
        data-mc-ink="muted"
        data-mc-w="hair"
        strokeOpacity={0.55}
        vectorEffect="non-scaling-stroke"
      />

      <path
        d={geo.line.d}
        data-mc-ink="data"
        fill="none"
        strokeOpacity={0.4}
        vectorEffect="non-scaling-stroke"
        style={color ? { stroke: color } : undefined}
      />
      {/* secondary run-rule (WE-2/4) markers — hollow, distinct from the ring */}
      {geo.points.map((p, i) =>
        flagIdx.has(i) ? (
          <circle
            key={`f${i}`}
            cx={p.x}
            cy={p.y}
            r={rFlag}
            data-mc-ink="muted"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null,
      )}
      {/* OOC: negative ring stroke (role fills; no ink role for hollow ring). */}
      {/* Keyed by INDEX, never by x: coords are 2-dp rounded, so a long series
          on a short strip puts several points on the same x and React saw
          duplicate keys (marks silently dropped or doubled). */}
      {geo.points.flatMap((p, i) =>
        dots === "none"
          ? []
          : p.out
            ? [
                ...(ringClears(p.y)
                  ? [
                      <circle
                        key={`o${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={rRing}
                        fill="none"
                        stroke="var(--mc-negative)"
                        strokeOpacity={0.5}
                        data-mc-w="tick"
                        vectorEffect="non-scaling-stroke"
                      />,
                    ]
                  : []),
                <circle key={`d${i}`} cx={p.x} cy={p.y} r={rOut} data-mc-ink="negative" />,
              ]
            : dots === "all"
              ? [
                  // custom `color` can't come from the static "point" role rule,
                  // so it falls back to a plain fill attribute (no role → no CSS)
                  <circle
                    key={`a${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={rDot}
                    data-mc-ink={color ? undefined : "point"}
                    fill={color}
                  />,
                ]
              : [],
      )}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
