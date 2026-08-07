// <TrendArrow> — direction at glyph size. "Which way is this
// moving?" before any number. Direction is never
// color-alone: the glyph shape IS the direction (up / down / flat). color
// reinforces valence per the `positive` polarity. Magnitude is only spoken by
// `showValue` and the summary — the glyph never scales with it.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, unsigned, type Format } from "../../core/format.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { labelFitsBand } from "../../core/labels.js";
import { trendArrowGeometry, type TrendDirection, type TrendGlyph } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

/** Resolved TrendArrow model — shared by the static and interactive entries. */
export interface TrendArrowModel {
  direction: TrendDirection;
  /** `pos` | `neg` | `flat` (drives the glyph's valence ink). */
  valence: "pos" | "neg" | "flat";
  /** Formatted magnitude (`12%`), or `—` for non-finite input. */
  display: string;
  /** Direction + magnitude, never valence. */
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
  // The GLYPH carries direction, so the number is a magnitude. `unsigned` keeps
  // a caller's `signDisplay: "always"` from printing `+5` beside a down arrow —
  // a sign that contradicts the mark it sits next to.
  const display = finite ? unsigned(fmt(Math.abs(value))) : "—";
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
  /** Which direction is "good" — flips only the color, never the glyph. */
  positive?: "up" | "down" | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  /** Swappable summary templates (defaults to EN). */
  strings?: ScalarStrings | undefined;
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

const SIZE = 16;

export function TrendArrow(props: TrendArrowProps): ReactNode {
  const {
    glyph = "arrow",
    showValue = false,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const model = trendArrowModel(props);
  const geo = trendArrowGeometry({
    width: SIZE,
    height: SIZE,
    direction: model.direction,
    glyph,
    labelSize,
  });

  // Right gutter reserved from the rendered text's char count
  // (0.62em/char over-estimate; never measured).
  // A numeral taller than the 16-unit glyph box straddles both edges of a
  // viewBox `.mc-root` does not clip, so a raised `labelSize` the box cannot
  // seat DROPS the number and hands its gutter back (core/labels degradation).
  const showNumeral = showValue && labelFitsBand(SIZE, geo.fontSize);
  const width = showNumeral
    ? Math.ceil(geo.labelX + model.display.length * geo.fontSize * 0.62 + 1)
    : SIZE;

  const accName = resolveSummary(summary, () => model.summary);
  const ink =
    model.valence === "pos" ? "positive" : model.valence === "neg" ? "negative" : "neutral";

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = { ...style, "--mc-label-px": `${geo.fontSize}px` } as CSSProperties;

  return (
    <Chart
      width={width}
      height={SIZE}
      title={title}
      summary={accName}
      id={id}
      // Symmetric glyph — every direction variant is drawn centred in BOX, so
      // the box itself is the plot box and holds for arrow/triangle/chevron/flat
      // alike. `showValue` only widens the viewBox; the glyph's band is unmoved.
      seat={{ mode: "center", top: 0, bottom: SIZE }}
      className={className ? `mc-trend ${className}` : "mc-trend"}
      style={rootStyle}
    >
      <path d={geo.d} data-mc-ink={ink} />
      {/* `data-mc-ink="label"` is the ink ROLE, not just a color: bare
          `.mc-root text` falls back to `--mc-stroke` (a literal #1a1917) and
          `.mc-root` sets `forced-color-adjust: none`, so High Contrast Mode
          painted that near-black against whatever background the user chose.
          The role picks up the `fill: CanvasText` mapping — and elsewhere quiets
          the number to `--mc-neutral`, which is what a direct value label is
          across the catalog. */}
      {showNumeral ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          fontSize={geo.fontSize}
          dominantBaseline="central"
          textAnchor="start"
          data-mc-ink="label"
        >
          {model.display}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
