// <BubbleRow> — roughly how a few magnitudes compare, with physical presence
// (plan/24 #11, S2). THE catalog's honesty exemplar: circle area (r ∝ √value) is
// the weakest common channel, so precision is LOW and value numerals are ON by
// default — a low-precision channel owes the reader the number. For a precise
// comparison, use MiniBar. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_BUBBLE, type BubbleStrings } from "../../core/strings-bubble.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { bubbleRowGeometry, type BubbleAlign } from "./geometry.js";

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
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

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
  const finite = data.filter(
    (d): d is { label: string; value: number } =>
      typeof d.value === "number" && Number.isFinite(d.value) && d.value >= 0,
  );
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
    height = 30,
    gap = 2,
    format,
    locale,
    strings = EN_BUBBLE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  // Numerals scale with height (floor 7) so they read at the library norm — a
  // fixed size looked ~40 % smaller than every other chart's labels.
  const fontSize = props.fontSize ?? labelFont(height, 0.34);
  const fmt = makeFormatter(format, locale);
  const fill = color ?? "var(--mc-accent)";

  const text = (i: number): string | null => {
    const d = data[i]!;
    if (label === "none" || d.value === null) return null;
    return label === "both" ? `${d.label} ${fmt(d.value)}` : fmt(d.value);
  };
  // Numeral widths feed the geometry so bubbles spread to fit every number — the
  // low-precision channel OWES the reader the value, so none is ever dropped.
  const labelWidths =
    label === "none"
      ? undefined
      : data.map((_, i) => {
          const t = text(i);
          // 0.72 em/char real extent + a full em of breathing room, so numbers
          // under adjacent bubbles never crowd.
          return t ? t.length * 0.72 * fontSize + fontSize : 0;
        });

  const labelBand = label === "none" ? 0 : fontSize + 2;
  const geo = bubbleRowGeometry({
    values: data.map((d) => d.value),
    height,
    gap,
    align,
    pad: PAD,
    labelBand,
    labelWidths,
  });
  const accName =
    summary === false ? false : (summary ?? bubbleRowSummary(data, { strings, format, locale }));

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
      className={className ? `mc-bubble ${className}` : "mc-bubble"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {geo.bubbles.map((b) => (
        <circle
          key={`b${b.index}`}
          cx={b.cx}
          cy={b.cy}
          r={b.r}
          style={{ fill, fillOpacity: 0.8, stroke: fill, strokeWidth: 0.5 }}
        />
      ))}
      {placed.map((p) => (
        <text
          key={`t${p.index}`}
          x={p.x}
          y={geo.height - PAD - fontSize * 0.32}
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
