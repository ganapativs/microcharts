// <Progress> — "how far along is this, exactly?" (plan/22 #4, S3). Static,
// hook-free, RSC-safe. The percent label is the datum — a bare bar is
// decoration — so `label="percent"` is the default. The bar is always
// zero-anchored and clamps at 100%; past that, the LABEL carries the truth
// ("112%") — the number and the bar only disagree in that documented case.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { progressGeometry } from "./geometry.js";

/** Resolved Progress model — shared by the static and interactive entries. */
export interface ProgressModel {
  /** Raw fraction value/max (may exceed 1); NaN when not computable. */
  fraction: number;
  /** Fraction clamped to [0, 1] — what the bar renders. */
  clamped: number;
  /** The label text per the `label` mode (undefined = no label). */
  display: string | undefined;
  summary: string;
}

export function progressModel(props: ProgressProps): ProgressModel {
  const {
    value,
    max = 1,
    segments,
    label = "percent",
    positive = "up",
    format,
    locale,
    strings = EN_SCALAR,
  } = props;
  const usable = Number.isFinite(value) && Number.isFinite(max) && max > 0;
  const fraction = usable ? value / max : Number.NaN;
  const clamped = usable ? Math.min(1, Math.max(0, fraction)) : 0;

  const pctFmt = makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 });
  const valFmt = makeFormatter(format, locale);

  const done = usable && segments ? Math.floor(fraction * Math.floor(segments) + 1e-9) : 0;
  const display = !usable
    ? label === "none"
      ? undefined
      : "—"
    : label === "percent"
      ? pctFmt(fraction)
      : label === "value"
        ? valFmt(value)
        : label === "fraction"
          ? `${segments ? done : valFmt(value)}/${segments ? Math.floor(segments) : valFmt(max)}`
          : undefined;

  const summary = !usable
    ? strings.noData
    : segments && segments >= 2
      ? strings.stepsDone(done, Math.floor(segments))
      : positive === "down"
        ? strings.remaining(pctFmt(Math.max(0, 1 - fraction)))
        : strings.progress(pctFmt(fraction));

  return { fraction, clamped, display, summary };
}

export interface ProgressProps {
  value: number;
  /** Denominator; `value/max` is the rendered fraction. */
  max?: number | undefined;
  /** Discrete-chunk track (e.g. 3-of-5 steps) — ratio becomes step count. */
  segments?: number | undefined;
  /** `"percent"` (default) | `"value"` | `"fraction"` | `"none"`. */
  label?: "percent" | "value" | "fraction" | "none" | undefined;
  /** `"down"` = burn-down wording (less is good); the bar stays factual. */
  positive?: "up" | "down" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: ScalarStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function Progress(props: ProgressProps): ReactNode {
  const {
    segments,
    width = 48,
    height = 8,
    color,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const model = progressModel(props);
  const fontSize = Math.max(6, Math.min(Math.round(height * 0.75), 11));
  const geo = progressGeometry({
    width,
    height,
    fraction: model.clamped,
    segments,
    gutterCh: model.display?.length ?? 0,
    fontSize,
  });

  const accName = summary === false ? false : (summary ?? model.summary);
  const fillStyle = color ? { fill: color } : undefined;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-progress ${className}` : "mc-progress"}
      style={style}
    >
      {geo.segments ? (
        geo.segments.map((s) => (
          <g key={s.x}>
            <rect
              x={s.x}
              y={geo.track.y}
              width={s.w}
              height={geo.track.h}
              shapeRendering="crispEdges"
              data-mc-ink="band"
            />
            {s.fill > 0 ? (
              <rect
                x={s.x}
                y={geo.track.y}
                width={Math.round(s.w * s.fill * 100) / 100}
                height={geo.track.h}
                shapeRendering="crispEdges"
                data-mc-ink="accent"
                className="mc-progress-fill"
                style={fillStyle}
              />
            ) : null}
          </g>
        ))
      ) : (
        <>
          <rect
            x={geo.track.x}
            y={geo.track.y}
            width={geo.track.w}
            height={geo.track.h}
            shapeRendering="crispEdges"
            data-mc-ink="band"
          />
          {geo.fill.w > 0 ? (
            <rect
              x={geo.fill.x}
              y={geo.fill.y}
              width={geo.fill.w}
              height={geo.fill.h}
              shapeRendering="crispEdges"
              data-mc-ink="accent"
              className="mc-progress-fill"
              style={fillStyle}
            />
          ) : null}
        </>
      )}
      {model.display !== undefined ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="end"
        >
          {model.display}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
