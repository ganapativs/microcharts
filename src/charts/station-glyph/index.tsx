// <StationGlyph> — a full weather observation in one character (plan/25 §20,
// plan/17 F2). Static, hook-free, RSC-safe. Sky cover fills the center disc, a
// wind barb gives direction + quantized speed (reused from WindBarb), and up to
// three corner numerals carry temperature, dew point, and pressure. One glyph,
// four channels, no legend — the meteorologist's station model, shrunk to a word.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont } from "../../core/labels.js";
import { round2 } from "../../core/types.js";
import { makeFormatter } from "../../core/format.js";
import { EN_STATION_GLYPH, type StationGlyphStrings } from "../../core/strings-station-glyph.js";
import { octant } from "../../core/strings-wind-barb.js";
import { stationGlyphGeometry } from "./geometry.js";

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
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
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
  const geo = stationGlyphGeometry({
    cloud: cloud ?? null,
    wind: null,
    step,
    cx: 0,
    cy: 0,
    coreR: 1,
    barbBox: 30,
  });

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

  return strings.stationGlyph(
    station,
    windClause,
    strings.stationSky[geo.oktaIndex]!,
    fieldsClause,
  );
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
  const font = labelFont(size, 0.22);

  const est = (s: string): number => 0.62 * font * s.length;
  const tempT = temp != null && Number.isFinite(temp) ? `${fmt(temp)}°` : null;
  const dewT = dewpoint != null && Number.isFinite(dewpoint) ? `${fmt(dewpoint)}°` : null;
  const presT = pressure != null && Number.isFinite(pressure) ? fmt(pressure) : null;
  const stationT = station || null;

  // reserve numeral gutters, then place the disc center in absolute coords
  const leftW = Math.max(tempT ? est(tempT) : 0, dewT ? est(dewT) : 0);
  const rightW = presT ? est(presT) : 0;
  const padXL = round2((leftW > 0 ? leftW + 1.5 : 1) + 0.5);
  const padXR = round2((rightW > 0 ? rightW + 1.5 : 1) + 0.5);
  const padY = round2(font + 2);
  const W = round2(padXL + size + padXR);
  const H = round2(size + padY * 2);
  const r = round2(size * 0.24);
  const dcx = round2(padXL + size / 2);
  const dcy = round2(padY + size / 2);
  const yOff = round2(r * 0.55);

  const geo = stationGlyphGeometry({
    cloud: cloud ?? null,
    wind: wind ?? null,
    step,
    cx: dcx,
    cy: dcy,
    coreR: r,
    barbBox: size,
  });
  const accName = summary === false ? false : (summary ?? stationGlyphSummary(props, strings, fmt));
  const barb = geo.barb;

  return (
    <Chart
      width={W}
      height={H}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-station ${className}` : "mc-station"}
      style={{ ...style, "--mc-label-size": `${font}px` } as CSSProperties}
    >
      {barb ? (
        <>
          <line
            x1={barb.shaft.x1}
            y1={barb.shaft.y1}
            x2={barb.shaft.x2}
            y2={barb.shaft.y2}
            data-mc-ink="data"
            strokeLinecap="round"
            style={{ strokeWidth: "var(--mc-stroke-width)" }}
          />
          {barb.barbs.length > 0 ? (
            <path
              d={barb.barbs.map((b) => `M${b.x1} ${b.y1}L${b.x2} ${b.y2}`).join("")}
              data-mc-ink="data"
              fill="none"
              strokeLinecap="round"
              style={{ strokeWidth: "var(--mc-stroke-width)" }}
            />
          ) : null}
          {barb.pennants.map((p, i) => (
            <path key={i} d={p} style={{ fill: "var(--mc-stroke)" }} />
          ))}
        </>
      ) : null}
      {/* filled disc masks the inner shaft + carries the ring; sky sector on top */}
      <circle
        cx={geo.disc.cx}
        cy={geo.disc.cy}
        r={geo.disc.r}
        data-mc-ink="data"
        strokeWidth={1}
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
          data-mc-ink="muted"
        >
          {stationT}
        </text>
      ) : null}
      {tempT ? (
        <text
          x={round2(dcx - r - 2)}
          y={round2(dcy - yOff)}
          dominantBaseline="central"
          textAnchor="end"
          fontSize={font}
          style={{ fill: "var(--mc-cat-1)" }}
        >
          {tempT}
        </text>
      ) : null}
      {dewT ? (
        <text
          x={round2(dcx - r - 2)}
          y={round2(dcy + yOff)}
          dominantBaseline="central"
          textAnchor="end"
          fontSize={font}
          style={{ fill: "var(--mc-cat-2)" }}
        >
          {dewT}
        </text>
      ) : null}
      {presT ? (
        <text
          x={round2(dcx + r + 2)}
          y={round2(dcy - yOff)}
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
