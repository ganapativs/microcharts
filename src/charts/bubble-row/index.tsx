// <BubbleRow> — roughly how a few magnitudes compare, with physical presence.
// Circle area (r ∝ √value) is the weakest common channel, so precision is LOW
// and value numerals are ON by default — a low-precision channel owes the
// reader the number. For a precise comparison, use MiniBar.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_BUBBLE, type BubbleStrings } from "../../core/strings-bubble.js";
import { makeFormatter, type Format } from "../../core/format.js";
import {
  PAD,
  bubbleLayout,
  bubbleRowGeometry,
  isBubbleValue,
  type BubbleAlign,
} from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface BubbleDatum {
  label: string;
  value: number | null;
}

export interface BubbleRowProps {
  data: readonly BubbleDatum[];
  /** `center` (specimen row, default) or `baseline` (weights on a shelf). */
  align?: BubbleAlign | undefined;
  /** `value` (default), `both` (label + value), or `none`. */
  label?: "value" | "both" | "none" | undefined;
  color?: string | undefined;
  height?: number | undefined;
  gap?: number | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: BubbleStrings | undefined;
  /** Minimum in-chart label size, in viewBox units. Geometry sizes labels from
   *  the mark and floors them at 7; this raises that floor and moves the
   *  reserved gutter with it. A label the box cannot seat at the raised floor
   *  drops rather than shrinking back under it. */
  labelSize?: number | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function bubbleRowSummary(
  data: readonly BubbleDatum[],
  opts: {
    strings?: BubbleStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { strings = EN_BUBBLE, format, locale } = opts;
  const fmt = makeFormatter(format, locale);
  const finite = data.filter((d): d is { label: string; value: number } => isBubbleValue(d.value));
  if (finite.length === 0) return strings.noData;
  let hi = finite[0]!;
  let lo = finite[0]!;
  for (const d of finite) {
    if (d.value > hi.value) hi = d;
    if (d.value < lo.value) lo = d;
  }
  return strings.bubbleRow(data.length, hi.label, fmt(hi.value), lo.label, fmt(lo.value));
}

export function BubbleRow(props: BubbleRowProps): ReactNode {
  const {
    data,
    align = "center",
    label = "value",
    color,
    format,
    locale,
    strings = EN_BUBBLE,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  // Every caller-supplied scalar is resolved here, once, and the same resolver
  // runs in the interactive entry — a raw `height`/`gap`/`fontSize` used to
  // carry NaN straight into the viewBox.
  const {
    height,
    gap,
    fontSize,
    band: labelBand,
    labelY,
    charW,
  } = bubbleLayout({
    height: props.height,
    gap: props.gap,
    fontSize: props.fontSize,
    labelSize,
    label,
  });
  const fmt = makeFormatter(format, locale);
  const fill = color ?? "var(--mc-accent)";

  const text = (i: number): string | null => {
    const d = data[i]!;
    // The geometry already treats anything the area channel can't carry as "no
    // bubble" (it draws the minR presence ring). The numeral has to agree, or a
    // dot meaning "nothing measurable" gets labelled -5.
    if (charW === 0 || !isBubbleValue(d.value)) return null;
    return label === "both" ? `${d.label} ${fmt(d.value)}` : fmt(d.value);
  };
  // Numeral widths feed the geometry so bubbles spread to fit every number — the
  // low-precision channel OWES the reader the value, so none is ever dropped.
  const labelWidths =
    charW === 0
      ? undefined
      : data.map((_, i) => {
          const t = text(i);
          // per-char extent + a full em of breathing room, so numbers under
          // adjacent bubbles never crowd.
          return t ? t.length * charW * fontSize + fontSize : 0;
        });

  const geo = bubbleRowGeometry({
    values: data.map((d) => d.value),
    height,
    gap,
    align,
    pad: PAD,
    labelBand,
    labelWidths,
  });
  const accName = resolveSummary(summary, () =>
    bubbleRowSummary(data, { strings, format, locale }),
  );

  const placed = geo.bubbles
    .map((b) => {
      const t = text(b.index);
      return t === null ? null : { index: b.index, x: b.cx, text: t };
    })
    .filter((p): p is { index: number; x: number; text: string } => p !== null);

  return (
    <Chart
      width={geo.width}
      height={geo.height}
      title={title}
      summary={accName}
      id={id}
      // Numerals, when they render, are the lowest ink and the row stops being
      // symmetric — so they take the floor, and their own text baseline becomes
      // the seat. Seating the bubble band instead would leave the whole numeral
      // band hanging below the line and into the next one. With `label="none"`
      // the align prop decides, because it decides whether there's a floor at
      // all: `baseline` sits the circles on a shelf — weights on a bench — that
      // belongs on the text baseline, while `center` is a symmetric specimen row
      // with nothing underneath it.
      seat={
        labelBand > 0
          ? { mode: "floor", bottom: labelY }
          : align === "baseline"
            ? { mode: "floor", bottom: geo.y1 }
            : { mode: "center", top: geo.y0, bottom: geo.y1 }
      }
      className={className ? `mc-bubble ${className}` : "mc-bubble"}
      style={{ ...style, "--mc-label-px": `${fontSize}px` } as CSSProperties}
    >
      {geo.bubbles.map((b) => (
        <circle
          key={`b${b.index}`}
          cx={b.cx}
          cy={b.cy}
          r={b.r}
          data-mc-ink="accent"
          data-mc-w="hair"
          fillOpacity={0.8}
          style={{ stroke: fill, ...(color ? { fill } : null) }}
        />
      ))}
      {placed.map((p) => (
        <text
          key={`t${p.index}`}
          x={p.x}
          y={labelY}
          fontSize={fontSize}
          textAnchor="middle"
          data-mc-ink="label"
        >
          {p.text}
        </text>
      ))}
      {children}
    </Chart>
  );
}
