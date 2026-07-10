// <TapeGauge> — the level right now, which zone it's in, and how fast it's moving,
// with the eye parked in one place (plan/25 §19, plan/17 F1). Static, hook-free,
// RSC-safe. The scale scrolls, the value doesn't; the chevron encodes rate, the
// position encodes level, and the two never blend. NASA-studied instrument.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_TAPE_GAUGE, type TapeGaugeStrings } from "../../core/strings-tape-gauge.js";
import {
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
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: TapeGaugeStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const TONE_FILL: Record<Tone, string> = {
  pos: "var(--mc-positive)",
  neg: "var(--mc-negative)",
  warn: "var(--mc-cat-1)",
  neutral: "var(--mc-neutral)",
};

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
      lo = Math.min(lo, z.from, z.to);
      hi = Math.max(hi, z.from, z.to);
    }
    if (Number.isFinite(lo) && hi > lo) return (hi - lo) * 1.25;
  }
  if (rate != null && Number.isFinite(rate) && rate !== 0) return Math.max(10, 20 * Math.abs(rate));
  return Math.max(10, Math.abs(value) * 0.1) || 10;
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

export function TapeGauge(props: TapeGaugeProps): ReactNode {
  const {
    value,
    rate,
    zones = [],
    span: spanProp,
    rateTiers: tiersProp,
    orientation = "vertical",
    label = "value",
    width = 46,
    height = 60,
    format,
    locale,
    strings = EN_TAPE_GAUGE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const span = spanProp && spanProp > 0 ? spanProp : autoSpan(value, zones, rate);
  const tiers = tiersProp ?? [span / 60, span / 15];
  const fmt = makeFormatter(format, locale);
  const tickFont = 7;
  const vertical = orientation !== "horizontal";
  const geo = tapeGaugeGeometry({ value, span, zones, tick: null, width, height, orientation });
  const accName =
    summary === false
      ? false
      : (summary ?? tapeGaugeSummary(value, rate, tiers, geo.containingZone, strings, fmt));

  const finite = Number.isFinite(value);
  const tier = finite ? chevronTier(rate ?? 0, tiers) : 0;
  const valueText = finite ? fmt(value) : "";

  // the readout is the hero number — sized large, then clamped to fit its gutter
  const est = (chars: number, f: number): number => 0.62 * f * chars;
  const readoutAvail = (vertical ? geo.readout.gutter : width) - 1.6;
  const readoutBase = Math.min(13, Math.max(10, Math.round(Math.min(width, height) * 0.25)));
  // containment wins over a floor at extreme narrow widths (default 46 renders ~11)
  const readoutFont = Math.max(
    5,
    Math.min(readoutBase, readoutAvail / est(valueText.length || 1, 1)),
  );

  // thin tick labels to those that fit their column and don't collide
  const shownLabels: typeof geo.tickLabels = [];
  let lastEnd = -Infinity;
  for (const t of geo.tickLabels) {
    const s = fmt(t.text);
    const w = est(s.length, tickFont);
    if (vertical) {
      if (t.x - w < 0.3) continue; // would spill past the left edge
      if (t.y - lastEnd < tickFont * 1.05) continue; // vertical crowding
      lastEnd = t.y + tickFont * 0.2;
    } else {
      if (t.x - w / 2 < 0.3 || t.x + w / 2 > width - 0.3) continue;
      if (t.x - w / 2 < lastEnd) continue; // horizontal crowding
      lastEnd = t.x + w / 2 + 1;
    }
    shownLabels.push(t);
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
      className={className ? `mc-tape ${className}` : "mc-tape"}
      style={{ ...style, "--mc-label-size": `${tickFont}px` } as CSSProperties}
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
              style={{ fill: TONE_FILL[z.tone], fillOpacity: 0.85 }}
            />
          ))}
          <path
            d={geo.tickPath}
            data-mc-ink="muted"
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
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
              {fmt(t.text)}
            </text>
          ))}
          {/* fixed center pointer + readout */}
          <path d={geo.pointer.path} data-mc-ink="accent" />
          {label === "value" ? (
            <text
              x={geo.pointer.labelX}
              y={geo.pointer.labelY}
              dominantBaseline="central"
              textAnchor="middle"
              fontSize={readoutFont}
              style={{ fontWeight: 700, fill: "var(--mc-stroke)" }}
            >
              {valueText}
            </text>
          ) : null}
          {chevrons.length > 0 ? (
            <path
              d={chevrons.join("")}
              fill="none"
              stroke="var(--mc-accent)"
              strokeWidth={0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </>
      ) : null}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
