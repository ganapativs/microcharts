// <ChangePoint> — when did the behaviour change level? Regime
// shading (neutral identity, not valence) + per-regime mean hairlines + the
// series line + break markers (hairline + top triangle). The detector is a
// documented HEURISTIC (geometry.ts). and explicit `breaks` is the recommended
// production path. A spike means nothing without the regime it broke.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear, extent } from "../../core/scale.js";
import { round2, isFiniteValue } from "../../core/types.js";
import { makeFormatter, makePercentFormatter, withPlus, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { EN_CHANGE_POINT, type ChangePointStrings } from "../../core/strings-change-point.js";
import { CHANGE_POINT_PAD, changePointGeometry, type ChangePointGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

/** The signed level-shift label ("+50%"). `pct` takes a FRACTION and must be a
 *  real percent formatter — the old hand-rolled `${Math.round(x*100)}%` fixed
 *  both the sign and its spacing in en-US, so `locale` never reached it.
 *  `withPlus` adds the leading `+` only when the formatter emitted no sign. */
export const changePointDelta = (frac: number, pct: (fraction: number) => string): string =>
  withPlus(frac, pct);

export function changePointSummary(
  geo: ChangePointGeometry,
  fmt: (v: number) => string,
  strings: ChangePointStrings,
  /** Percent formatter (FRACTION in) for the shift magnitude. */
  pct: (fraction: number) => string = makePercentFormatter(undefined),
): string {
  if (geo.breaks.length === 0) return strings.changePointNone(geo.n);
  // headline = the largest-magnitude break
  let lead = geo.breaks[0]!;
  for (const b of geo.breaks) if (Math.abs(b.delta) > Math.abs(lead.delta)) lead = b;
  const isLast = lead.index === geo.breaks[geo.breaks.length - 1]!.index;
  // A regime mean is NaN when every point in it is a gap (reachable with
  // explicit `breaks`), and `fmt(NaN)` announces the literal string "NaN" —
  // the catalog's placeholder for an unmeasurable slot is an em dash.
  const num = (v: number): string => (isFiniteValue(v) ? fmt(v) : "—");
  return strings.changePoint(
    lead.delta >= 0 ? "up" : "down",
    // unsigned — the direction word already carries the sign
    pct(Math.abs(lead.delta)),
    lead.index,
    num(lead.before),
    num(lead.after),
    isLast ? "stable" : "again",
  );
}

export interface ChangePointProps {
  /** A single series. */
  data: readonly number[];
  /** `"auto"` runs the heuristic; an index array overrides detection entirely. */
  breaks?: "auto" | readonly number[] | undefined;
  /** Max detected breaks (1–3). More regimes stop being glanceable. */
  maxItems?: number | undefined;
  /** Per-regime mean hairlines (default true). */
  means?: boolean | undefined;
  /** `"delta"` prints the signed % across the most recent break in a gutter. */
  label?: "delta" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  strings?: ChangePointStrings | undefined;
  /** Minimum in-chart label size, in viewBox units. Geometry sizes labels from
   *  the mark and floors them at 7; this raises that floor and moves the
   *  reserved gutter with it. A label the box cannot seat at the raised floor
   *  drops rather than shrinking back under it. */
  labelSize?: number | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function ChangePoint(props: ChangePointProps): ReactNode {
  const {
    data,
    breaks = "auto",
    maxItems = 2,
    means = true,
    label = "none",
    domain,
    format,
    locale,
    width = 80,
    height = 16,
    color,
    strings = EN_CHANGE_POINT,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const FONT = labelFont(height, 0.55, labelSize);
  const fmt = makeFormatter(format, locale);
  // The shift is a relative change, not a measurement — it takes `locale` but
  // never the value `format` (which carries the series' units).
  const pctFmt = makePercentFormatter(locale);
  const cls = className ? `mc-change-point ${className}` : "mc-change-point";

  const probe = changePointGeometry({ width, height, data, breaks, maxItems, domain });
  const showLabel = label === "delta" && probe != null && probe.breaks.length > 0;
  const labelText = showLabel
    ? changePointDelta(probe!.breaks[probe!.breaks.length - 1]!.delta, pctFmt)
    : "";
  // 0.72·em/char (not 0.62) — the delta label always carries the wide `%` glyph.
  // Measured off the FORMATTED string, so a locale that writes "+50 %" reserves
  // the extra character instead of spilling past the viewBox.
  const gutter = showLabel ? Math.ceil(labelText.length * FONT * 0.72) + 4 : 0;

  const geo = probe;
  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        // Same frame the populated chart seats on, so an empty slot in a column
        // of these sits on the baseline at exactly the same height.
        seat={{ mode: "floor", bottom: height - CHANGE_POINT_PAD }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () => changePointSummary(geo, fmt, strings, pctFmt));
  const accent = color ?? "var(--mc-accent)";
  const rootStyle = { ...style, "--mc-label-px": `${FONT}px` } as CSSProperties;
  const totalWidth = width + gutter;
  const lastBreak = geo.breaks[geo.breaks.length - 1];

  // annotations host: Marker x = data index (mirror of the geometry's sx),
  // Threshold/TargetZone y = data values on the shared value scale (props.domain
  // ?? data extent, mapped to [height − pad, pad] with the geometry's pad = 2).
  const ann = resolveAnnotations(children, {
    x: (i) => 2 + (i / Math.max(1, geo.n - 1)) * (width - 4),
    y: scaleLinear(domain ?? extent(data) ?? [0, 1], [height - 2, 2]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  return (
    <Chart
      width={totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A trace over a value range stands on its own floor (Sparkline's
      // precedent). The plot box, not the viewBox: regime tints and break
      // hairlines deliberately bleed to the full height, and seating on those
      // would hang the line two units above the baseline.
      seat={{ mode: "floor", bottom: height - CHANGE_POINT_PAD }}
      className={cls}
      style={rootStyle}
    >
      {ann.under}
      {/* Odd regimes tinted so adjacent ones contrast (bare vs tint). */}
      {geo.segments.map((sg, i) =>
        i % 2 === 1 ? (
          <rect
            key={i}
            x={round2(geo.breaks[i - 1]!.x)}
            y={0}
            width={round2(
              Math.max(
                0,
                (i === geo.segments.length - 1 ? width : geo.breaks[i]!.x) - geo.breaks[i - 1]!.x,
              ),
            )}
            height={height}
            data-mc-ink="region"
            style={{ fill: "var(--mc-neutral)", fillOpacity: 0.1 }}
          />
        ) : null,
      )}
      {means
        ? geo.segments.map((sg, i) =>
            Number.isFinite(sg.mean) ? (
              <line
                key={`m${i}`}
                x1={sg.x0}
                y1={sg.meanY}
                x2={sg.x1}
                y2={sg.meanY}
                data-mc-ink="ghost"
                stroke="var(--mc-neutral)"
                strokeOpacity={0.6}
                strokeDasharray="2 1.5"
                data-mc-w="hair"
              />
            ) : null,
          )
        : null}
      {geo.line.d ? (
        <path
          d={geo.line.d}
          data-mc-ink="data"
          fill="none"
          // stroke only: `data-mc-ink="data"` already sets the same
          // `var(--mc-sw)`, and repeating it inline put the width out of reach of
          // a consumer override (the ink rules are deliberately `:where()`).
          style={{ stroke: accent }}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      {geo.breaks.map((b) => (
        <g key={`b${b.index}`}>
          <line
            x1={b.x}
            y1={0}
            x2={b.x}
            y2={height}
            data-mc-ink="flag"
            strokeOpacity={0.75}
            data-mc-w="tick"
          />
          <path
            d={`M${round2(b.x - 1.6)} 0 L${round2(b.x + 1.6)} 0 L${b.x} 2.2 Z`}
            data-mc-ink="flag"
            style={{ fill: accent }}
          />
        </g>
      ))}
      {showLabel && lastBreak ? (
        <text
          x={round2(width + 3)}
          y={round2(height / 2)}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
        >
          {labelText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
