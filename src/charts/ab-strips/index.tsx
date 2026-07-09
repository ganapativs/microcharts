// <ABStrips> — did B beat A, by more than the overlap? (plan/23 #13). Two graded
// quantile strips on ONE shared scale: p5–95 outer, p25–75 inner, a median dot,
// row A muted, row B accent. The visible overlap of the middle halves is the
// answer, and the overlap number is always in the summary. Never a bare mean
// bar. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { round2 } from "../../core/types.js";
import { EN_AB, type ABStrings } from "../../core/strings-ab.js";
import { abStripsGeometry, type ABStripsGeometry } from "./geometry.js";

/** Signed percent (or absolute when the base is 0) delta of B vs A. */
export function abDelta(geo: ABStripsGeometry, fmt: (n: number) => string): string {
  if (geo.aMedian === 0)
    return geo.deltaMedian > 0 ? `+${fmt(geo.deltaMedian)}` : fmt(geo.deltaMedian);
  const pct = Math.round((geo.deltaMedian / Math.abs(geo.aMedian)) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

/** Factual A/B summary. Shared with the interactive entry. */
export function abSummary(
  geo: ABStripsGeometry,
  fmt: (n: number) => string,
  labels: readonly [string, string],
  strings: ABStrings,
): string {
  const base = strings.ab(
    labels[1],
    fmt(geo.bMedian),
    labels[0],
    fmt(geo.aMedian),
    abDelta(geo, fmt),
    `${Math.round(geo.overlap * 100)}%`,
  );
  if (geo.overlap >= 1) return base + strings.abNoDiff;
  if (geo.overlap <= 0) return base + strings.abSeparated;
  return base;
}

export interface ABStripsProps {
  /** The two arms. */
  data: { a: readonly number[]; b: readonly number[] };
  /** Row identities for gutter tags + summary (default ["A", "B"]). */
  labels?: readonly [string, string] | undefined;
  /** Which direction of the B−A delta reads as good (colors the delta label). */
  positive?: "up" | "down" | undefined;
  /** `"delta"` (default) states the signed median delta in a gutter. */
  label?: "delta" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: ABStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function ABStrips(props: ABStripsProps): ReactNode {
  const {
    data,
    labels = ["A", "B"] as const,
    positive,
    label = "delta",
    domain,
    width = 80,
    height = 20,
    color,
    format,
    locale,
    strings = EN_AB,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // two stacked rows share the height, so the A/B tags of adjacent rows must
  // not collide — the row centers are only height/2 apart, so keep the font
  // safely under that (real-browser getBBox verified at 80×20, not just craft)
  const FONT = Math.min(8, Math.max(6, Math.round(height * 0.3)));
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-ab-strips ${className}` : "mc-ab-strips";
  const labelChars = Math.max(labels[0].length, labels[1].length);

  const probe = abStripsGeometry({
    width,
    height,
    a: data.a,
    b: data.b,
    labelChars,
    domain,
    fontSize: FONT,
  });
  const showLabel = label === "delta" && probe != null;
  const labelText = showLabel ? abDelta(probe!, fmt) : "";
  const gutterCh = showLabel ? labelText.length : 0;

  const geo = abStripsGeometry({
    width,
    height,
    a: data.a,
    b: data.b,
    labelChars,
    domain,
    gutterCh,
    fontSize: FONT,
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

  const accName = summary === false ? false : (summary ?? abSummary(geo, fmt, labels, strings));
  // B always uses accent; A stays neutral (the baseline) even if `color` is set
  const rowInk = ["var(--mc-neutral)", color ?? "var(--mc-accent)"] as const;
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  // delta valence: which direction is good (sign is also in the text)
  const goodUp = positive !== "down";
  const deltaColor =
    geo.deltaMedian === 0
      ? "var(--mc-neutral)"
      : geo.deltaMedian > 0 === goodUp
        ? "var(--mc-positive)"
        : "var(--mc-negative)";

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
      {geo.rows.map((r, i) => {
        const ink = rowInk[i]!;
        return (
          <g key={labels[i]}>
            {/* p5–95 outer band — faintest */}
            <rect
              x={r.outer.x}
              y={round2(r.y - 0.9)}
              width={r.outer.width}
              height={1.8}
              rx={0.9}
              data-mc-ink="band"
              style={{ fill: ink, fillOpacity: 0.16 }}
            />
            {/* p25–75 inner (middle half) — stronger; the overlap reads here */}
            <rect
              x={r.inner.x}
              y={round2(r.y - 2)}
              width={r.inner.width}
              height={4}
              rx={1.5}
              data-mc-ink="band"
              style={{ fill: ink, fillOpacity: 0.34 }}
            />
            {/* median dot */}
            <circle cx={r.median.x} cy={r.y} r={1.6} style={{ fill: ink }} />
            {/* row tag */}
            <text
              x={round2(2)}
              y={r.y}
              textAnchor="start"
              dominantBaseline="central"
              data-mc-ink="label"
              fontSize={FONT}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={round2(height / 2)}
          textAnchor="start"
          dominantBaseline="central"
          fontSize={FONT}
          style={{ fontVariantNumeric: "tabular-nums", fill: deltaColor }}
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
