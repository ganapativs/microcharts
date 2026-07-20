// <FoldedDayBand> — what does a typical period look like, and is the current one
// typical. Static, hook-free, RSC-safe. Folds many
// periods onto one axis: 25–75 and 5–95 percentile envelopes + a median line,
// with an optional "today" overlay. Envelopes are real per-bin quantiles.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_FOLDED_BAND, type FoldedBandStrings } from "../../core/strings-folded-band.js";
import { foldedBandGeometry, type FoldedBandResult, type TP } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface FoldedDayBandProps {
  data: readonly TP[];
  /** Fold length in `t` units (168 folds a week; any cycle). */
  period?: number | undefined;
  /** The current period overlaid — the "how typical is now" read. */
  today?: readonly TP[] | undefined;
  /** Percentile pairs, outermost last; ≤ 2 pairs. */
  bands?: readonly [number, number][] | undefined;
  /** Fold-axis resolution. */
  bins?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: FoldedBandStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Position label for a fold bin (in period units). */
export function binPosition(bin: number, bins: number, period: number): number {
  return Math.round((bin / Math.max(1, bins)) * period);
}

/** Shared summary — where the median peaks, plus a today-vs-typical clause. */
export function foldedBandSummary(
  geo: FoldedBandResult,
  period: number,
  strings: FoldedBandStrings,
  fmt: (n: number) => string,
): string {
  if (geo.medianPath === "") return strings.noData;
  const pos = binPosition(geo.peak.bin, geo.bins, period);
  const todayClause =
    geo.todayPercentile == null
      ? ""
      : geo.todayPercentile < 25
        ? strings.foldedToday[0]
        : geo.todayPercentile > 75
          ? strings.foldedToday[2]
          : strings.foldedToday[1];
  return strings.foldedBand(fmt(pos), fmt(geo.peak.median), todayClause);
}

export function FoldedDayBand(props: FoldedDayBandProps): ReactNode {
  const {
    data,
    period = 24,
    today,
    bands = [
      [25, 75],
      [5, 95],
    ],
    bins = 24,
    width = 120,
    height = 32,
    format,
    locale,
    strings = EN_FOLDED_BAND,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const geo = foldedBandGeometry({
    data,
    today: today ?? null,
    period,
    bins,
    bands,
    width,
    height,
  });
  const accName = resolveSummary(summary, () => foldedBandSummary(geo, period, strings, fmt));

  // outer band faintest → drawn first; opacity by index (outermost last in bands)
  const order = geo.bandPaths.map((_p, i) => i).reverse();

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Not a cell grid — envelopes and a median line over a value range, which
      // reads as standing on its own floor like any trace. The plot's padded
      // bottom edge, so the seat matches the frame the quantiles are scaled into.
      seat={{ mode: "floor", bottom: geo.y1 }}
      className={className ? `mc-folded ${className}` : "mc-folded"}
      style={style}
    >
      {order.map((bi) =>
        geo.bandPaths[bi] ? (
          <path
            key={bi}
            d={geo.bandPaths[bi]}
            style={{ fill: "var(--mc-stroke)", fillOpacity: bi === 0 ? 0.22 : 0.12 }}
          />
        ) : null,
      )}
      {geo.medianPath ? (
        // the fold's headline line — thicker than the default data weight (no
        // width role covers >1×; support/tick/hair are all secondary-mark
        // fractions), a justified literal for this primary emphasis mark.
        <path
          d={geo.medianPath}
          data-mc-ink="data"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ strokeWidth: "calc(var(--mc-stroke-width) * 1.25)" }}
        />
      ) : null}
      {geo.todayPath ? (
        <path
          d={geo.todayPath}
          data-mc-ink="accent"
          data-mc-w="support"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      {children}
    </Chart>
  );
}
