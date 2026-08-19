// <StackedArea> — how did the COMPOSITION shift over time.
// ≤ 3 series hard cap (thickness reading degrades combinatorially); the total
// is always zero-anchored. `style="ridge"` = identical stacking math rendered
// with smooth, opaque, crest-lit silhouettes — editorial texture, zero
// semantic change.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeUnitFormatter, type Format } from "../../core/format.js";
import { resolveSummary } from "../../core/summary.js";
import { labelFont } from "../../core/labels.js";
import type { Curve } from "../../core/path.js";
import { EN_STACK, type StackStrings } from "../../core/strings-stack.js";
import { chartSide, isFiniteValue, type Value } from "../../core/types.js";
import { stackedAreaGeometry, stackedAreaLabelsFit } from "./geometry.js";

export interface StackedAreaDatum {
  label?: string | undefined;
  values: readonly Value[];
}

/** Shared composition-shift summary — the leader at the last column. */
export function stackedAreaSummary(
  data: readonly StackedAreaDatum[],
  sharesAtEnd: readonly number[],
  points: number,
  pctFmt: (n: number) => string,
  strings: StackStrings,
): string {
  if (data.length === 0 || points === 0) return strings.noData;
  let top = 0;
  sharesAtEnd.forEach((s, i) => {
    if (s > (sharesAtEnd[top] ?? 0)) top = i;
  });
  return strings.shareShift(
    data.length,
    points,
    data[top]?.label ?? `Series ${top + 1}`,
    pctFmt(sharesAtEnd[top] ?? 0),
  );
}

export interface StackedAreaProps {
  /** ≤ 3 series (hard cap). */
  data: readonly StackedAreaDatum[];
  /** `"ridge"` — the relocated MountainRidges look; same stack, new skin.
   * */
  mode?: "stacked" | "ridge" | undefined;
  /** `"asc"` puts the smallest series on top (least thickness distortion). */
  order?: "data" | "asc" | undefined;
  /** `"last"` = endpoint share labels per series (deterministic drop-out). */
  label?: "last" | "none" | undefined;
  /** Column whose shares feed `label="last"` (default: final column). Interactive
   *  scrub passes the focused column so the end labels track the crosshair. */
  labelAt?: number | undefined;
  /** Per-series colours, cycled; overrides `--mc-cat-N` for this instance. */
  colors?: readonly string[] | undefined;
  curve?: Curve | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: StackStrings | undefined;
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

const CAT_TOKENS = ["--mc-cat-1", "--mc-cat-2", "--mc-cat-3"];
const CAT_N = CAT_TOKENS.length;

export function StackedArea(props: StackedAreaProps): ReactNode {
  const {
    data,
    mode = "stacked",
    order = "data",
    label = "none",
    labelAt,
    colors,
    curve = "linear",
    domain,
    width: widthProp = 60,
    height: heightProp = 16,
    format,
    locale,
    strings = EN_STACK,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // `Chart` clamps the box for the FRAME; geometry has to clamp it too or the
  // marks land outside a valid viewBox — `height={-40}` drew the top edge at
  // y = -40 and `width={0}` at x = -1, and `.mc-root` is `overflow: visible`,
  // so both spill into the page. Non-finite sides emitted `NaN` coordinates,
  // `--mc-label-px: NaNpx` and a `NaN` seat.
  const width = chartSide(widthProp);
  const height = chartSide(heightProp);

  if (data.length > 3) {
    devWarn("<StackedArea> ≤ 3 series is a hard cap — thickness reading degrades past it.");
  }
  if (data.some((s) => s.values.some((v) => isFiniteValue(v) && v < 0))) {
    devWarn(
      "<StackedArea> negative values in a stacked composition — clamped to 0 (use Waterfall/Sparkline).",
    );
  }

  let series = data.slice(0, 3);
  if (order === "asc") {
    series = [...series].sort(
      (a, b) =>
        a.values.reduce<number>((s, v) => s + (isFiniteValue(v) ? v : 0), 0) -
        b.values.reduce<number>((s, v) => s + (isFiniteValue(v) ? v : 0), 0),
    );
  }

  const fontSize = labelFont(height, 0.3, labelSize);
  const pctFmt = makeUnitFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 });
  // ridge forces smooth silhouettes (documented)
  const usedCurve: Curve = mode === "ridge" ? "smooth" : curve;
  // endpoint labels drop when rows are too dense for the series count — and the
  // gutter goes with them, before geometry reserves it
  const labelled = label === "last" && stackedAreaLabelsFit(height, series.length, fontSize);
  const geo = stackedAreaGeometry({
    width,
    height,
    series: series.map((s) => s.values),
    domain,
    curve: usedCurve,
    gutterCh: labelled ? 4 : 0,
    fontSize,
  });
  const accName = resolveSummary(summary, () =>
    stackedAreaSummary(series, geo.sharesAt.at(-1) ?? [], geo.n, pctFmt, strings),
  );

  // an empty `colors` array is "no override", not `colors[NaN]`: the areas fell
  // back to the cat palette while the top hairlines lost their stroke outright,
  // so one instance rendered half-themed.
  const pal = colors && colors.length > 0 ? colors : undefined;
  const tip =
    labelAt !== undefined && labelAt >= 0 && labelAt < geo.n ? labelAt : Math.max(0, geo.n - 1);
  const tipShares = geo.sharesAt[tip] ?? [];

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = { ...style, "--mc-label-px": `${fontSize}px` } as CSSProperties;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // The stack is zero-anchored and its floor was deliberately flushed to
      // the box bottom, so the composition stands on the text baseline exactly
      // where letters do. Endpoint share labels ride inside the plot, not in a
      // band below it, so they don't move the seat.
      seat={{ mode: "floor", bottom: geo.plot.y1 }}
      className={className ? `mc-stacked ${className}` : "mc-stacked"}
      style={rootStyle}
    >
      {(mode === "ridge" ? [...geo.layers].reverse() : geo.layers).map((layer) => (
        <g key={layer.index}>
          {layer.dArea ? (
            <path
              d={layer.dArea}
              data-mc-cat={(layer.index % CAT_N) + 1}
              // attribute, not inline style (Hypnogram's form): an inline
              // fill-opacity outranks every stylesheet rule, which flattened the
              // `[data-mc-cat]` LIGHTNESS ramp the forced-colors block builds —
              // three bands reading as one CanvasText in High Contrast Mode —
              // and put the value out of a consumer's `:where()` reach.
              fillOpacity={mode === "ridge" ? 1 : 0.8}
              style={pal ? { fill: pal[layer.index % pal.length] } : undefined}
            />
          ) : null}
          {layer.dTop ? (
            <path
              d={layer.dTop}
              fill="none"
              // top-edge hairline: no data-mc-cat stroke mode exists yet
              // (styles.css only element-splits accent/positive/negative/ghost
              // for stroked marks — cat roles are fill-only), so this stays a
              // literal var reference; ridge trades it for a fixed surface
              // "crest light" instead of the category color.
              stroke={
                mode === "ridge"
                  ? "var(--mc-surface, Canvas)"
                  : pal
                    ? pal[layer.index % pal.length]
                    : `var(${CAT_TOKENS[layer.index % CAT_N]})`
              }
              data-mc-w={mode === "ridge" ? "support" : "tick"}
            />
          ) : null}
        </g>
      ))}
      {labelled
        ? geo.layers.map((layer) => (
            <text
              key={`t${layer.index}`}
              x={width - 1}
              // slot from the TOP of the stack: layer 0 is the bottom band, so
              // staggering by `index` printed the column upside down — the top
              // band's share sat beside the bottom band, which is the one
              // mis-read a composition chart cannot afford.
              y={labelY(geo.layers.length - 1 - layer.index, height, fontSize)}
              fontSize={fontSize}
              textAnchor="end"
              data-mc-ink="label"
            >
              {pctFmt(tipShares[layer.index] ?? layer.lastShare)}
            </text>
          ))
        : null}
      {children}
    </Chart>
  );
}

function labelY(slot: number, height: number, fontSize: number): number {
  // stagger endpoint labels down the right edge in stack order. Alphabetic
  // baseline: keep the em-box (≈0.78 above / 0.22 below) inside the viewBox.
  const y = fontSize + slot * fontSize * 1.15;
  const lo = fontSize * 0.78;
  const hi = height - fontSize * 0.22;
  return Math.round(Math.min(Math.max(y, lo), hi) * 100) / 100;
}
