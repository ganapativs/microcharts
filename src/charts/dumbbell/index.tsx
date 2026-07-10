// <Dumbbell> — where each row started and ended (plan/22 #11, S2-paired).
// Static, hook-free, RSC-safe. Hollow → filled reads as before → after without
// a legend; with `positive` the connector takes the valence token by direction.
// For RANGES (min→max) docs require dropping `positive` — a range has no
// valence and coloring it would invent one.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { round2 } from "../../core/types.js";
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
import { dumbbellGeometry } from "./geometry.js";
import { truncateLabel } from "../dot-plot/geometry.js";

export interface DumbbellDatum {
  label?: string | undefined;
  from: number;
  to: number;
}

/** Percent-change clause for a pair (shared with the interactive entry). */
export function pairChange(from: number, to: number): { dir: "up" | "down"; pct: string } | null {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return null;
  const dir = to > from ? "up" : "down";
  const pct = from === 0 ? "" : `${Math.round(Math.abs((to - from) / Math.abs(from)) * 100)}%`;
  return { dir, pct };
}

/** Factual paired summary — single row: "From 62,000 to 84,000, up 35%.";
 *  multi-row leads with the largest change. Shared with the interactive entry. */
export function dumbbellSummary(
  data: readonly DumbbellDatum[],
  fmt: (n: number) => string,
  strings: PairedStrings,
): string {
  const finite = data.filter((d) => Number.isFinite(d.from) && Number.isFinite(d.to));
  if (finite.length === 0) return strings.noData;
  if (finite.length === 1) {
    const d = finite[0]!;
    const c = pairChange(d.from, d.to);
    return c ? strings.fromTo(fmt(d.from), fmt(d.to), c.dir, c.pct) : strings.flatPair(fmt(d.from));
  }
  let top = finite[0]!;
  let topDelta = 0;
  finite.forEach((d, i) => {
    const delta = Math.abs(d.to - d.from);
    if (i === 0 || delta > topDelta) {
      top = d;
      topDelta = delta;
    }
  });
  const c = pairChange(top.from, top.to);
  if (!c) return strings.flatPair(fmt(top.from));
  return strings.rows(finite.length, top.label ?? "", c.dir, c.pct);
}

export interface DumbbellProps {
  data: readonly DumbbellDatum[];
  /** Index or label to accent. */
  highlight?: number | string | undefined;
  /** Direction valence for CHANGES; drop it for ranges (no valence). */
  positive?: "up" | "down" | undefined;
  /** `"value"` anchors from/to values outside the dots (drops when tight). */
  label?: "value" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: PairedStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function Dumbbell(props: DumbbellProps): ReactNode {
  const {
    data,
    highlight,
    positive,
    label = "none",
    domain,
    width = 60,
    color,
    format,
    locale,
    strings = EN_PAIRED,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  const height = props.height ?? data.length * 12;

  if (data.length > 5) {
    devWarn(`<Dumbbell> ${data.length} rows — past 5 the comparison blurs (documented cap).`);
  }

  const fontSize = 6;
  const hasLabels = data.some((d) => d.label);
  const maxLabelChars = hasLabels
    ? Math.min(
        6,
        data.reduce((m, d) => Math.max(m, d.label?.length ?? 0), 0),
      )
    : 0;
  const geo = dumbbellGeometry({
    width,
    height,
    pairs: data.map((d) => ({ from: d.from, to: d.to })),
    domain,
    gutterCh: maxLabelChars > 0 ? maxLabelChars + 1 : 0,
    fontSize,
  });
  const fmt = makeFormatter(format, locale);
  const accName = summary === false ? false : (summary ?? dumbbellSummary(data, fmt, strings));

  const goodDir = positive === "down" ? -1 : 1;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-dumbbell ${className}` : "mc-dumbbell"}
      style={style}
    >
      {geo.rows.map((row) => {
        const d = data[row.index]!;
        const isHl = highlight !== undefined && (highlight === d.label || highlight === row.index);
        // valence ink role by direction; a plain range (no `positive`) stays muted
        const connectorInk =
          positive !== undefined && row.dir !== 0
            ? row.dir === goodDir
              ? "positive"
              : "negative"
            : "muted";
        // from === to → single dot, connector omitted (honest degenerate)
        const single = row.x0 !== null && row.x0 === row.x1;
        // connector stops at each dot's EDGE, not its center — otherwise it
        // pierces the hollow "before" ring (r 1.7) and shows through. Inset by
        // the mark radius along the row; if the dots nearly touch, drop the
        // connector (nothing legible to draw between them).
        const connector = (() => {
          if (single || row.x0 === null || row.x1 === null) return null;
          const dir = row.x1 >= row.x0 ? 1 : -1;
          const x0 = round2(row.x0 + dir * 1.7);
          const x1 = round2(row.x1 - dir * 2);
          return dir > 0 ? (x1 > x0 ? { x0, x1 } : null) : x1 < x0 ? { x0, x1 } : null;
        })();
        const est = (v: number) => fmt(v).length * fontSize * 0.62;
        const leftX = row.x0 !== null && row.x1 !== null ? Math.min(row.x0, row.x1) : null;
        const rightX = row.x0 !== null && row.x1 !== null ? Math.max(row.x0, row.x1) : null;
        // values render only when BOTH the span is wide enough and each label's
        // estimate stays inside the viewBox (pure arithmetic — plan/18)
        const leftVal = leftX !== null ? (row.x0! <= row.x1! ? d.from : d.to) : 0;
        const rightVal = rightX !== null ? (row.x0! <= row.x1! ? d.to : d.from) : 0;
        const showValues =
          label === "value" &&
          leftX !== null &&
          rightX !== null &&
          rightX - leftX >= Math.max(est(leftVal), est(rightVal)) &&
          leftX - 4 - est(leftVal) >= 0 &&
          rightX + 4 + est(rightVal) <= width;
        return (
          <g key={row.index}>
            {d.label ? (
              <text
                x={geo.labelX}
                y={row.y}
                fontSize={fontSize}
                dominantBaseline="central"
                textAnchor="end"
                data-mc-ink="label"
              >
                {truncateLabel(d.label)}
              </text>
            ) : null}
            {!single && row.x0 !== null && row.x1 !== null && connector !== null ? (
              <line
                x1={connector.x0}
                y1={row.y}
                x2={connector.x1}
                y2={row.y}
                data-mc-ink={connectorInk}
                vectorEffect="non-scaling-stroke"
                // 1.25 sits in the "1.2–1.8 secondary mark" justified-literal
                // band (FOUNDATION.md §1.2) — a touch thinner than full data ink.
                strokeWidth={1.25}
              />
            ) : null}
            {row.x0 !== null && !single ? (
              // hollow ring: circles can't take the fill-based accent ink role,
              // so the color stays a justified literal (same pattern as
              // calibration-strip's low-support marks); width still uses the role.
              <circle
                cx={row.x0}
                cy={row.y}
                r={1.7}
                fill="none"
                stroke={isHl ? "var(--mc-accent)" : (color ?? "var(--mc-stroke)")}
                data-mc-w="support"
              />
            ) : null}
            {row.x1 !== null ? (
              <circle
                cx={row.x1}
                cy={row.y}
                r={2}
                data-mc-ink={isHl ? "accent" : "point"}
                style={!isHl && color ? { fill: color } : undefined}
              />
            ) : null}
            {showValues && leftX !== null && rightX !== null ? (
              <>
                <text
                  x={leftX - 4}
                  y={row.y}
                  fontSize={fontSize}
                  dominantBaseline="central"
                  textAnchor="end"
                >
                  {fmt(leftVal)}
                </text>
                <text
                  x={rightX + 4}
                  y={row.y}
                  fontSize={fontSize}
                  dominantBaseline="central"
                  textAnchor="start"
                >
                  {fmt(rightVal)}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
      {children}
    </Chart>
  );
}
