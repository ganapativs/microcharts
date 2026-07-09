// <IconArray> — how likely is this, really? (plan/23 #21, S4 scalar rate). A
// stated rate made countable: filled units in a fixed N-unit grid with the
// denominator visible. Static, hook-free, RSC-safe. Two moves kill denominator
// neglect: the ratio label and the fixed grid. No partial-unit fills ever;
// fill order is contiguous reading-order (scattered is harder to count).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { EN_FREQ, type FreqStrings } from "../../core/strings-freq.js";
import type { Polarity } from "../../core/types.js";
import { iconArrayGeometry, type IconArrayGeometry, type IconArrayN } from "./geometry.js";

/** Factual icon-array summary. Shared with the interactive entry. */
export function iconArraySummary(
  geo: IconArrayGeometry,
  pctFmt: (n: number) => string,
  strings: FreqStrings,
): string {
  return strings.iconArray(
    geo.k,
    geo.n,
    pctFmt(geo.k / geo.n),
    geo.note === "normal" ? null : geo.note,
  );
}

export interface IconArrayProps {
  /** The rate, 0–1 (rounded to the nearest whole unit of `of`). */
  value: number;
  /** Denominator / grid size (default 20). */
  of?: IconArrayN | undefined;
  /** `"ratio"` (default, "3 in 20") | `"percent"` | `"none"`. */
  label?: "ratio" | "percent" | "none" | undefined;
  /** Shared cell vocabulary. */
  shape?: "square" | "round" | "dot" | undefined;
  /** Polarity — `"down"` (fewer is better) flips the fill color to the risk tone. */
  positive?: Polarity | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  locale?: string | string[] | undefined;
  strings?: FreqStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function IconArray(props: IconArrayProps): ReactNode {
  const {
    value,
    of = 20,
    label = "ratio",
    shape = "square",
    positive,
    width = 140,
    height = 28,
    color,
    locale,
    strings = EN_FREQ,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // label a touch smaller than the strips so the countable grid stays the hero
  // (~0.5·height, clamped 7–10) — see coverage-strip / plan/12
  const FONT = Math.min(10, Math.max(7, Math.round(height * 0.5)));
  const showLabel = label !== "none";
  const gutterCh = label === "ratio" ? 9 : label === "percent" ? 5 : 0;
  const geo = iconArrayGeometry({ width, height, value, of, shape, gutterCh, fontSize: FONT });

  if (of === 100 && (width < 40 || height < 40)) {
    devWarn("<IconArray> of=100 needs ≥ 40×40 — unit size falls below the crispness floor.");
  }

  const pctFmt = makeFormatter({ style: "percent", maximumFractionDigits: 0 }, locale);
  const accName = summary === false ? false : (summary ?? iconArraySummary(geo, pctFmt, strings));

  const fillColor =
    color ??
    (positive === "down"
      ? "var(--mc-negative)"
      : positive === "up"
        ? "var(--mc-positive)"
        : "var(--mc-accent)");
  const labelText = label === "percent" ? pctFmt(geo.k / geo.n) : `${geo.k} in ${geo.n}`;
  // pin the label size to viewBox units (see coverage-strip / plan/12)
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-icon-array ${className}` : "mc-icon-array"}
      style={rootStyle}
    >
      {geo.units.map((u) =>
        u.filled ? (
          <rect
            key={u.index}
            x={u.x}
            y={u.y}
            width={geo.cell}
            height={geo.cell}
            rx={geo.rx}
            shapeRendering={geo.crisp ? "crispEdges" : undefined}
            data-mc-ink="unit"
            style={{ fill: fillColor }}
          />
        ) : (
          // empty unit — a visible faint-fill slot with a hairline, never a
          // void. Coloring lives in the "unit-off" ink-role rule (styles.css)
          // so forced-colors can remap it; the FILLED unit stays inline (its
          // fill is dynamic — accent/positive/negative by `positive`).
          <rect
            key={u.index}
            x={u.x}
            y={u.y}
            width={geo.cell}
            height={geo.cell}
            rx={geo.rx}
            data-mc-ink="unit-off"
          />
        ),
      )}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
