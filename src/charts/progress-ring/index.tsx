// <ProgressRing> — how complete is this, at icon size.
// Start angle fixed at 12 o'clock, butt caps —
// never a gauge: no needle, no red zone. `sweep` flips the data meaning from
// "done grows" to "remaining shrinks" (countdown/cooldown); summary follows.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { makeFormatter } from "../../core/format.js";
import { progressModel, type ProgressProps } from "../progress/index.js";
import { ringGeometry, ringSize } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface ProgressRingProps extends Pick<
  ProgressProps,
  | "value"
  | "max"
  | "positive"
  | "format"
  | "locale"
  | "title"
  | "summary"
  | "id"
  | "className"
  | "style"
  | "children"
> {
  /** Countdown mode: render the REMAINING fraction as a shrinking wedge. */
  sweep?: boolean | undefined;
  /** Ring thickness in viewBox units (geometry-affecting, so a prop). */
  weight?: number | undefined;
  /** `"percent"` centers the figure (≥ 20 px rendered size guidance in docs). */
  label?: "none" | "percent" | undefined;
  size?: number | undefined;
  color?: string | undefined;
  strings?: ScalarStrings | undefined;
}

export function ProgressRing(props: ProgressRingProps): ReactNode {
  const {
    value,
    max = 1,
    sweep = false,
    weight,
    label = "none",
    positive,
    color,
    format,
    locale,
    strings = EN_SCALAR,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // The box the summary describes has to be the box we paint: resolved once,
  // here and in geometry, from the one place that owns the default.
  const size = ringSize(props.size);
  // reuse Progress's resolved model (fraction/clamp/label semantics)
  const model = progressModel({ value, max, positive, format, locale, strings, label: "percent" });
  const pctFmt = makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 });
  // In `sweep` mode the arc paints what is LEFT and the name speaks what is
  // left, but the centre figure kept printing what was DONE — one glyph carried
  // two numbers ("68%" over a 32% wedge, announced "32% remaining"). One string
  // feeds the label and the name now, so they cannot drift apart again.
  const left =
    sweep && Number.isFinite(model.fraction) ? pctFmt(Math.max(0, 1 - model.fraction)) : undefined;
  const display = left ?? model.display;
  const showLabel = label === "percent" && display !== undefined;
  const geo = ringGeometry({
    size,
    fraction: model.clamped,
    weight,
    sweep,
    labelChars: showLabel ? display.length : 0,
  });

  const auto = !Number.isFinite(model.fraction)
    ? strings.noData
    : left !== undefined
      ? strings.remaining(left)
      : model.summary;
  const accName = resolveSummary(summary, () => auto);

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = { ...style, "--mc-label-size": `${geo.fontSize}px` } as CSSProperties;

  return (
    <Chart
      width={size}
      height={size}
      title={title}
      summary={accName}
      id={id}
      // The full-circle track is always drawn, so the ring is symmetric at every
      // fraction and has no floor to stand on — centre it on the cap band. The
      // box is the track's outer radius, which `size` fixes and the value never
      // touches; seating the sweeping arc would bob the glyph as it fills.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={className ? `mc-ring ${className}` : "mc-ring"}
      style={rootStyle}
    >
      <path d={geo.track} data-mc-ink="band" />
      {geo.arc ? (
        <path
          d={geo.arc}
          data-mc-ink="accent"
          fill="none"
          strokeLinecap="butt"
          style={{ strokeWidth: geo.weight, ...(color ? { stroke: color } : null) }}
        />
      ) : null}
      {showLabel && geo.fontSize > 0 ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          fontSize={geo.fontSize}
          dominantBaseline="central"
          textAnchor="middle"
        >
          {display}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
