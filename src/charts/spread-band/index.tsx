// <SpreadBand> — which of two series leads, by how much, and since when.
// Subject (a) and reference (b) on ONE shared domain; the SIGNED gap between
// them is filled and split at crossings, so "who is ahead" and "when it flipped"
// read at a glance. The reference whispers (dashed, thinner, neutral); direction
// is carried by fill sign + text, never color alone. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { clamp, scaleLinear } from "../../core/scale.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { makeFormatter, withPlus, type Format } from "../../core/format.js";
import type { Polarity } from "../../core/types.js";
import { EN_SPREAD_BAND, type SpreadBandStrings } from "../../core/strings-spread-band.js";
import { resolveSummary } from "../../core/summary.js";
import {
  gutterFont,
  lastGap,
  spreadBandGeometry,
  type SpreadBandGeometry,
  type SpreadDatum,
} from "./geometry.js";

/** Signed gap string — direction lives in the sign (and the text), not the color. */
export function signedGap(gap: number, fmt: (n: number) => string): string {
  return withPlus(gap, fmt);
}

/** Placeholder names, used for whichever half of the pair the caller omitted. */
export const DEFAULT_SERIES_LABELS: readonly [string, string] = ["A", "B"];

/** Both names, always. A summary names the leader AND the side it leads, so a
 *  pair that is short or blank still needs something to call the other one —
 *  never `undefined` in a sentence. */
export function seriesPair(labels: readonly (string | undefined)[] | undefined): [string, string] {
  return [labels?.[0] || DEFAULT_SERIES_LABELS[0], labels?.[1] || DEFAULT_SERIES_LABELS[1]];
}

/** Leader, gap, and last crossover. */
export function spreadBandSummary(
  geo: SpreadBandGeometry,
  labels: readonly [string, string],
  fmt: (n: number) => string,
  strings: SpreadBandStrings,
): string {
  if (geo.last === null) return strings.noData;
  const gap = geo.last.a - geo.last.b;
  if (geo.coincident || gap === 0) return strings.spreadBandTie;
  const aLeads = gap > 0;
  const [a, b] = seriesPair(labels);
  const leader = aLeads ? a : b;
  const other = aLeads ? b : a;
  const since =
    geo.lastFlip !== null ? strings.spreadBandFlip(geo.lastFlip + 1) : strings.spreadBandNever;
  return strings.spreadBand(leader, other, fmt(Math.abs(gap)), since);
}

export interface SpreadBandProps {
  /** Paired readings: `a` = subject, `b` = reference. Null in either = gap in both. */
  data: readonly SpreadDatum[];
  /** Names the two series in summaries/announcements/label. Default `["A", "B"]`. */
  seriesLabels?: readonly [string, string] | undefined;
  /** Which lead is the good valence — `"down"` flips the fill colors. Default `"up"`. */
  positive?: Polarity | undefined;
  /** `"gap"` (default) states the current signed gap in a right gutter. */
  label?: "gap" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  /** Overrides the subject line stroke only. */
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: SpreadBandStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function SpreadBand(props: SpreadBandProps): ReactNode {
  const {
    data,
    seriesLabels = DEFAULT_SERIES_LABELS,
    positive = "up",
    label = "gap",
    domain,
    width = 80,
    height = 20,
    color,
    format,
    locale,
    strings = EN_SPREAD_BAND,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const fontSize = gutterFont(height);

  // endpoint gap → reserve the label gutter before geometry runs
  const gap = lastGap(data);
  const showLabel = label === "gap" && gap !== null && gap !== 0;
  const labelText = showLabel ? signedGap(gap!, fmt) : "";

  const geo = spreadBandGeometry({
    width,
    height,
    data,
    domain,
    gutterCh: showLabel ? labelText.length : 0,
    fontSize,
  });

  const accName = resolveSummary(summary, () => spreadBandSummary(geo, seriesLabels, fmt, strings));

  // annotations host contract: Marker x = data INDEX, Threshold/TargetZone y =
  // data values on the shared value scale.
  const n = data.length;
  const ann = resolveAnnotations(children, {
    x: (i) =>
      n > 1
        ? geo.plot.x0 + (i * (geo.plot.x1 - geo.plot.x0)) / (n - 1)
        : (geo.plot.x0 + geo.plot.x1) / 2,
    y: scaleLinear(geo.domain, [geo.plot.y1, geo.plot.y0]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  // color encodes valence (which lead is good); position/sign encode who leads.
  // The two signed bands differ only in ink + opacity; render them from one list.
  const aGood = positive !== "down";
  const bands = [
    { d: geo.aLeadBand, ink: aGood ? "positive" : "negative" },
    { d: geo.bLeadBand, ink: aGood ? "negative" : "positive" },
  ] as const;
  const leaderGood = (gap ?? 0) > 0 ? aGood : !aGood;

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
      // The signed fill is bounded by the two lines, not by a zero line, so
      // there is nothing mid-anchored to centre on — the shared plot floor is
      // the frame both series stand in, and it seats on the text baseline.
      seat={{ mode: "floor", bottom: geo.plot.y1 }}
      className={className ? `mc-spread ${className}` : "mc-spread"}
      style={rootStyle}
    >
      {ann.under}
      {!geo.coincident ? (
        <>
          {bands.map((band) =>
            band.d ? (
              <path
                key={band.ink}
                d={band.d}
                data-mc-ink={band.ink}
                fillOpacity={band.ink === "positive" ? 0.3 : 0.28}
              />
            ) : null,
          )}
          {geo.referenceD ? (
            <path
              d={geo.referenceD}
              data-mc-ink="muted"
              data-mc-w="support"
              strokeDasharray="4 2"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </>
      ) : null}
      {geo.subjectD ? (
        <path
          d={geo.subjectD}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={color ? { stroke: color } : undefined}
        />
      ) : null}
      {geo.crossings.map((c) => (
        <circle key={`x${c[0]}-${c[1]}`} cx={c[0]} cy={c[1]} r={1.8} data-mc-ink="point" />
      ))}
      {!geo.coincident && geo.last ? (
        <circle
          cx={geo.last.x}
          cy={geo.last.yb}
          r={1.5}
          data-mc-ink="muted"
          style={{ fill: "var(--mc-neutral)" }}
        />
      ) : null}
      {geo.last ? <circle cx={geo.last.x} cy={geo.last.ya} r={2} data-mc-ink="accent" /> : null}
      {showLabel && geo.last ? (
        <text
          x={geo.last.x + 6}
          y={clamp((geo.last.ya + geo.last.yb) / 2, fontSize * 0.55, height - fontSize * 0.55)}
          fontSize={fontSize}
          dominantBaseline="central"
          data-mc-ink={leaderGood ? "positive" : "negative"}
        >
          {labelText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
