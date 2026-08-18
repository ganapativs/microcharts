// <TapeGauge> — the level right now, which zone it's in, and how fast it's moving,
// with the eye parked in one place.
// The scale scrolls, the value doesn't; the chevron encodes rate, the
// position encodes level, and the two never blend. NASA-studied instrument.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { resolveSummary } from "../../core/summary.js";
import { EN_TAPE_GAUGE, type TapeGaugeStrings } from "../../core/strings-tape-gauge.js";
import { chartSide, isFiniteValue, round2 } from "../../core/types.js";
import { labelFitsY, LABEL_MIN } from "../../core/labels.js";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  NO_ZONES,
  chevronTier,
  tapeGaugeGeometry,
  type Orientation,
  type Tone,
  type Zone,
} from "./geometry.js";

export interface TapeGaugeProps {
  value: number;
  /** Signed units-per-update; drives the chevron tier and live scroll velocity. */
  rate?: number | undefined;
  /** Semantic bands on the scale (tone tokens only). */
  zones?: readonly Zone[] | undefined;
  /** Visible scale extent; fixed during live updates. */
  span?: number | undefined;
  /** Thresholds for 1 and 2 chevrons (default [span/60, span/15]). */
  rateTiers?: [number, number] | undefined;
  orientation?: Orientation | undefined;
  /** `"none"` = pointer-only glyph next to an external number. */
  label?: "value" | "none" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: TapeGaugeStrings | undefined;
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

// zone stripe ink per tone — pos/neg/neutral map to exact ink roles; warn has
// no dedicated role, so it borrows the shared categorical amber (--mc-cat-1),
// matching the same tone→cat-1 convention used for TapeGauge's own warn zones.
const TONE_INK: Record<Tone, Record<string, string | number>> = {
  pos: { "data-mc-ink": "positive" },
  neg: { "data-mc-ink": "negative" },
  warn: { "data-mc-cat": 1 },
  neutral: { "data-mc-ink": "neutral" },
};

/** The floor auto-span already used, and the fallback for a window that isn't
 *  one. */
const MIN_SPAN = 10;
/** A derived span can still overflow (zone bounds a float apart) or arrive NaN
 *  (a non-finite reading), and an unrepresentable window divides every position
 *  on the tape to NaN. One exit for both. */
const finiteSpan = (s: number): number => (Number.isFinite(s) && s > 0 ? s : MIN_SPAN);

/** Auto span: zones extent, else a rate-scaled window, else 10% of |value|. */
export function autoSpan(
  value: number,
  zones: readonly Zone[] | undefined,
  rate: number | undefined,
): number {
  if (zones && zones.length > 0) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const z of zones) {
      // One malformed zone must not poison the window for the good ones.
      if (!isFiniteValue(z.from) || !isFiniteValue(z.to)) continue;
      lo = Math.min(lo, z.from, z.to);
      hi = Math.max(hi, z.from, z.to);
    }
    if (Number.isFinite(lo) && hi > lo) return finiteSpan((hi - lo) * 1.25);
  }
  if (rate != null && Number.isFinite(rate) && rate !== 0)
    return finiteSpan(Math.max(10, 20 * Math.abs(rate)));
  return finiteSpan(Math.max(10, Math.abs(value) * 0.1));
}

/**
 * The window this gauge actually draws, and the rate thresholds derived from
 * it. `span` and `rateTiers` are caller props and only finite ones are a scale:
 * `Infinity` passed the old `span > 0` test, so the zone stripe emitted
 * `y="NaN"`, `[span/60, span/15]` went infinite, and the summary announced
 * "steady" over a rising reading. Announced scale and painted scale have to be
 * the same scale, so both entries resolve through here.
 */
export function resolveTapeScale(opts: {
  value: number;
  span?: number | undefined;
  zones?: readonly Zone[] | undefined;
  rate?: number | undefined;
  rateTiers?: [number, number] | undefined;
}): { span: number; tiers: [number, number] } {
  const span =
    isFiniteValue(opts.span) && opts.span > 0
      ? opts.span
      : autoSpan(opts.value, opts.zones, opts.rate);
  const t = opts.rateTiers;
  return {
    span,
    tiers: t && isFiniteValue(t[0]) && isFiniteValue(t[1]) ? t : [span / 60, span / 15],
  };
}

/** Shared summary — value, rate word (a separate channel), containing zone. */
export function tapeGaugeSummary(
  value: number,
  rate: number | undefined,
  rateTiers: [number, number],
  containingZone: Zone | null,
  strings: TapeGaugeStrings,
  fmt: (n: number) => string,
): string {
  if (!Number.isFinite(value)) return strings.noData;
  const rateClause =
    rate == null || !Number.isFinite(rate)
      ? ""
      : `, ${strings.tapeRates[chevronTier(rate, rateTiers) + 2]}`;
  const zoneClause = containingZone
    ? strings.tapeZone(fmt(containingZone.from), fmt(containingZone.to))
    : "";
  return strings.tapeGauge(fmt(value), rateClause, zoneClause);
}

/** Text width over-estimate: 0.62 em/char at font size `f`. */
const est = (chars: number, f: number): number => 0.62 * f * chars;

/**
 * The size the hero number is painted at — or `null` when it DROPS.
 *
 * The readout is sized to its gutter, then dropped below the library's 7-unit
 * floor (see the degradation note in the component): a small gauge shows no
 * number at all. One shared function, because the interactive entry reveals the
 * value on hover exactly when this returns `null` — so the chip can never
 * double up with the painted numeral, nor leave the reader with neither.
 */
export function tapeGaugeReadoutFont(opts: {
  valueText: string;
  gutter: number;
  band: number;
  labelY: number;
  width: number;
  height: number;
  vertical: boolean;
  /** Minimum label size in viewBox units (the chart's `labelSize` prop). */
  labelSize?: number | undefined;
}): number | null {
  const { valueText, gutter, band, labelY, width, height, vertical } = opts;
  if (!valueText) return null;
  const min = opts.labelSize ?? LABEL_MIN;
  const avail = (vertical ? gutter : width) - 1.6;
  const base = Math.max(
    min,
    Math.min(13, Math.max(10, Math.round(Math.min(width, height) * 0.25))),
  );
  const font = Math.max(5, Math.min(base, avail / est(valueText.length || 1, 1), band));
  return font >= min && labelFitsY(labelY, font, height) ? font : null;
}

export function TapeGauge(props: TapeGaugeProps): ReactNode {
  const {
    value,
    rate,
    zones = NO_ZONES,
    span: spanProp,
    rateTiers: tiersProp,
    orientation = "vertical",
    label = "value",
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    format,
    locale,
    strings = EN_TAPE_GAUGE,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // The box drives every mark, the readout's own size, the tick drop-out rule
  // and the seat — none of which `Chart`'s own clamp reaches (see `chartSide`).
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);
  const { span, tiers } = resolveTapeScale({
    value,
    span: spanProp,
    zones,
    rate,
    rateTiers: tiersProp,
  });
  const fmt = makeFormatter(format, locale);
  // The tick scale sets at the library floor; `labelSize` lifts it, and a tick
  // that no longer clears its column or its neighbour drops (see `shownLabels`).
  const tickFont = Math.max(LABEL_MIN, labelSize ?? 0);
  const vertical = orientation !== "horizontal";
  const geo = tapeGaugeGeometry({ value, span, zones, tick: null, width, height, orientation });
  const accName = resolveSummary(summary, () =>
    tapeGaugeSummary(value, rate, tiers, geo.containingZone, strings, fmt),
  );

  const finite = Number.isFinite(value);
  const tier = finite ? chevronTier(rate ?? 0, tiers) : 0;
  const valueText = finite ? fmt(value) : "";

  // The readout is the hero number — sized large, clamped to fit its gutter,
  // and DROPPED below the 7-unit floor rather than rendered unreadably small
  // (`tapeGaugeReadoutFont` owns both rules; the interactive entry reads the
  // same function to know when hover must reveal the value instead). Pure
  // arithmetic: the static path may never measure text.
  const readoutFont =
    tapeGaugeReadoutFont({
      valueText,
      gutter: geo.readout.gutter,
      band: geo.readout.band,
      labelY: geo.pointer.labelY,
      width,
      height,
      vertical,
      labelSize,
    }) ?? 0;
  const showReadout = readoutFont > 0;

  // thin tick labels to those that fit their column and don't collide; the
  // formatted string is cached here so render never re-runs Intl per label
  const shownLabels: ((typeof geo.tickLabels)[number] & { s: string })[] = [];
  let lastEnd = -Infinity;
  for (const t of geo.tickLabels) {
    const s = fmt(t.text);
    const w = est(s.length, tickFont);
    // A tick near either end of the scale sits within half a line of the box
    // edge, so its numeral would hang out of the viewBox. Those ticks keep their
    // mark and DROP their label — the neighbours still name the scale, and the
    // dropped one costs no reserved space because tick labels never had a
    // gutter. Pure arithmetic: the static path may never measure text.
    if (!labelFitsY(t.y, tickFont, height)) continue;
    if (vertical) {
      if (t.x - w < 0.3) continue; // would spill past the left edge
      if (t.y - lastEnd < tickFont * 1.05) continue; // vertical crowding
      lastEnd = t.y + tickFont * 0.2;
    } else {
      if (t.x - w / 2 < 0.3 || t.x + w / 2 > width - 0.3) continue;
      if (t.x - w / 2 < lastEnd) continue; // horizontal crowding
      lastEnd = t.x + w / 2 + 1;
    }
    shownLabels.push({ ...t, s });
  }

  // chevron marks stacked from the pointer in the rate's direction
  const chevrons: string[] = [];
  if (tier !== 0) {
    const n = Math.abs(tier);
    const up = tier > 0;
    // clear the readout number: first chevron sits just past its half-height
    const clearV = readoutFont / 2 + 2.5;
    for (let k = 0; k < n; k++) {
      if (vertical) {
        const y = geo.pointer.labelY + (up ? -(clearV + k * 3) : clearV + k * 3);
        chevrons.push(
          up
            ? `M${geo.pointer.labelX - 2} ${round2(y + 1)}l2 -1.6l2 1.6`
            : `M${geo.pointer.labelX - 2} ${round2(y - 1)}l2 1.6l2 -1.6`,
        );
      } else {
        const clearH = est(valueText.length || 1, readoutFont) / 2 + 3;
        const x = geo.pointer.labelX + (up ? clearH + k * 3 : -clearH - k * 3);
        chevrons.push(
          up
            ? `M${round2(x - 1)} ${geo.pointer.labelY - 2}l1.6 2l-1.6 2`
            : `M${round2(x + 1)} ${geo.pointer.labelY - 2}l-1.6 2l1.6 2`,
        );
      }
    }
  }

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // The whole box is the instrument — a scale that scrolls past a pointer
      // parked at its middle — and nothing in it stands on a bottom edge, so it
      // centres on the cap band. Centring the box lands the anchor on that fixed
      // pointer line in either orientation, which is the one place the eye reads.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-tape ${className}` : "mc-tape"}
      style={{ ...style, "--mc-label-px": `${tickFont}px` } as CSSProperties}
    >
      {finite ? (
        <>
          {geo.zoneRects.map((z, i) => (
            <rect
              key={i}
              x={z.x}
              y={z.y}
              width={z.width}
              height={z.height}
              shapeRendering="crispEdges"
              fillOpacity={0.85}
              {...TONE_INK[z.tone]}
            />
          ))}
          <path d={geo.tickPath} data-mc-ink="muted" data-mc-w="hair" />
          {shownLabels.map((t, i) => (
            <text
              key={i}
              x={t.x}
              y={t.y}
              dominantBaseline="central"
              textAnchor={t.anchor}
              fontSize={tickFont}
              data-mc-ink="label"
            >
              {t.s}
            </text>
          ))}
          {/* fixed center pointer + readout. The pointer is a CLOSED triangle;
              the accent-path CSS rule strokes (not fills) accent paths, so an
              inline fill is needed for a solid arrow. The role is kept for the
              forced-colors Highlight mapping. */}
          <path d={geo.pointer.path} data-mc-ink="accent" style={{ fill: "var(--mc-accent)" }} />
          {label === "value" && showReadout ? (
            <text
              x={geo.pointer.labelX}
              y={geo.pointer.labelY}
              dominantBaseline="central"
              textAnchor="middle"
              fontSize={readoutFont}
              // The root pins `--mc-label-px` to the TICK size (7), and
              // `:where(.mc-root text)` outranks the presentation attribute — so
              // the hero number was painted at tick size while its clearance was
              // reserved for 7–13. An inline font-size is the one thing that
              // beats the rule (DataDiff does the same for its two-size layout).
              style={{ fontSize: readoutFont, fontWeight: 700 }}
            >
              {valueText}
            </text>
          ) : null}
          {chevrons.length > 0 ? (
            <path
              d={chevrons.join("")}
              data-mc-ink="accent"
              data-mc-w="support"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </>
      ) : (
        // No reading: the instrument is still there, so its rail and an unfilled
        // pointer are drawn as chrome (the Thermometer's empty-channel rule).
        // A blank box would read as "no chart"; a zeroed scale would read as a
        // real reading of zero. Neither is true — there is simply no value. One
        // path carries both marks (rail then pointer) to keep the node count and
        // the byte cost of a state nobody plots at a minimum.
        <path
          d={
            (vertical
              ? `M${geo.scaleEdge} 1V${round2(height - 1)}`
              : `M1 ${geo.scaleEdge}H${round2(width - 1)}`) + geo.pointer.path
          }
          data-mc-ink="muted"
          data-mc-w="hair"
          style={{ fill: "none", strokeOpacity: 0.55 }}
        />
      )}
      {children}
    </Chart>
  );
}
