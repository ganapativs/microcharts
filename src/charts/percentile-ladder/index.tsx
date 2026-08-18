// <PercentileLadder> — what does the tail look like, not just the median?
// Ticks at chosen percentiles on a zero-anchored track;
// graduated height + accent make the tail read strongest.
// The origin is never cropped (tick distances are the story); a log
// transform is never silent — an in-chart `log` tag renders when it applies.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, makePercentFormatter, type Format } from "../../core/format.js";
import { EN_QUANTILE, type QuantileStrings } from "../../core/strings-quantile.js";
import { clamp } from "../../core/scale.js";
import { chartSide, round2, type Value } from "../../core/types.js";
import { labelFitsY, textGutter } from "../../core/labels.js";
import { percentileLadderGeometry, type PercentileLadderGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export function ladderSummary(
  geo: PercentileLadderGeometry,
  fmt: (n: number) => string,
  ratioFmt: (n: number) => string,
  strings: QuantileStrings,
  /** Percent formatter (FRACTION in) for the tail share. Two fraction digits so
   *  a p99.5 ladder still reads "0.5%"; a literal `${n}%` was an en-US percent. */
  tailFmt: (fraction: number) => string = makePercentFormatter(undefined, 2),
): string {
  if (geo.collapsed) return strings.ladderFlat(fmt(geo.ticks[0]!.value));
  const list = geo.ticks.map((t) => strings.ladderTick(String(t.p), fmt(t.value))).join(", ");
  const lastP = geo.ticks[geo.ticks.length - 1]!.p;
  const tailShare = tailFmt((100 - lastP) / 100);
  const ratio = `${ratioFmt(geo.ratio)}×`;
  return strings.ladder(list, tailShare, ratio);
}

export interface PercentileLadderProps {
  /** Raw sample; the component derives the quantiles. */
  data: readonly Value[];
  /**
   * Percentiles to mark (default `[50, 90, 99]`, 2–4 entries). Each must sit
   * strictly between 0 and 100; anything else drops, and a `ps` with nothing
   * left falls back to the default rather than rendering an empty chart.
   */
  ps?: readonly number[] | undefined;
  /** `"linear"` (default) | `"log"` for long tails (falls back on any value ≤ 0). */
  scale?: "linear" | "log" | undefined;
  /** What the tick labels state (default `"ps"`). */
  label?: "values" | "ps" | "both" | "none" | undefined;
  /** Tick marks (default) or dot marks — dots read calmer over dense text. */
  marks?: "tick" | "dot" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: QuantileStrings | undefined;
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

const LABEL_MIN_WIDTH = 56;
// label size in viewBox units — a touch smaller than the strips (three labels
// must share the track), ~0.5·height clamped 6–9, and `min` (the chart's
// `labelSize`) applied last so it beats the 9-unit cap the way it beats
// `labelFont`'s 11.
// Exported, and NOT named `labelFont`: this chart deliberately diverges from
// the shared `core/labels` helper, and the interactive entry importing that one
// by the same name silently sized the log-tag gutter differently — every tick x
// then shifted between the two entries. One name, one source.
export const ladderFont = (height: number, min?: number | undefined): number =>
  Math.max(min ?? 0, Math.min(9, Math.max(6, Math.round(height * 0.5))));

/** Seats the tick labels, SPREAD FIRST: at most four rungs share the row, so
 *  nudging the labels apart to a minimum pitch keeps all of them rather than
 *  losing one to its neighbour. A spread stands only while every label stays no
 *  nearer another tick than the one it names; past that the reader matches the
 *  label to the wrong rung, which is a misread, not a layout. Where the spread
 *  fails, step two seats each label at its own tick, clamped inside the frame,
 *  under that same rule — interiors first, dropping (→ null) whatever still
 *  collides. A dropped end still reads: the tail tick is the tallest and carries
 *  the flag ink, p50 is the floor. A dropped interior reads as nothing, so it
 *  goes last.
 *
 *  Step two, run endpoints-first, used to be the whole layout, and the interior
 *  was structurally the loser: at the default 80×12 the chart dropped p90 and
 *  showed two of its own three default percentiles.
 * */
export function ladderLabelLayout(
  geo: PercentileLadderGeometry,
  texts: readonly string[],
  width: number,
  font: number,
): (number | null)[] {
  const n = texts.length;
  const xs = texts.map((_, i) => geo.ticks[i]!.x);
  // Half the WIDEST label's reserved gutter, breathing room folded in: one
  // number bounds every label, pitches them and de-collides them.
  const pad = textGutter(Math.max(...texts.map((t) => t.length)), font, 1) / 2;
  // everything left of the track's own pad belongs to the `log` tag
  const lead = geo.track.x0 - 3;
  const min = lead + pad;
  const max = width - pad;
  /** Is this seat still on rung `i` — no nearer any other tick than its own?
   *  (Tick `i` itself compares equal, so it needs no special case.) */
  const owns = (x: number, i: number) => xs.every((t) => Math.abs(x - xs[i]!) <= Math.abs(x - t));
  // The greedy sweep `spreadLabels` runs, inlined without its sort, its null
  // return or its rounding pass: percentiles arrive ascending, so the input
  // order IS the sorted order, and a set that cannot fit falls out of the
  // `x >= min` test below. Calling the shared one measured +114 B gzip on a
  // subpath that ends this change with 11 B under its 3.48 kB budget.
  const spread = xs.map((x) => clamp(x, min, max));
  for (let i = 1; i < n; i++)
    spread[i] = Math.min(Math.max(spread[i]!, spread[i - 1]! + pad * 2), max);
  for (let i = n - 2; i >= 0; i--) spread[i] = Math.min(spread[i]!, spread[i + 1]! - pad * 2);
  if (spread.every((x, i) => x >= min && owns(x, i))) return spread.map(round2);

  const out: (number | null)[] = xs.map(() => null);
  const place = (i: number) => {
    const cx = clamp(xs[i]!, min, max);
    // `min > max` is a gutter wider than the room left over, which inverts the
    // clamp and put half the text in the margin — `.mc-root` is overflow:
    // visible, so that is a spill onto the page, not a clip. Too wide to sit
    // inside the frame is a drop, same as a collision, and so is a clamp that
    // drags the text onto a neighbouring rung.
    if (min > max || !owns(cx, i)) return;
    // round2 like the spread path above: `min` is a sum of thirds and paddings,
    // so a clamped x is 2-dp in exact arithmetic but not in binary floating
    // point, and every coordinate this repo emits is rounded at generation.
    if (out.every((o) => o === null || Math.abs(o - cx) >= pad * 2)) out[i] = round2(cx);
  };
  for (let i = 1; i < n - 1; i++) place(i);
  place(n - 1);
  place(0);
  return out;
}

export function PercentileLadder(props: PercentileLadderProps): ReactNode {
  const {
    data,
    ps,
    scale = "linear",
    label = "ps",
    marks = "tick",
    domain,
    width = 80,
    height = 12,
    color,
    format,
    locale,
    strings = EN_QUANTILE,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // `Chart` clamps the FRAME, so a non-finite `width`/`height` prop left the
  // viewBox valid while every mark inside it went NaN — a chart that announces
  // a full summary and paints nothing. Both sides call the one helper.
  const w = chartSide(width);
  const h = chartSide(height);

  const FONT = ladderFont(h, labelSize);
  const labelY = round2(h - FONT * 0.22 - 0.2);
  const showLabels = label !== "none" && w >= LABEL_MIN_WIDTH && labelFitsY(labelY, FONT, h, false);
  const trackY = round2(h * 0.35);
  const maxHalf = round2(Math.min(3, h * 0.28));
  const bareSeat = {
    mode: "center" as const,
    top: round2(trackY - maxHalf),
    bottom: round2(trackY + maxHalf),
  };
  // scale="log" silently falls back to linear on any value ≤ 0 (docs note it);
  // the in-chart `log` tag renders only when the transform IS applied
  const geo = percentileLadderGeometry({
    width: w,
    height: h,
    data,
    ps,
    scale,
    domain,
    font: FONT,
  });

  const fmt = makeFormatter(format, locale);
  const ratioFmt = makeFormatter({ maximumFractionDigits: 1 }, locale);
  // The tail share is a percent of the sample, not a value — `locale`, never `format`.
  const tailFmt = makePercentFormatter(locale, 2);
  const cls = className ? `mc-percentile-ladder ${className}` : "mc-percentile-ladder";

  if (geo === null) {
    return (
      <Chart
        width={w}
        height={h}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        seat={showLabels ? { mode: "floor", bottom: labelY } : bareSeat}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () =>
    ladderSummary(geo, fmt, ratioFmt, strings, tailFmt),
  );

  const k = geo.ticks.length;
  const rendered = geo.collapsed ? geo.ticks.slice(0, 1) : geo.ticks;

  const labelText = (p: number, value: number): string =>
    label === "values" ? fmt(value) : label === "both" ? `p${p} ${fmt(value)}` : String(p);

  // keep the alphabetic descender (≈0.22·fs) inside the viewBox
  // `ladderFont` floors at 6 viewBox units; under a box that short the label
  // row's ascender clears the top of the frame, so the row DROPS entirely
  // (as it already does under LABEL_MIN_WIDTH) and the graduated ticks — the
  // primary encoding — carry the read on their own.
  const texts = rendered.map((t) => labelText(t.p, t.value));
  const labelX = showLabels ? ladderLabelLayout(geo, texts, w, FONT) : null;
  // pin the label size to viewBox units (see coverage-strip / )
  const rootStyle = { ...style, "--mc-label-px": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={w}
      height={h}
      title={title}
      summary={accName}
      id={id}
      // When the percentile labels render they are the lowest ink by a wide
      // margin — the track deliberately rides high (0.35·h) to clear them — so
      // they take the floor and their own text baseline is the seat. Centring
      // the tick band instead would hang the entire label row below the line.
      // Bare, the ticks straddle the track and nothing is a floor, so the band
      // centres.
      seat={
        showLabels
          ? { mode: "floor", bottom: labelY }
          : { mode: "center", top: geo.y0, bottom: geo.y1 }
      }
      className={cls}
      style={rootStyle}
    >
      <line
        x1={geo.track.x0}
        y1={geo.track.y}
        x2={geo.track.x1}
        y2={geo.track.y}
        data-mc-ink="muted"
        data-mc-w="support"
      />
      {rendered.map((t) => {
        const tail = t.emphasis === k - 1;
        const opacity = k <= 1 ? 1 : 0.45 + 0.55 * (t.emphasis / (k - 1));
        // the tail's default accent now lives in the "flag" ink-role rule
        // (styles.css) so forced-colors can remap it; `color` still overrides.
        const stroke = color;
        return marks === "dot" ? (
          <circle
            key={t.p}
            cx={t.x}
            cy={geo.track.y}
            r={tail ? 2 : 1.5}
            data-mc-ink={tail ? "flag" : "data"}
            style={{ fillOpacity: opacity, ...(stroke ? { fill: stroke } : null) }}
          />
        ) : (
          <line
            key={t.p}
            x1={t.x}
            y1={round2(geo.track.y - t.half)}
            x2={t.x}
            y2={round2(geo.track.y + t.half)}
            data-mc-ink={tail ? "flag" : "data"}
            vectorEffect="non-scaling-stroke"
            style={{
              // hardcoded (not the token) ONLY because this subpath is pinned at the 3 kB
              // hard cap and the token-var string costs ~20 B; base 1.5 == the default
              // mc-stroke-width, so it matches peers at the default theme.
              strokeWidth: tail ? 2 : 1.5,
              opacity,
              ...(stroke ? { stroke } : null),
            }}
          />
        );
      })}
      {labelX
        ? rendered.map((t, i) =>
            labelX[i] === null ? null : (
              <text
                key={t.p}
                x={labelX[i]!}
                y={labelY}
                textAnchor="middle"
                data-mc-ink="label"
                fontSize={FONT}
              >
                {texts[i]}
              </text>
            ),
          )
        : null}
      {/* Full label ink, no fill-opacity: the tag is what keeps the transform
          from being silent, and muting `--mc-neutral` to 0.7 read ~2.4:1 on
          white — under the text floor, and `.mc-root` sets
          forced-color-adjust: none, so the fade survived High Contrast too. */}
      {geo.logTag ? (
        <text
          x={geo.logTag.x}
          y={geo.logTag.y}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
        >
          log
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
