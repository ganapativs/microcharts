// <ProgressRing> — how complete is this, at icon size.
// Static, hook-free, RSC-safe. Start angle fixed at 12 o'clock, butt caps —
// never a gauge: no needle, no red zone. `sweep` flips the data meaning from
// "done grows" to "remaining shrinks" (countdown/cooldown); summary follows.
import type { ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { makeFormatter } from "../../core/format.js";
import { progressModel, type ProgressProps } from "../progress/index.js";
import { ringGeometry } from "./geometry.js";

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
    weight = 3,
    label = "none",
    size = 24,
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

  // reuse Progress's resolved model (fraction/clamp/label semantics)
  const model = progressModel({ value, max, positive, format, locale, strings, label: "percent" });
  const geo = ringGeometry({ size, fraction: model.clamped, weight, sweep });
  const pctFmt = makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 });

  const auto = !Number.isFinite(model.fraction)
    ? strings.noData
    : sweep
      ? strings.remaining(pctFmt(Math.max(0, 1 - model.fraction)))
      : model.summary;
  const accName = summary === false ? false : (summary ?? auto);

  return (
    <Chart
      width={size}
      height={size}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-ring ${className}` : "mc-ring"}
      style={style}
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
      {label === "percent" && model.display !== undefined ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          fontSize={geo.fontSize}
          dominantBaseline="central"
          textAnchor="middle"
        >
          {model.display}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
