// <StackedArea> — how did the COMPOSITION shift over time.
// ≤ 3 series hard cap (thickness reading degrades combinatorially); the total
// is always zero-anchored. `style="ridge"` = identical stacking math rendered
// with smooth, opaque, crest-lit silhouettes — editorial texture, zero
// semantic change.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import type { Curve } from "../../core/path.js";
import { EN_STACK, type StackStrings } from "../../core/strings-stack.js";
import { isFiniteValue, type Value } from "../../core/types.js";
import { stackedAreaGeometry } from "./geometry.js";

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
    width = 60,
    height = 16,
    format,
    locale,
    strings = EN_STACK,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

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

  const fontSize = labelFont(height, 0.3);
  const pctFmt = makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 });
  // ridge forces smooth silhouettes (documented)
  const usedCurve: Curve = mode === "ridge" ? "smooth" : curve;
  const geo = stackedAreaGeometry({
    width,
    height,
    series: series.map((s) => s.values),
    domain,
    curve: usedCurve,
    gutterCh: label === "last" ? 4 : 0,
    fontSize,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? stackedAreaSummary(series, geo.sharesAt.at(-1) ?? [], geo.n, pctFmt, strings));

  // endpoint labels drop when rows are too dense for the series count
  const labelsFit = height / Math.max(1, series.length) >= fontSize * 1.1;
  const tip =
    labelAt !== undefined && labelAt >= 0 && labelAt < geo.n ? labelAt : Math.max(0, geo.n - 1);
  const tipShares = geo.sharesAt[tip] ?? [];

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = { ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties;

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
              style={{
                fillOpacity: mode === "ridge" ? 1 : 0.8,
                ...(colors ? { fill: colors[layer.index % colors.length] } : null),
              }}
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
                  : colors
                    ? colors[layer.index % colors.length]
                    : `var(${CAT_TOKENS[layer.index % CAT_N]})`
              }
              data-mc-w={mode === "ridge" ? "support" : "tick"}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </g>
      ))}
      {label === "last" && labelsFit
        ? geo.layers.map((layer) => (
            <text
              key={`t${layer.index}`}
              x={width - 1}
              y={round2Y(geo, layer, height, fontSize)}
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

function round2Y(
  geo: { layers: { dTop: string }[] },
  layer: { index: number },
  height: number,
  fontSize: number,
): number {
  // stagger endpoint labels down the right edge in layer order. Alphabetic
  // baseline: keep the em-box (≈0.78 above / 0.22 below) inside the viewBox.
  const y = fontSize + layer.index * fontSize * 1.15;
  const lo = fontSize * 0.78;
  const hi = height - fontSize * 0.22;
  return Math.round(Math.min(Math.max(y, lo), hi) * 100) / 100;
}
