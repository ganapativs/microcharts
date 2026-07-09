// <DataDiff> — what changed between two versions? (plan/23 #16). One diverging
// bar per key: removed leftward (--mc-neg), added rightward (--mc-pos), both
// ALWAYS drawn on one symmetric shared scale. Net is a summary tick, never a
// replacement for the two bars (a +500/−480 churn must never look like +20/−0).
// Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { round2 } from "../../core/types.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { devWarn } from "../../core/dev.js";
import { EN_DATA_DIFF, type DataDiffStrings } from "../../core/strings-data-diff.js";
import { dataDiffGeometry, type DataDiffGeometry } from "./geometry.js";

const signed = (n: number, fmt: (v: number) => string): string =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n))}`;

/** Factual diff summary. Shared with the interactive entry. */
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
  /** `"none"` keeps input order (often meaningful); `"net"`/`"magnitude"` reorder. */
  sort?: "none" | "net" | "magnitude" | undefined;
  /** `"totals"` prints a `+added / −removed` mono footer. */
  label?: "totals" | "none" | undefined;
  /** Shared scale override for cross-chart comparison. */
  domain?: readonly [number, number] | undefined;
  /** Rows beyond `max` (cap 12) are dropped with a dev warning, never truncated silently. */
  max?: number | undefined;
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
    sort = "none",
    label = "none",
    domain,
    max = 12,
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

  const FONT = Math.min(10, Math.max(6, Math.round(height * 0.4)));
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-data-diff ${className}` : "mc-data-diff";

  // rows split the plot height — key tags only fit (and the totals footer only
  // earns its band) when there is vertical room. Drop first under degradation.
  const pad = 2;
  const nRows = Math.min(data.length, Math.max(1, Math.min(12, Math.round(max))));
  const footerH = label === "totals" && height >= 34 ? FONT + 3 : 0;
  const showTotals = footerH > 0;
  const rowH = nRows > 0 ? (height - 2 * pad - footerH) / nRows : 0;
  // a text glyph box measures ~1.6× its fontSize tall, so a tag must be ≤ half
  // the row pitch to never touch its neighbour; only draw tags with real room
  const showTags = labels && rowH >= 10;
  const tagFont = showTags ? Math.max(5, Math.min(FONT, Math.floor(rowH * 0.5))) : FONT;
  const gutterCh = showTags ? Math.max(...data.map((d) => d.key.length), 0) : 0;

  const geo = dataDiffGeometry({
    width,
    height,
    data,
    sort,
    domain,
    max,
    gutterCh,
    fontSize: tagFont,
    footer: footerH,
  });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={summary === false ? false : (summary ?? strings.noData)}
        id={id}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = summary === false ? false : (summary ?? dataDiffSummary(geo, fmt, strings));
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={cls}
      style={rootStyle}
    >
      {/* zero hairline — the axis both directions diverge from */}
      <line
        x1={geo.centerX}
        y1={0}
        x2={geo.centerX}
        y2={height}
        stroke="var(--mc-neutral)"
        strokeOpacity={0.45}
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
      />
      {geo.rows.map((r) => (
        <g key={r.key}>
          {/* removed leftward */}
          {r.removed.width > 0 ? (
            <rect
              x={r.removed.x}
              y={r.y}
              width={r.removed.width}
              height={r.height}
              data-mc-ink="bar"
              shapeRendering="crispEdges"
              style={{ fill: "var(--mc-negative)" }}
            />
          ) : null}
          {/* added rightward */}
          {r.added.width > 0 ? (
            <rect
              x={r.added.x}
              y={r.y}
              width={r.added.width}
              height={r.height}
              data-mc-ink="bar"
              shapeRendering="crispEdges"
              style={{ fill: "var(--mc-positive)" }}
            />
          ) : null}
          {/* 0/0 key — a hairline tick so the key's presence survives */}
          {r.placeholder ? (
            <rect
              x={round2(geo.centerX - 0.5)}
              y={r.y}
              width={1}
              height={r.height}
              data-mc-ink="data"
              style={{ fill: "var(--mc-neutral)", fillOpacity: 0.5 }}
            />
          ) : null}
          {/* net summary tick — opt-in, never a stand-in for the bars */}
          {net && !r.placeholder ? (
            <rect
              x={round2(r.netX - 0.5)}
              y={round2(r.y - 0.8)}
              width={1}
              height={round2(r.height + 1.6)}
              data-mc-ink="data"
              style={{ fill: "var(--mc-neutral)" }}
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
              style={{ fontSize: tagFont, fontVariantNumeric: "tabular-nums" }}
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
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {`+${fmt(geo.totals.added)} / −${fmt(geo.totals.removed)}`}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
