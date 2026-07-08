// <MicroBox> — p50 and spread in a table row (plan/22 #16, S2). Whisker →
// IQR box → median tick. Static, hook-free, RSC-safe. Never renders a box from
// fewer than 5 observations (dots at the raw values instead); precomputed
// `stats` with non-monotonic values are a dev ERROR — garbage in must not
// render a plausible-looking lie. Violin stays unshipped; this is its
// documented replacement.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import type { FiveNumber } from "../../core/quantile.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";
import { computeFive, microBoxGeometry } from "./geometry.js";

/** Factual five-number summary. Shared with the interactive entry. */
export function microBoxSummary(
  five: FiveNumber,
  fmt: (n: number) => string,
  strings: DistStrings,
): string {
  return strings.fiveNum(
    fmt(five.median),
    fmt(five.q1),
    fmt(five.q3),
    fmt(five.min),
    fmt(five.max),
  );
}

export interface MicroBoxProps {
  /** Raw observations — mutually exclusive with `stats`. */
  data?: readonly Value[] | undefined;
  /** Precomputed five-number summary (server aggregates). */
  stats?: FiveNumber | undefined;
  /** `"minmax"` (honest small-n default) | `"tukey"` (1.5×IQR fences). */
  whiskers?: "minmax" | "tukey" | undefined;
  /** Render outlier dots in tukey mode (≤ 3 per side). */
  outliers?: boolean | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: DistStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function MicroBox(props: MicroBoxProps): ReactNode {
  const {
    data,
    stats,
    whiskers = "minmax",
    outliers = true,
    domain,
    width = 40,
    height = 14,
    color,
    format,
    locale,
    strings = EN_DIST,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (stats) {
    const { min, q1, median, q3, max } = stats;
    if (!(min <= q1 && q1 <= median && median <= q3 && q3 <= max)) {
      devWarn("<MicroBox> non-monotonic stats — refusing to render a plausible-looking lie.");
    }
  }

  const resolved = computeFive(data, stats);
  const fmt = makeFormatter(format, locale);
  const rawCount = data ? data.filter(isFiniteValue).length : Infinity;

  // fewer than 5 raw observations → honest dots, never a fake box
  const tooFew = resolved !== null && stats === undefined && rawCount < 5;

  const accName =
    summary === false
      ? false
      : (summary ??
        (resolved === null ? strings.noData : microBoxSummary(resolved.five, fmt, strings)));

  const cls = className ? `mc-box ${className}` : "mc-box";

  if (resolved === null || tooFew) {
    const raws = tooFew && resolved ? resolved.raw : [];
    const lo = Math.min(...raws);
    const hi = Math.max(...raws);
    const span = hi - lo || 1;
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
        {raws.map((v, i) => (
          <circle
            key={i}
            cx={round2(1.5 + ((v - lo) / span) * (width - 3))}
            cy={height / 2}
            r={1.5}
            data-mc-ink="point"
            style={color ? { fill: color } : undefined}
          />
        ))}
        {children}
      </Chart>
    );
  }

  const geo = microBoxGeometry({
    width,
    height,
    five: resolved.five,
    raw: resolved.raw,
    whiskers,
    domain,
  });

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
      <line
        x1={geo.whisker.x0}
        y1={geo.whisker.y}
        x2={geo.whisker.x1}
        y2={geo.whisker.y}
        data-mc-ink="muted"
        vectorEffect="non-scaling-stroke"
        style={{ strokeWidth: 1 }}
      />
      <rect
        x={geo.box.x}
        y={geo.box.y}
        width={geo.box.w}
        height={geo.box.h}
        data-mc-ink="band"
        stroke="var(--mc-neutral)"
        strokeWidth={0.5}
      />
      <line
        x1={geo.medianX}
        y1={geo.box.y}
        x2={geo.medianX}
        y2={geo.box.y + geo.box.h}
        data-mc-ink="data"
        vectorEffect="non-scaling-stroke"
        style={{
          strokeWidth: "calc(var(--mc-stroke-width) * 1.33)",
          ...(color ? { stroke: color } : null),
        }}
      />
      {whiskers === "tukey" && outliers
        ? geo.outliers.map((o, i) => (
            <circle key={i} cx={o.x} cy={o.y} r={1} data-mc-ink="point" fillOpacity={0.7} />
          ))
        : null}
      {children}
    </Chart>
  );
}
