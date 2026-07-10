"use client";
// Interactive <StationGlyph> (plan/25 §20). The glyph packs several fields into
// one character; the interactive entry roves them with ←/→ so a screen-reader
// user can step field-by-field (station, wind, sky, temp, dew, pressure) instead
// of hearing one long string. Focus reads the whole observation; Home returns to
// it. Composes the static entry (canon) — no re-implemented SVG.
import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_STATION_GLYPH } from "../../core/strings-station-glyph.js";
import { octant } from "../../core/strings-wind-barb.js";
import {
  StationGlyph as StaticStationGlyph,
  stationGlyphSummary,
  type StationGlyphProps,
} from "./index.js";
import { stationGlyphGeometry } from "./geometry.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

export function StationGlyph(props: StationGlyphProps): React.ReactNode {
  const {
    cloud,
    wind,
    step = 10,
    temp,
    dewpoint,
    pressure,
    station,
    format,
    locale,
    strings = EN_STATION_GLYPH,
    title,
    summary,
  } = props;
  const fmt = makeFormatter(format, locale);

  const full =
    summary === false
      ? ""
      : typeof summary === "string"
        ? summary
        : stationGlyphSummary(props, strings, fmt);
  const label = [title, full].filter(Boolean).join(". ") || undefined;

  // field-by-field readouts (skip absent fields)
  const fields = useMemo(() => {
    const out: string[] = [];
    if (station) out.push(station);
    if (wind && Number.isFinite(wind.magnitude)) {
      if (Math.abs(wind.magnitude) < step / 4) out.push(strings.stationFieldWindCalm);
      else {
        const dir = wind.magnitude < 0 ? wind.direction + 180 : wind.direction;
        const deg = Math.round(((dir % 360) + 360) % 360);
        out.push(
          strings.stationFieldWind(strings.compass8[octant(deg)]!, fmt(Math.abs(wind.magnitude))),
        );
      }
    }
    const okta = stationGlyphGeometry({
      cloud: cloud ?? null,
      wind: null,
      step,
      cx: 0,
      cy: 0,
      coreR: 1,
      barbBox: 30,
    }).oktaIndex;
    if (cloud != null && Number.isFinite(cloud))
      out.push(strings.stationFieldSky(strings.stationSky[okta]!));
    if (temp != null && Number.isFinite(temp)) out.push(strings.stationFieldTemp(fmt(temp)));
    if (dewpoint != null && Number.isFinite(dewpoint))
      out.push(strings.stationFieldDew(fmt(dewpoint)));
    if (pressure != null && Number.isFinite(pressure))
      out.push(strings.stationFieldPressure(fmt(pressure)));
    return out;
  }, [station, wind, step, cloud, temp, dewpoint, pressure, strings, fmt]);

  const [msg, setMsg] = useState("");
  const idx = useRef(-1);

  function onKey(e: KeyboardEvent<HTMLSpanElement>): void {
    if (fields.length === 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      idx.current =
        (idx.current + (e.key === "ArrowRight" ? 1 : -1) + fields.length) % fields.length;
      setMsg(fields[idx.current]!);
    } else if (e.key === "Home") {
      e.preventDefault();
      setMsg(full);
    }
  }

  return (
    <span
      className="mc-station-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onKeyDown={onKey}
    >
      <StaticStationGlyph {...props} summary={false} style={FILL} />
      <span
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {msg}
      </span>
    </span>
  );
}
