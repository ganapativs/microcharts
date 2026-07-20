// <RugStrip> — where the raw observations actually sit (S1 distribution).
// Static, hook-free, RSC-safe. Every tick is one observation;
// density comes from ink accumulation only (tiered opacity, see geometry).
// The strongest single story is `markValue`: one raw value against the field.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { quantiles } from "../../core/quantile.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import type { Value } from "../../core/types.js";
import { rugGeometry, type RugTick } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

/** Factual distribution summary — shared with the interactive entry. */
export function rugSummary(
  ticks: readonly RugTick[],
  fmt: (n: number) => string,
  strings: DistStrings,
): string {
  if (ticks.length === 0) return strings.noData;
  const median = quantiles(
    ticks.map((t) => t.value),
    [0.5],
  )![0]!;
  return strings.observations(
    ticks.length,
    fmt(ticks[0]!.value),
    fmt(ticks[ticks.length - 1]!.value),
    fmt(median),
  );
}

export interface RugStripProps {
  /** Raw observations — x-position = value. */
  data: readonly Value[];
  /** One raw domain value emphasized against the field ("your salary vs the band"). */
  markValue?: number | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
  /** Explicit domain for cross-row comparability. */
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

export function RugStrip(props: RugStripProps): ReactNode {
  const {
    data,
    markValue,
    orientation = "horizontal",
    domain,
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
  const width = props.width ?? (orientation === "horizontal" ? 60 : 10);
  const height = props.height ?? (orientation === "horizontal" ? 10 : 60);

  if (data.length > 400) {
    devWarn(
      `<RugStrip> ${data.length} observations — a rug promises raw marks and never downsamples; use HistogramStrip instead.`,
    );
  }

  const geo = rugGeometry({
    length: orientation === "horizontal" ? width : height,
    thickness: orientation === "horizontal" ? height : width,
    values: data,
    domain,
    markValue,
    orientation,
  });
  const fmt = makeFormatter(format, locale);
  const accName = resolveSummary(summary, () => rugSummary(geo.ticks, fmt, strings));

  // highlight tick: full opacity, accent, slightly wider stroke
  const hl =
    geo.highlightPos !== null
      ? orientation === "horizontal"
        ? { x1: geo.highlightPos, y1: 0, x2: geo.highlightPos, y2: height }
        : { x1: 0, y1: geo.highlightPos, x2: width, y2: geo.highlightPos }
      : null;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Ticks read across the full thickness (the highlight spans it edge to
      // edge) and value runs along the strip, so neither orientation has a
      // bottom that means anything — the field centres on the cap band.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-rug ${className}` : "mc-rug"}
      style={style}
    >
      {geo.ticks.length === 0 ? (
        /* designed empty: a quiet axis line, not a blank hole */
        <line
          x1={orientation === "horizontal" ? 0 : width / 2}
          y1={orientation === "horizontal" ? height / 2 : 0}
          x2={orientation === "horizontal" ? width : width / 2}
          y2={orientation === "horizontal" ? height / 2 : height}
          data-mc-ink="muted"
          data-mc-w="support"
          strokeOpacity={0.4}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.tiers.map((tier) => (
        <path
          key={tier.opacity}
          d={tier.d}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeOpacity: tier.opacity,
            ...(color ? { stroke: color } : null),
          }}
        />
      ))}
      {hl ? (
        <line {...hl} data-mc-ink="accent" data-mc-w="full" vectorEffect="non-scaling-stroke" />
      ) : null}
      {children}
    </Chart>
  );
}
