// <DualSparkline> — how is this series doing against its benchmark
// Exactly 2 series, ever: 3+ overlapped lines at 16 px are
// unreadable (SparkGroup for that). The reference whispers: dashed + thinner +
// neutral, never color-alone. One shared domain — no dual axes. Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import type { Curve } from "../../core/path.js";
import { seriesStats } from "../../core/stats.js";
import { EN_VS, type VsStrings } from "../../core/strings-vs.js";
import { EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import type { Value } from "../../core/types.js";
import { dualSparklineGeometry } from "./geometry.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";

/** Trend clause ("up 12%" / "down 4%" / "flat") for one series. */
function trendClause(values: readonly Value[], strings: SeriesStrings): string {
  const s = seriesStats(values);
  if (!s || s.count < 2) return strings.noData;
  if (s.min === s.max || s.trend === 0) return strings.noChange;
  const dir = s.trend > 0 ? "up" : "down";
  return s.first === 0
    ? strings.trendAbs(dir, String(Math.round(Math.abs(s.delta) * 100) / 100))
    : strings.trendPct(dir, String(Math.round(Math.abs(s.deltaRatio) * 100)));
}

/** Shared dual summary — "Trending up 12%. vs benchmark Trending up 4%. …" */
export function dualSummary(
  primary: readonly Value[],
  compare: readonly Value[],
  fmt: (n: number) => string,
  strings: VsStrings,
  seriesStrings: SeriesStrings,
): string {
  const p = seriesStats(primary);
  const c = seriesStats(compare);
  if (!p) return strings.noData;
  if (!c) return trendClause(primary, seriesStrings);
  if (primary.length === compare.length && primary.every((v, i) => v === compare[i]))
    return strings.vsMatching;
  return strings.vs(
    trendClause(primary, seriesStrings).replace(/\.$/, ""),
    trendClause(compare, seriesStrings)
      .replace(/^Trending /, "")
      .replace(/\.$/, ""),
    fmt(p.last),
    fmt(c.last),
  );
}

export interface DualSparklineProps {
  data: readonly Value[];
  /** The benchmark series — without it, use Sparkline (enforced by types). */
  compare: readonly Value[];
  /** Names the reference in summaries/announcements. */
  compareLabel?: string | undefined;
  curve?: Curve | undefined;
  /** Normal-range band behind both (shared grammar). */
  band?: readonly [number, number] | undefined;
  /** `"last"` labels both endpoints (coincident → one label). */
  label?: "last" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: VsStrings | undefined;
  seriesStrings?: SeriesStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function DualSparkline(props: DualSparklineProps): ReactNode {
  const {
    data,
    compare,
    curve = "linear",
    band,
    label = "none",
    domain,
    width = 60,
    height = 16,
    color,
    format,
    locale,
    strings = EN_VS,
    seriesStrings = EN_SERIES,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (compare.every((v) => !Number.isFinite(v ?? Number.NaN))) {
    devWarn("<DualSparkline> compare all-null — use Sparkline.");
  }

  const fmt = makeFormatter(format, locale);
  const fontSize = Math.max(5, Math.min(Math.round(height * 0.4), 8));
  const lastText =
    label === "last"
      ? [...data].reverse().find((v): v is number => Number.isFinite(v ?? Number.NaN))
      : undefined;
  const geo = dualSparklineGeometry({
    width,
    height,
    primary: data,
    compare,
    domain,
    band,
    curve,
    gutterCh: lastText !== undefined ? fmt(lastText).length : 0,
    fontSize,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? dualSummary(data, compare, fmt, strings, seriesStrings));

  // annotations host contract: Marker x = data INDEX (over the shared x-range),
  // Threshold/TargetZone y = data values on the shared value scale.
  const n = Math.max(data.length, compare.length);
  const ann = resolveAnnotations(children, {
    x: (i) =>
      n > 1
        ? geo.plot.x0 + (i * (geo.plot.x1 - geo.plot.x0)) / (n - 1)
        : (geo.plot.x0 + geo.plot.x1) / 2,
    y: scaleLinear(geo.domain, [geo.plot.y1, geo.plot.y0]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-dual ${className}` : "mc-dual"}
      style={style}
    >
      {geo.band ? (
        <rect
          x={geo.band.x}
          y={geo.band.y}
          width={geo.band.width}
          height={geo.band.height}
          data-mc-ink="band"
        />
      ) : null}
      {ann.under}
      {geo.dCompare ? (
        <path
          d={geo.dCompare}
          data-mc-ink="muted"
          data-mc-w="support"
          strokeDasharray="4 2"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.dPrimary ? (
        <path
          d={geo.dPrimary}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={color ? { stroke: color } : undefined}
        />
      ) : null}
      {geo.lastCompare && !geo.coincident ? (
        <circle
          cx={geo.lastCompare.x}
          cy={geo.lastCompare.y}
          r={1.5}
          data-mc-ink="muted"
          style={{ fill: "var(--mc-neutral)" }}
        />
      ) : null}
      {geo.lastPrimary ? (
        <circle cx={geo.lastPrimary.x} cy={geo.lastPrimary.y} r={2} data-mc-ink="accent" />
      ) : null}
      {label === "last" && geo.lastPrimary ? (
        <text
          x={geo.lastPrimary.x + 6}
          y={Math.min(Math.max(geo.lastPrimary.y, fontSize * 0.55), height - fontSize * 0.55)}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="start"
          data-mc-ink="accent"
        >
          {fmt(geo.lastPrimary.value)}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
