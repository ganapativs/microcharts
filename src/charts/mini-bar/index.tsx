// <MiniBar> — which category is biggest, and by roughly how much (S2).
// Bars are always zero-anchored; the data's
// own order is the default truth (`order` never silently defaults to ranking —
// weekday order, funnel order carry meaning sorting would destroy). No
// category text at cell size: labels live in the summary + interactive readout.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { EN_CATEGORY, type CategoryStrings } from "../../core/strings-category.js";
import { isFiniteValue } from "../../core/types.js";
import { miniBarGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface MiniBarDatum {
  label: string;
  value: number | null;
}

/** Sorted view of the data per the `order` prop (pure; shared with client). */
export function sortData(
  data: readonly MiniBarDatum[],
  order: "data" | "desc" | "asc",
): readonly MiniBarDatum[] {
  if (order === "data") return data;
  const copy = data.slice();
  copy.sort((a, b) => {
    const av = isFiniteValue(a.value) ? a.value : Number.NEGATIVE_INFINITY;
    const bv = isFiniteValue(b.value) ? b.value : Number.NEGATIVE_INFINITY;
    return order === "desc" ? bv - av : av - bv;
  });
  return copy;
}

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
  order?: "data" | "desc" | "asc" | undefined;
  /** Index or label to emphasize ("this row's own category"). */
  highlight?: number | string | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
  /** Which sign is good — engages pos/neg tokens on signed data. */
  positive?: "up" | "down" | undefined;
  /** Direct max-value readout (vertical only; drops when the box is too short). */
  label?: "none" | "max" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
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
    order = "data",
    highlight,
    orientation = "vertical",
    positive,
    label = "none",
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

  const sorted = sortData(data, order);
  const geo = miniBarGeometry({
    width,
    height,
    values: sorted.map((d) => d.value),
    domain,
    orientation,
  });
  const fmt = makeFormatter(format, locale);
  const accName = resolveSummary(summary, () => miniBarSummary(data, fmt, strings));

  const hasNegative = sorted.some((d) => isFiniteValue(d.value) && d.value < 0);
  const goodSign = positive === "down" ? -1 : 1;
  let maxText: string | undefined;
  let maxIdx = -1;
  let fontSize = 0;
  if (label === "max" && orientation === "vertical") {
    fontSize = labelFont(height, 0.45);
    let maxVal = -Infinity;
    for (let i = 0; i < sorted.length; i++) {
      const v = sorted[i]!.value;
      if (isFiniteValue(v) && v > maxVal) {
        maxVal = v;
        maxIdx = i;
      }
    }
    if (maxIdx >= 0 && labelFitsY(height / 2, fontSize, height)) maxText = fmt(maxVal);
  }

  // annotations host contract: Marker x = category slot (bar center), Threshold/
  // TargetZone y = data values. Only VERTICAL bars carry value on the y-axis;
  // horizontal flips the axes, so an annotation's y would be meaningless there —
  // pass those children straight through untouched (they'd dev-warn if annotations).
  const ann =
    orientation === "vertical" && children
      ? resolveAnnotations(children, {
          x: (i) => {
            const b = geo.bars[Math.round(i)];
            return b ? b.x + b.w / 2 : NaN;
          },
          y: scaleLinear(geo.domain, [height, 0]),
          width,
          height,
          fontSize: annotationFontSize(height),
        })
      : { under: null, over: null, rest: children };

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Two seats, one chart. Vertical bars are zero-anchored columns filling the
      // full box, so the box bottom IS the floor and they stand on the baseline.
      // Horizontal flips the axes: value runs sideways and the box is a stack of
      // category rows with no bottom to stand on, so it centres on the cap band.
      seat={
        orientation === "vertical"
          ? { mode: "floor", bottom: height }
          : { mode: "center", top: 0, bottom: height }
      }
      className={className ? `mc-minibar ${className}` : "mc-minibar"}
      style={
        maxText !== undefined
          ? ({ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties)
          : style
      }
    >
      {ann.under}
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
        // Growth edge follows the bar's TRUE geometric sign (not a valence
        // token): below-zero bars grow from the zero line downward/leftward.
        // The interactive entry reads this to animate each bar from its own
        // baseline edge — so `positive="down"` and unlabeled negatives are honest.
        const origin =
          orientation === "vertical"
            ? b.sign < 0
              ? "top"
              : "bottom"
            : b.sign < 0
              ? "right"
              : "left";
        return (
          <g key={b.index}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              shapeRendering="crispEdges"
              data-mc-ink={ink}
              data-mc-origin={origin}
              style={!isHl && color ? { fill: color } : undefined}
            />
            {maxText !== undefined && i === maxIdx ? (
              <text
                x={b.x + b.w / 2}
                y={Math.max(fontSize * 0.55, b.y - 1)}
                fontSize={fontSize}
                dominantBaseline="auto"
                textAnchor="middle"
                data-mc-ink="label"
              >
                {maxText}
              </text>
            ) : null}
          </g>
        );
      })}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
