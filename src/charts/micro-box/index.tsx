// <MicroBox> — p50 and spread in a table row. Whisker →
// IQR box → median tick. Never renders a box from
// fewer than 5 observations (dots at the raw values instead); precomputed
// `stats` with non-monotonic values are a dev ERROR — garbage in must not
// render a plausible-looking lie. Violin stays unshipped; this is its
// documented replacement.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { resolveSummary } from "../../core/summary.js";
import type { FiveNumber } from "../../core/quantile.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import { isFiniteValue, type Value } from "../../core/types.js";
import { computeFive, microBoxDots, microBoxGeometry } from "./geometry.js";

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
  format?: Format | undefined;
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

  const accName = resolveSummary(summary, () =>
    resolved === null ? strings.noData : microBoxSummary(resolved.five, fmt, strings),
  );

  const cls = className ? `mc-box ${className}` : "mc-box";

  if (resolved === null || tooFew) {
    const raws = tooFew && resolved ? resolved.raw : [];
    // Same scale the box path uses, so `domain` is honoured and the interactive
    // entry's hit-testing lands on the dots it can see.
    const dotX =
      resolved && raws.length > 0
        ? microBoxDots({ raw: raws, width, five: resolved.five, domain }).dots
        : [];
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={accName}
        id={id}
        // Empty and small-n seat like the drawn box: the raw dots sit on the
        // same midline, there is simply no box to measure.
        seat={{ mode: "center", top: 0, bottom: height }}
        className={cls}
        style={style}
      >
        {raws.map((_v, i) => (
          <circle
            key={i}
            cx={dotX[i]}
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
      // Spread read along a midline: whisker, box and outliers are all built
      // about `height / 2`, so no edge here is a floor and the box centres on
      // the cap band. Symmetric in the frame by construction, so the frame IS
      // the plot box — the box's own height is data-free but says no more.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={cls}
      style={style}
    >
      <line
        x1={geo.whisker.x0}
        y1={geo.whisker.y}
        x2={geo.whisker.x1}
        y2={geo.whisker.y}
        data-mc-ink="muted"
        data-mc-w="support"
      />
      {/* `band` is a fill-only role — styles.css declares `stroke: none` on it,
          and a CSS declaration outranks a presentation attribute, so the
          `stroke="var(--mc-neutral)"` + `data-mc-w="hair"` this rect used to
          carry never painted a single pixel (verified against the real
          stylesheet). Dropped rather than forced inline: an inline stroke would
          survive `forced-color-adjust: none` as a fixed gray in High Contrast
          Mode. Giving the IQR box a real outline needs a stroked ink role. */}
      <rect x={geo.box.x} y={geo.box.y} width={geo.box.w} height={geo.box.h} data-mc-ink="band" />
      <line
        x1={geo.medianX}
        y1={geo.box.y}
        x2={geo.medianX}
        y2={geo.box.y + geo.box.h}
        data-mc-ink="data"
        data-mc-w="heavy"
        style={color ? { stroke: color } : undefined}
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
