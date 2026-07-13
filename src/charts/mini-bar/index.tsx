// <MiniBar> — which category is biggest, and by roughly how much (,
// S2). Static, hook-free, RSC-safe. Bars are always zero-anchored; the data's
// own order is the default truth (`sort` never silently defaults to ranking —
// weekday order, funnel order carry meaning sorting would destroy). No
// category text at cell size: labels live in the summary + interactive readout.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { EN_CATEGORY, type CategoryStrings } from "../../core/strings-category.js";
import { isFiniteValue } from "../../core/types.js";
import { miniBarGeometry } from "./geometry.js";

export interface MiniBarDatum {
  label: string;
  value: number | null;
}

/** Sorted view of the data per the `sort` prop (pure; shared with client). */
export function sortData(
  data: readonly MiniBarDatum[],
  sort: "none" | "desc" | "asc",
): MiniBarDatum[] {
  if (sort === "none") return [...data];
  const copy = [...data];
  copy.sort((a, b) => {
    const av = isFiniteValue(a.value) ? a.value : Number.NEGATIVE_INFINITY;
    const bv = isFiniteValue(b.value) ? b.value : Number.NEGATIVE_INFINITY;
    return sort === "desc" ? bv - av : av - bv;
  });
  return copy;
}

/** Factual S2 summary — count + extremes. Shared with the interactive entry. */
export function miniBarSummary(
  data: readonly MiniBarDatum[],
  fmt: (n: number) => string,
  strings: CategoryStrings,
): string {
  const finite = data.filter((d) => isFiniteValue(d.value)) as { label: string; value: number }[];
  if (finite.length === 0) return strings.noData;
  let max = finite[0]!;
  let min = finite[0]!;
  for (const d of finite) {
    if (d.value > max.value) max = d;
    if (d.value < min.value) min = d;
  }
  return strings.categories(finite.length, max.label, fmt(max.value), min.label, fmt(min.value));
}

export interface MiniBarProps {
  data: readonly MiniBarDatum[];
  /** Data-facing reorder — ranking read vs positional read. */
  sort?: "none" | "desc" | "asc" | undefined;
  /** Index or label to emphasize ("this row's own category"). */
  highlight?: number | string | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
  /** Which sign is good — engages pos/neg tokens on signed data. */
  positive?: "up" | "down" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: CategoryStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function MiniBar(props: MiniBarProps): ReactNode {
  const {
    data,
    sort = "none",
    highlight,
    orientation = "vertical",
    positive,
    domain,
    width = 50,
    height = 16,
    color,
    format,
    locale,
    strings = EN_CATEGORY,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.length > 8) {
    devWarn(
      `<MiniBar> ${data.length} categories — this is a cell chart (≤ 8 documented); use a full bar chart.`,
    );
  }

  const sorted = sortData(data, sort);
  const geo = miniBarGeometry({
    width,
    height,
    values: sorted.map((d) => d.value),
    domain,
    orientation,
  });
  const fmt = makeFormatter(format, locale);
  const accName = summary === false ? false : (summary ?? miniBarSummary(data, fmt, strings));

  const hasNegative = sorted.some((d) => isFiniteValue(d.value) && d.value < 0);
  const goodSign = positive === "down" ? -1 : 1;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-minibar ${className}` : "mc-minibar"}
      style={style}
    >
      {geo.bars.map((b, i) => {
        if (b.empty || (b.w === 0 && b.h === 0)) return null;
        const d = sorted[i]!;
        const isHl = highlight !== undefined && (highlight === d.label || highlight === b.index);
        // signed data + declared polarity → valence tokens; otherwise single ink.
        // A highlighted bar always reads as accent — it draws the eye regardless
        // of sign, so it overrides the valence token rather than combining with it.
        const ink = isHl
          ? "accent"
          : positive !== undefined && hasNegative && b.sign !== 0
            ? b.sign === goodSign
              ? "positive"
              : "negative"
            : "bar";
        return (
          <rect
            key={b.index}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            shapeRendering="crispEdges"
            data-mc-ink={ink}
            style={!isHl && color ? { fill: color } : undefined}
          />
        );
      })}
      {children}
    </Chart>
  );
}
