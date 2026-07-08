// <TrendArrow> — direction at glyph size (plan/22 #1, S4). "Which way is this
// moving?" before any number. Static, hook-free, RSC-safe. Direction is never
// color-alone: the glyph shape IS the direction (up / down / flat), color
// reinforces valence per the `positive` polarity. Magnitude is only spoken by
// `showValue` and the summary — the glyph never scales with it.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { trendArrowGeometry, type TrendDirection, type TrendGlyph } from "./geometry.js";

/** Resolved TrendArrow model — shared by the static and interactive entries. */
export interface TrendArrowModel {
  direction: TrendDirection;
  /** `pos` | `neg` | `flat` (drives the glyph's valence ink). */
  valence: "pos" | "neg" | "flat";
  /** Formatted magnitude (`12%`), or `—` for non-finite input. */
  display: string;
  /** Factual summary — direction + magnitude, never valence (plan/08). */
  summary: string;
}

/** Pure resolution of direction/valence/summary from props. */
export function trendArrowModel(props: TrendArrowProps): TrendArrowModel {
  const { value, flatBand = 0, positive = "up", format, locale, strings = EN_SCALAR } = props;
  const finite = Number.isFinite(value);
  const band = Number.isFinite(flatBand) ? Math.max(0, flatBand) : 0;
  const direction: TrendDirection = !finite
    ? "flat"
    : Math.abs(value) <= band
      ? "flat"
      : value > 0
        ? "up"
        : "down";

  const fmt = makeFormatter(format, locale);
  const display = finite ? fmt(Math.abs(value)) : "—";
  const goodDir = positive === "down" ? "down" : "up";

  return {
    direction,
    valence: direction === "flat" ? "flat" : direction === goodDir ? "pos" : "neg",
    display,
    summary: !finite
      ? strings.noData
      : direction === "flat"
        ? strings.flatChange
        : strings.scalarDir(direction, display),
  };
}

export interface TrendArrowProps {
  /** Signed change; sign → direction, magnitude only via `showValue`/summary. */
  value: number;
  /** Noise floor: |value| ≤ flatBand renders flat — tiny wiggles aren't movement. */
  flatBand?: number | undefined;
  /** `"arrow"` (default legibility) | `"triangle"` (dense cells) | `"chevron"` (inline text). */
  glyph?: TrendGlyph | undefined;
  /** Append the formatted value in a right gutter. */
  showValue?: boolean | undefined;
  /** Which direction is "good" — flips only the color, never the glyph (plan/04 §6). */
  positive?: "up" | "down" | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  /** Swappable summary templates (defaults to EN). */
  strings?: ScalarStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const SIZE = 16;

export function TrendArrow(props: TrendArrowProps): ReactNode {
  const {
    glyph = "arrow",
    showValue = false,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const model = trendArrowModel(props);
  const geo = trendArrowGeometry({ width: SIZE, height: SIZE, direction: model.direction, glyph });

  // Right gutter reserved from the rendered text's char count (plan/18 —
  // 0.62em/char over-estimate; never measured).
  const width = showValue
    ? Math.ceil(geo.labelX + model.display.length * geo.fontSize * 0.62 + 1)
    : SIZE;

  const accName = summary === false ? false : (summary ?? model.summary);
  const ink =
    model.valence === "pos" ? "positive" : model.valence === "neg" ? "negative" : "neutral";

  return (
    <Chart
      width={width}
      height={SIZE}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-trend ${className}` : "mc-trend"}
      style={style}
    >
      <path d={geo.d} data-mc-ink={ink} />
      {showValue ? (
        <text x={geo.labelX} y={geo.labelY} fontSize={geo.fontSize} textAnchor="start">
          {model.display}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
