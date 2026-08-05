// <PercentileTrace> — one entity's standing drifting inside a population
// Because the series IS percentile rank, the y-axis is LOCKED to
// [0,100] and the population bands (p25–75, p5–95) are fixed rects, not
// estimates — the trace is the only line. The
// endpoint dot carries valence (`positive`); direction is also in the line, so
// the color is a redundant cue, never the sole signal.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { clamp, scaleLinear } from "../../core/scale.js";
import {
  EN_PERCENTILE_TRACE,
  type PercentileTraceStrings,
} from "../../core/strings-percentile-trace.js";
import { chartSide, round2, type Polarity, type Value } from "../../core/types.js";
import {
  PERCENTILE_PAD,
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  percentileGeometry,
  type PercentileGeometry,
} from "./geometry.js";

export function percentileSummary(
  geo: PercentileGeometry,
  pStr: (n: number) => string,
  fmt: (n: number) => string,
  strings: PercentileTraceStrings,
): string {
  const current = pStr(geo.last.value);
  const deltaClause =
    geo.delta === 0
      ? strings.percentileFlat
      : strings.percentileDelta(geo.delta > 0 ? "up" : "down", fmt(Math.abs(geo.delta)));
  return strings.percentileTrace(current, deltaClause, strings.percentileBand(geo.movement));
}

export interface PercentileTraceProps {
  /** Percentile ranks per reading, 0–100 (out-of-range values are clamped). */
  data: readonly Value[];
  /** Draw the fixed p25–75 + p5–95 population bands (default true). */
  showBands?: boolean | undefined;
  /** Which direction is good — colors the endpoint dot (default "up"). */
  positive?: Polarity | undefined;
  /** `"last"` states the final percentile in a right gutter. */
  label?: "last" | "none" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: PercentileTraceStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Integer formatting shared with the interactive entry. */
export const INT: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

/**
 * Right gutter reserved for the `label="last"` readout, in viewBox units — it
 * WIDENS the viewBox (`width + gutter`), so it is also the interactive entry's
 * pointer basis. Exported because the client must scale pointer x by the same
 * total the static drew with; scaling by bare `width` walks the crosshair
 * progressively rightward and puts the last readings out of reach.
 */
export const percentileGutter = (labelText: string, height: number): number =>
  labelText && percentileLabelFits(height)
    ? Math.ceil(labelText.length * labelFont(height) * 0.72) + 4
    : 0;

/**
 * Does the box have vertical room for the readout at all? `labelFont` floors at
 * 7 viewBox units, so under a 7-unit-tall box a line of text cannot be seated
 * inside the plot — it DROPS rather than spilling past the viewBox, and the
 * gutter above drops with it so the trace keeps its own width instead of
 * reserving space for text nobody draws. Exported for the same reason the
 * gutter is: both entries must reach the same answer. Pure arithmetic — the
 * static path may never measure text.
 */
export const percentileLabelFits = (height: number): boolean =>
  labelFitsY(height / 2, labelFont(height), height);

export function PercentileTrace(props: PercentileTraceProps): ReactNode {
  const {
    data,
    showBands = true,
    positive = "up",
    label = "last",
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    color,
    format = INT,
    locale,
    strings = EN_PERCENTILE_TRACE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // Everything below reads the RESOLVED box, never the prop: `height={NaN}`
  // set `--mc-label-size: NaNpx` and a NaN seat on a 1×1 frame, and geometry
  // laid the trace out against the raw prop while `Chart` clamped the viewBox.
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

  const FONT = labelFont(height);
  const fmt = makeFormatter(format, locale);
  const pStr = (n: number) => strings.percentileValue(fmt(n));
  const cls = className ? `mc-percentile-trace ${className}` : "mc-percentile-trace";

  const geo = percentileGeometry({ width, height, data });
  const accName =
    summary === false
      ? false
      : (summary ?? (geo ? percentileSummary(geo, pStr, fmt, strings) : strings.noData));

  // no finite readings → the empty Chart still carries the accessible name
  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={accName}
        id={id}
        // No geometry to read the floor off; mirror its pad, halved under a
        // 4-unit box the same way geometry stops the plot inverting.
        seat={{ mode: "floor", bottom: height - Math.min(PERCENTILE_PAD, height / 2) }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  if (geo.clamped) {
    devWarn("<PercentileTrace>: ranks are 0–100; out-of-range clamped.");
  }

  const showLabel = label === "last" && percentileLabelFits(height);
  const labelText = showLabel ? pStr(geo.last.value) : "";
  const gutter = percentileGutter(labelText, height);

  const lineColor = color ?? "var(--mc-accent)";
  // Endpoint valence: rising standing is good by default; the line already
  // carries direction, so this color is a redundant cue. It rides an ink ROLE
  // rather than an inline `fill` because inline paint outranks every
  // stylesheet rule and `.mc-root` sets `forced-color-adjust: none` — the
  // literal token survived verbatim into High Contrast Mode, painting a matte
  // green or vermillion against the user's chosen background instead of the
  // CanvasText/GrayText the valence mapping exists to give it. `color` is a
  // line override, so it only reaches the dot on a flat trace.
  const good = positive === "down" ? geo.delta < 0 : geo.delta > 0;
  const flat = geo.delta === 0;
  const dotInk = flat ? "accent" : good ? "positive" : "negative";
  // `dominant-baseline: central` straddles y by half a font EACH way, so the
  // clamp is symmetric — an asymmetric margin let the bottom of the glyph box
  // hang out of a short viewBox. Below `height < FONT` no clamp exists at all,
  // and `showLabel` above has already dropped the readout.
  const labelY = round2(clamp(geo.last.y, FONT * 0.5, height - FONT * 0.5));

  // outer p5–95 field (faintest, half the band token) then the inner p25–75
  // middle half painted full-strength on top
  const bands = [
    { name: "outer", rect: geo.bands.outer, opacity: 0.5 },
    { name: "inner", rect: geo.bands.inner, opacity: undefined },
  ] as const;

  // annotations host contract: Marker x = reading index on the locked scale,
  // Threshold/TargetZone y = percentile ranks on the fixed [0,100] axis. Both
  // scales read the plot box off geometry rather than re-deriving the pad —
  // under a box narrower than 2·pad the two answers diverged.
  const ann = resolveAnnotations(children, {
    x: scaleLinear([0, Math.max(1, data.length - 1)], [geo.x0, geo.x1]),
    y: scaleLinear([0, 100], [geo.y1, geo.y0]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  return (
    <Chart
      width={width + gutter}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // The axis is locked to [0,100], so the frame's bottom is a real p0 floor
      // the trace is measured against — it seats on the text baseline. The
      // population bands ride inside that frame and never move it.
      seat={{ mode: "floor", bottom: geo.y1 }}
      className={cls}
      style={{ ...style, "--mc-label-size": `${FONT}px` } as CSSProperties}
    >
      {ann.under}
      {showBands
        ? bands.map(({ name, rect, opacity }) => (
            <rect
              key={name}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              data-mc-ink="band"
              fillOpacity={opacity}
            />
          ))
        : null}
      <path
        d={geo.line.d}
        data-mc-ink="data"
        fill="none"
        vectorEffect="non-scaling-stroke"
        style={{ stroke: lineColor }}
      />
      <circle
        cx={geo.last.x}
        cy={geo.last.y}
        r={1.8}
        data-mc-ink={dotInk}
        style={flat && color ? { fill: color } : undefined}
      />
      {showLabel ? (
        <text
          x={width + 3}
          y={labelY}
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
