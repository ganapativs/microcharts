// <StationGlyph> — a full weather observation in one character.
// Static, hook-free, RSC-safe. Sky cover fills the center disc, a
// wind barb gives direction + quantized speed (reused from WindBarb), and up to
// three corner numerals carry temperature, dew point, and pressure. One glyph,
// four channels, no legend — the meteorologist's station model, shrunk to a word.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_STATION_GLYPH, type StationGlyphStrings } from "../../core/strings-station-glyph.js";
import { octant } from "../../core/strings-wind-barb.js";
import { stationGlyphGeometry, stationLayout } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface Wind {
  /** Degrees, from-direction (0 = north, clockwise). */
  direction: number;
  magnitude: number;
}

export interface StationGlyphProps {
  /** Sky cover 0–1 (0 clear, 1 overcast); fills the center disc. */
  cloud?: number | undefined;
  wind?: Wind | undefined;
  /** Wind-barb quantum (each full barb). */
  step?: number | undefined;
  /** Upper-left numeral. */
  temp?: number | undefined;
  /** Lower-left numeral. */
  dewpoint?: number | undefined;
  /** Upper-right numeral. */
  pressure?: number | undefined;
  /** Corner identifier (top-left). */
  station?: string | undefined;
  /** Disc + barb square edge in viewBox units. */
  size?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: StationGlyphStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — station, wind (a channel), sky word, then the numerals. */
export function stationGlyphSummary(
  props: Pick<
    StationGlyphProps,
    "cloud" | "wind" | "step" | "temp" | "dewpoint" | "pressure" | "station"
  >,
  strings: StationGlyphStrings,
  fmt: (n: number) => string,
): string {
  const { cloud, wind, step = 10, temp, dewpoint, pressure, station = "" } = props;
  const f = cloud == null || !Number.isFinite(cloud) ? 0 : Math.max(0, Math.min(1, cloud));
  const okta = Math.round(f * 4);

  let windClause = "";
  if (wind && Number.isFinite(wind.magnitude)) {
    if (Math.abs(wind.magnitude) < step / 4) {
      windClause = strings.stationCalm;
    } else {
      const dir = wind.magnitude < 0 ? wind.direction + 180 : wind.direction;
      const deg = Math.round(((dir % 360) + 360) % 360);
      windClause = strings.stationWind(
        strings.compass8[octant(deg)]!,
        fmt(Math.abs(wind.magnitude)),
      );
    }
  }

  const td = [temp, dewpoint]
    .filter((v): v is number => v != null && Number.isFinite(v))
    .map((v) => `${fmt(v)}°`)
    .join(" / ");
  const parts: string[] = [];
  if (td) parts.push(td);
  if (pressure != null && Number.isFinite(pressure)) parts.push(fmt(pressure));
  const fieldsClause = parts.length ? `, ${parts.join(", ")}` : "";

  return strings.stationGlyph(station, windClause, strings.stationSky[okta]!, fieldsClause);
}

export function StationGlyph(props: StationGlyphProps): ReactNode {
  const {
    cloud,
    wind,
    step = 10,
    temp,
    dewpoint,
    pressure,
    station,
    size = 48,
    format,
    locale,
    strings = EN_STATION_GLYPH,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);

  const tempT = temp != null && Number.isFinite(temp) ? `${fmt(temp)}°` : null;
  const dewT = dewpoint != null && Number.isFinite(dewpoint) ? `${fmt(dewpoint)}°` : null;
  const presT = pressure != null && Number.isFinite(pressure) ? fmt(pressure) : null;
  const stationT = station || null;

  // gutters + disc placement are pure (geometry.ts) so the interactive entry
  // hit-tests exactly the coordinates this entry draws
  const {
    width: W,
    height: H,
    font,
    cx: dcx,
    cy: dcy,
    r,
    yOff,
    gap,
    y0,
    y1,
  } = stationLayout({ size, temp: tempT, dew: dewT, pressure: presT });

  const geo = stationGlyphGeometry({
    cloud: cloud ?? null,
    wind: wind ?? null,
    step,
    cx: dcx,
    cy: dcy,
    coreR: r,
    // a compact barb that stays near the disc rather than reaching into the numerals
    barbBox: size * 0.64,
  });
  const accName = resolveSummary(summary, () => stationGlyphSummary(props, strings, fmt));
  const barb = geo.barb;

  return (
    <Chart
      width={W}
      height={H}
      title={title}
      summary={accName}
      id={id}
      // The disc is the anchor and it has no floor, so the glyph square centres
      // on the cap band. Seating that square rather than the viewBox keeps the
      // disc on the line whichever numerals are present — the gutters are
      // reserved by string length, so the box grows but the center holds.
      seat={{ mode: "center", top: y0, bottom: y1 }}
      className={className ? `mc-station ${className}` : "mc-station"}
      style={{ ...style, "--mc-label-size": `${font}px` } as CSSProperties}
    >
      {barb ? (
        <>
          {/* shaft + feather barbs as one stroked path — width already comes
              from the "data" ink role, no literal needed */}
          <path
            d={
              `M${barb.shaft.x1} ${barb.shaft.y1}L${barb.shaft.x2} ${barb.shaft.y2}` +
              barb.barbs.map((b) => `M${b.x1} ${b.y1}L${b.x2} ${b.y2}`).join("")
            }
            data-mc-ink="data"
            fill="none"
            strokeLinecap="round"
          />
          {barb.pennants.map((p, i) => (
            <path key={i} d={p} data-mc-ink="point" />
          ))}
        </>
      ) : null}
      {/* filled disc masks the inner shaft + carries the ring; sky sector on top.
          Stroke width already comes from the "data" ink role (CSS beats this
          presentation attribute) — no literal needed. */}
      <circle
        cx={geo.disc.cx}
        cy={geo.disc.cy}
        r={geo.disc.r}
        data-mc-ink="data"
        vectorEffect="non-scaling-stroke"
        style={{ fill: "var(--mc-surface)" }}
      />
      {geo.cloudPath ? <path d={geo.cloudPath} data-mc-ink="accent" /> : null}
      {stationT ? (
        <text
          x={0.5}
          y={font}
          dominantBaseline="central"
          textAnchor="start"
          fontSize={font}
          data-mc-ink="label"
        >
          {stationT}
        </text>
      ) : null}
      {tempT ? (
        <text
          x={dcx - r - gap}
          y={dcy - yOff}
          dominantBaseline="central"
          textAnchor="end"
          fontSize={font}
          data-mc-cat="1"
        >
          {tempT}
        </text>
      ) : null}
      {dewT ? (
        <text
          x={dcx - r - gap}
          y={dcy + yOff}
          dominantBaseline="central"
          textAnchor="end"
          fontSize={font}
          data-mc-cat="2"
        >
          {dewT}
        </text>
      ) : null}
      {presT ? (
        <text
          x={dcx + r + gap}
          y={dcy - yOff}
          dominantBaseline="central"
          textAnchor="start"
          fontSize={font}
          data-mc-ink="label"
        >
          {presT}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
