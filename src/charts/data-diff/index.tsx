// <DataDiff> — what changed between two versions? One diverging
// bar per key: removed leftward (--mc-neg). added rightward (--mc-pos). both
// ALWAYS drawn on one symmetric shared scale. Net is a summary tick, never a
// replacement for the two bars (a +500/−480 churn must never look like +20/−0).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { round2 } from "../../core/types.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { devWarn } from "../../core/dev.js";
import { EN_DATA_DIFF, type DataDiffStrings } from "../../core/strings-data-diff.js";
import { dataDiffGeometry, dataDiffLayout, type DataDiffGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

const signed = (n: number, fmt: (v: number) => string): string =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n))}`;

export function dataDiffSummary(
  geo: DataDiffGeometry,
  fmt: (v: number) => string,
  strings: DataDiffStrings,
): string {
  if (geo.largest === null) return strings.dataDiffEmpty(geo.rows.length);
  return strings.dataDiff(
    fmt(geo.totals.added),
    fmt(geo.totals.removed),
    geo.rows.length,
    geo.largest.key,
    signed(geo.largest.net, fmt),
  );
}

export interface DataDiffProps {
  /** Per-key change counts (added/removed are non-negative magnitudes). */
  data: readonly { key: string; added: number; removed: number }[];
  /** In-chart key tags for standalone use (host tables carry keys by default). */
  labels?: boolean | undefined;
  /** A tick at added−removed per row (a summary mark, never the two bars). */
  net?: boolean | undefined;
  /** `"data"` keeps input order (often meaningful); `"net"`/`"magnitude"` reorder. */
  order?: "data" | "net" | "magnitude" | undefined;
  /** `"totals"` prints a `+added / −removed` mono footer. */
  label?: "totals" | "none" | undefined;
  /** Shared scale override for cross-chart comparison. */
  domain?: readonly [number, number] | undefined;
  /** Rows beyond `maxItems` (cap 12) are dropped with a dev warning, never truncated silently. */
  maxItems?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  strings?: DataDiffStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function DataDiff(props: DataDiffProps): ReactNode {
  const {
    data,
    labels = false,
    net = false,
    order = "data",
    label = "none",
    domain,
    maxItems = 12,
    format,
    locale,
    width = 80,
    height = 20,
    strings = EN_DATA_DIFF,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.length > 12)
    devWarn(
      `DataDiff: ${data.length} rows exceeds the 12-row cap; extra rows dropped. Split into a table of DataDiffs (one per group).`,
    );

  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-data-diff ${className}` : "mc-data-diff";

  // Chrome — label font, totals band, key-tag font — resolved in geometry so the
  // interactive entry reads the same numbers. tagFont 0 = no room for tags, and
  // their gutter drops with them (`dataDiffGutter` returns 0 on 0 chars).
  const pad = 2;
  const {
    font: FONT,
    footer: footerH,
    tagFont,
    keyChars,
  } = dataDiffLayout({ data, labels, label, maxItems, width, height });
  const showTotals = footerH > 0;
  const showTags = tagFont > 0;

  // A stack of diverging rows has no floor — added/removed grow sideways from a
  // shared vertical axis — so the row band centres on the cap band. It is the
  // band, not the viewBox: a totals footer steals height off the bottom, which
  // would otherwise drag the rows visibly high on the line.
  const seat = { mode: "center", top: pad, bottom: round2(height - pad - footerH) } as const;

  const geo = dataDiffGeometry({
    width,
    height,
    data,
    order,
    domain,
    maxItems,
    gutterCh: showTags ? keyChars : 0,
    fontSize: tagFont,
    footer: footerH,
  });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        seat={seat}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () => dataDiffSummary(geo, fmt, strings));
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      seat={seat}
      className={cls}
      style={rootStyle}
    >
      <line
        x1={geo.centerX}
        y1={0}
        x2={geo.centerX}
        y2={height}
        data-mc-ink="muted"
        data-mc-w="hair"
        strokeOpacity={0.45}
        vectorEffect="non-scaling-stroke"
      />
      {geo.rows.map((r) => (
        <g key={r.key}>
          {r.removed.width > 0 ? (
            <rect
              x={r.removed.x}
              y={r.y}
              width={r.removed.width}
              height={r.height}
              data-mc-ink="negative"
              shapeRendering="crispEdges"
            />
          ) : null}
          {r.added.width > 0 ? (
            <rect
              x={r.added.x}
              y={r.y}
              width={r.added.width}
              height={r.height}
              data-mc-ink="positive"
              shapeRendering="crispEdges"
            />
          ) : null}
          {r.placeholder ? (
            <rect
              x={round2(geo.centerX - 0.5)}
              y={r.y}
              width={1}
              height={r.height}
              data-mc-ink="neutral"
              style={{ fillOpacity: 0.5 }}
            />
          ) : null}
          {/* Opt-in net tick — not a stand-in for the bars. It overshoots the
              bar by 0.8 at each end so it reads as a tick and not a sliver of
              bar, clamped to the frame: at a punishing row pitch (12 rows in
              10 units) the overshoot on the first and last rows painted outside
              the viewBox, and `.mc-root` is `overflow: visible`. */}
          {net && !r.placeholder ? (
            <rect
              x={round2(r.netX - 0.5)}
              y={round2(Math.max(0, r.y - 0.8))}
              width={1}
              height={round2(Math.min(height, r.y + r.height + 0.8) - Math.max(0, r.y - 0.8))}
              data-mc-ink="neutral"
            />
          ) : null}
          {showTags ? (
            <text
              x={geo.labelX}
              y={round2(r.y + r.height / 2)}
              textAnchor="start"
              dominantBaseline="central"
              data-mc-ink="label"
              fontSize={tagFont}
              // inline font-size beats the zero-specificity `:where(.mc-root
              // text)` rule that would otherwise pin every tag to --mc-label-size
              style={{ fontSize: tagFont }}
            >
              {r.key}
            </text>
          ) : null}
        </g>
      ))}
      {showTotals ? (
        <text
          x={round2(geo.totalWidth - 1)}
          y={round2(height - footerH / 2)}
          textAnchor="end"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
        >
          {`+${fmt(geo.totals.added)} / −${fmt(geo.totals.removed)}`}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
