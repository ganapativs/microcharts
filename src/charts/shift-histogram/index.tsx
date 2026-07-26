// <ShiftHistogram> — did the fix actually change the distribution?
// Mirrored bins over SHARED edges (before up muted, after down accent) with the
// median shift as the precise takeaway. Heights are per-side proportions on one
// shared scale, so unequal sample sizes cannot fake a shift. Mirror orientation
// carries IDENTITY (up ≠ good). which is why the side tags exist.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, withPlus, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { round2 } from "../../core/types.js";
import { EN_SHIFT, type ShiftStrings } from "../../core/strings-shift.js";
import { shiftHistogramGeometry, type ShiftHistogramGeometry, type ShiftMode } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

/** Signed median shift string (sign in text). */
export function shiftDelta(geo: ShiftHistogramGeometry, fmt: (n: number) => string): string {
  if (geo.shift === null) return "";
  return withPlus(geo.shift, fmt);
}

export function shiftSummary(
  geo: ShiftHistogramGeometry,
  fmt: (n: number) => string,
  seriesLabels: readonly [string, string],
  strings: ShiftStrings,
): string {
  const { before, after } = geo.medians;
  if (before === null && after !== null)
    return strings.shiftOneSide(fmt(after.value), seriesLabels[0]);
  if (after === null && before !== null)
    return strings.shiftOneSide(fmt(before.value), seriesLabels[1]);
  if (before === null || after === null) return strings.noData;
  const samples = geo.nBefore !== geo.nAfter ? strings.shiftSamples(geo.nBefore, geo.nAfter) : "";
  if (geo.shift === 0) return strings.shiftHeld(fmt(before.value)) + samples;
  const dir = geo.shift! < 0 ? "fell" : "rose";
  return strings.shift(dir, fmt(before.value), fmt(after.value)) + samples;
}

export interface ShiftHistogramProps {
  /** Two samples: before and after the change. */
  data: { before: readonly number[]; after: readonly number[] };
  /** Shared bin count (default auto, Sturges capped at 12). */
  bins?: number | undefined;
  /** Mirror (default) or overlay (after outline over before fill). */
  mode?: ShiftMode | undefined;
  /** Side identities for the summary (default ["before", "after"]). */
  seriesLabels?: readonly [string, string] | undefined;
  /** `"shift"` states the signed median shift in a right gutter. */
  label?: "shift" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: ShiftStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function ShiftHistogram(props: ShiftHistogramProps): ReactNode {
  const {
    data,
    bins,
    mode = "mirror",
    seriesLabels = ["before", "after"] as const,
    label = "shift",
    domain,
    width = 80,
    height = 20,
    color,
    format,
    locale,
    strings = EN_SHIFT,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const FONT = labelFont(height, 0.42);
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-shift-histogram ${className}` : "mc-shift-histogram";

  const probe = shiftHistogramGeometry({
    width,
    height,
    before: data.before,
    after: data.after,
    bins,
    mode,
    domain,
  });
  const showLabel = label === "shift" && probe != null && probe.shift !== null;
  const labelText = showLabel ? shiftDelta(probe!, fmt) : "";
  const gutterCh = showLabel ? labelText.length : 0;

  const geo = shiftHistogramGeometry({
    width,
    height,
    before: data.before,
    after: data.after,
    bins,
    mode,
    domain,
    gutterCh,
    fontSize: FONT,
  });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        seat={{ mode: "center", top: 2, bottom: height - 2 }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () => shiftSummary(geo, fmt, seriesLabels, strings));
  const afterFill = color ?? "var(--mc-accent)";
  const overlay = mode === "overlay";
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Mirrored around the center hairline: before grows up, after grows down,
      // and neither side is a floor. The seat is the padded plot frame, not the
      // viewBox, so the mirror axis lands on the cap band where the eye expects
      // the shared zero to be.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={cls}
      style={rootStyle}
    >
      <line
        x1={0}
        y1={geo.centerY}
        x2={width}
        y2={geo.centerY}
        stroke="var(--mc-neutral)"
        strokeOpacity={0.4}
        data-mc-w="hair"
        vectorEffect="non-scaling-stroke"
      />
      {/* Before bins up from center (origin bottom — keep them on the axis). */}
      {geo.bins.map((b) =>
        b.up > 0 ? (
          <rect
            key={`b${b.x}`}
            x={b.x}
            y={round2(geo.centerY - b.up)}
            width={b.width}
            height={b.up}
            data-mc-ink="neutral"
            data-mc-origin="bottom"
            shapeRendering="crispEdges"
            fillOpacity={0.55}
          />
        ) : null,
      )}
      {/* After bins: mirror down, or outline above in overlay mode. */}
      {geo.bins.map((b) =>
        b.down > 0 ? (
          overlay ? (
            // overlay after-bins render ABOVE the axis (like before bins), so
            // they too grow up from the center line → pin the bottom edge.
            <rect
              key={`a${b.x}`}
              x={b.x}
              y={round2(geo.centerY - b.down)}
              width={b.width}
              height={b.down}
              fill="none"
              stroke={afterFill}
              data-mc-origin="bottom"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            // mirror after-bins hang BELOW the axis → pin the top edge so they
            // grow downward out of the shared center line.
            <rect
              key={`a${b.x}`}
              x={b.x}
              y={geo.centerY}
              width={b.width}
              height={b.down}
              data-mc-ink="bar"
              data-mc-origin="top"
              shapeRendering="crispEdges"
              style={{ fill: afterFill }}
            />
          )
        ) : null,
      )}
      {geo.medians.before ? (
        <line
          x1={geo.medians.before.x}
          y1={round2(geo.centerY - (height / 2 - 2))}
          x2={geo.medians.before.x}
          y2={geo.centerY}
          stroke="var(--mc-stroke)"
          data-mc-w="support"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.medians.after && !overlay ? (
        <line
          x1={geo.medians.after.x}
          y1={geo.centerY}
          x2={geo.medians.after.x}
          y2={round2(geo.centerY + (height / 2 - 2))}
          stroke={afterFill}
          data-mc-w="support"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={round2(height / 2)}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
