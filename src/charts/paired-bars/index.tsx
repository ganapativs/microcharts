// <PairedBars> — actual vs expected, category by category (,
// S2-referenced). Static, hook-free, RSC-safe. The reference is muted by TWO
// structural cues (opacity AND width), never color alone; value and ref always
// share one zero-anchored domain. Grouped by default — overlay hides small
// over-shoots (documented).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
import { isFiniteValue } from "../../core/types.js";
import { pairedBarsGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface PairedBarsDatum {
  label: string;
  value: number | null;
  ref: number | null;
}

export function pairedBarsSummary(
  data: readonly PairedBarsDatum[],
  fmt: (n: number) => string,
  strings: PairedStrings,
): string {
  const finite = data.filter((d) => isFiniteValue(d.value) && isFiniteValue(d.ref)) as {
    label: string;
    value: number;
    ref: number;
  }[];
  if (finite.length === 0) return strings.noData;
  let top = finite[0]!;
  for (const d of finite) {
    if (Math.abs(d.value - d.ref) > Math.abs(top.value - top.ref)) top = d;
  }
  return strings.pairs(finite.length, top.label, fmt(top.value), fmt(top.ref));
}

export interface PairedBarsProps {
  data: readonly PairedBarsDatum[];
  /** `"overlay"` renders ref as a full-width ghost BEHIND the value bar. */
  mode?: "grouped" | "overlay" | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
  /** Over/under-reference valence — tints the value bar + summary wording. */
  positive?: "up" | "down" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: PairedStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function PairedBars(props: PairedBarsProps): ReactNode {
  const {
    data,
    mode = "grouped",
    orientation = "vertical",
    positive,
    domain,
    width = 60,
    height = 20,
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

  if (data.length > 5) {
    devWarn(`<PairedBars> ${data.length} pairs — past 5 the grouped read blurs (documented cap).`);
  }
  if (data.length > 0 && data.every((d) => !isFiniteValue(d.ref))) {
    devWarn("<PairedBars> every ref is missing — use MiniBar instead.");
  }

  const geo = pairedBarsGeometry({
    width,
    height,
    pairs: data.map((d) => ({ value: d.value, ref: d.ref })),
    domain,
    mode,
    orientation,
  });
  const fmt = makeFormatter(format, locale);
  const accName = resolveSummary(summary, () => pairedBarsSummary(data, fmt, strings));

  const goodOver = positive !== "down";

  // annotations: vertical only (value on y). Horizontal flips axes — pass through.
  const ann =
    orientation === "vertical" && children
      ? resolveAnnotations(children, {
          x: (i) => geo.pitch * Math.round(i) + geo.pitch / 2,
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
      // Both bars in a pair share one zero-anchored domain over the full box, so
      // vertical pairs stand on the box bottom like any column chart. Horizontal
      // puts value on the x-axis — the box becomes a stack of category rows with
      // no floor, and centring on the cap band is the honest seat.
      seat={
        orientation === "vertical"
          ? { mode: "floor", bottom: height }
          : { mode: "center", top: 0, bottom: height }
      }
      className={className ? `mc-paired ${className}` : "mc-paired"}
      style={style}
    >
      {ann.under}
      {geo.pairs.map((p) => {
        const d = data[p.index]!;
        const over = isFiniteValue(d.value) && isFiniteValue(d.ref) ? d.value >= d.ref : null;
        const valueInk =
          positive !== undefined && over !== null
            ? over === goodOver
              ? "positive"
              : "negative"
            : "bar";
        // Growth edge for the entrance, from the value's true sign — the same
        // model as MiniBar. The domain here is zero-anchored, so a negative value
        // hangs on the far side of the baseline and has to grow OUT of it; with
        // no `data-mc-origin` the engine used its per-archetype default (bottom
        // for `rise`, left for `sweep`) and a negative bar animated inward from
        // the box edge toward zero — motion that reads as the value shrinking to
        // its magnitude rather than growing from nothing.
        const origin = !isFiniteValue(d.value)
          ? undefined
          : orientation === "vertical"
            ? d.value < 0
              ? "top"
              : "bottom"
            : d.value < 0
              ? "right"
              : "left";
        return (
          <g key={p.index}>
            {p.refRect ? (
              <rect
                x={p.refRect.x}
                y={p.refRect.y}
                width={p.refRect.w}
                height={p.refRect.h}
                shapeRendering="crispEdges"
                data-mc-ink="neutral"
                fillOpacity={0.55}
              />
            ) : null}
            {p.valueRect ? (
              <rect
                x={p.valueRect.x}
                y={p.valueRect.y}
                width={p.valueRect.w}
                height={p.valueRect.h}
                shapeRendering="crispEdges"
                data-mc-ink={valueInk}
                data-mc-origin={origin}
                style={color ? { fill: color } : undefined}
              />
            ) : null}
          </g>
        );
      })}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
