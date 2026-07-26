"use client";
// Interactive <StationGlyph>. The glyph packs several fields into one character;
// the interactive entry makes each FIELD a navigable unit (station, wind, sky,
// temp, dew point, pressure) so a reader can step or point at them one at a time
// instead of hearing one long string.
//
// The unit is the sub-metric, NOT a data point: `index` is the position in the
// PRESENT fields (absent props are not units — a glyph with no dew point has no
// dew unit), `value` is that field's encoded number (`null` for the station
// name, which encodes nothing), `label` is its announced phrase.
//
// useActivePicker owns interaction: one pointer listener + nearest-field math
// over the anchors the STATIC entry draws at (both entries read the same pure
// `stationLayout`, so the hit boxes cannot drift from the marks). Composes the
// static entry (canon) — no re-implemented SVG.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { textGutter } from "../../core/labels.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_STATION_GLYPH } from "../../core/strings-station-glyph.js";
import { octant } from "../../core/strings-wind-barb.js";
import {
  StationGlyph as StaticStationGlyph,
  stationGlyphSummary,
  type StationGlyphProps,
} from "./index.js";
import { stationGlyphGeometry, stationLayout } from "./geometry.js";

export interface InteractiveStationGlyphProps extends StationGlyphProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the glyph fades and scales in
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

/** One navigable sub-metric: what it says, what it encodes, where it is drawn. */
interface Field {
  text: string;
  value: number | null;
  /** Focus box in absolute viewBox coords, or null when the field has no mark. */
  box: [number, number, number, number] | null;
}

export function StationGlyph(props: InteractiveStationGlyphProps): React.ReactNode {
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
    animate = false,
    readout = true,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "pop", animate);

  const full =
    summary === false
      ? ""
      : typeof summary === "string"
        ? summary
        : stationGlyphSummary(props, strings, fmt);
  const label = [title, full].filter(Boolean).join(". ") || undefined;

  // The present fields, in reading order, each anchored on the mark that carries
  // it — same numbers the static entry lays out (shared pure `stationLayout`).
  const { fields, L } = useMemo(() => {
    const tempT = temp != null && Number.isFinite(temp) ? `${fmt(temp)}°` : null;
    const dewT = dewpoint != null && Number.isFinite(dewpoint) ? `${fmt(dewpoint)}°` : null;
    const presT = pressure != null && Number.isFinite(pressure) ? fmt(pressure) : null;
    const lay = stationLayout({ size, temp: tempT, dew: dewT, pressure: presT });
    const { font, cx, cy, r, yOff, gap } = lay;
    // per-char over-estimate — the static path never measures text either, and
    // it is the SHARED estimator (core/labels), so a hit box is exactly as wide
    // as the gutter `stationLayout` reserved for the same string
    const textBox = (s: string, right: number, y: number): [number, number, number, number] => {
      const w = textGutter(s.length, font, 0);
      return [right - w - 0.5, y - font * 0.7, w + 1, font * 1.4];
    };
    const out: Field[] = [];
    if (station)
      out.push({
        text: station,
        value: null, // a name, not a measurement
        box: textBox(station, 0.5 + textGutter(station.length, font, 0), font),
      });
    if (wind && Number.isFinite(wind.magnitude)) {
      const calm = Math.abs(wind.magnitude) < step / 4;
      const dir = wind.magnitude < 0 ? wind.direction + 180 : wind.direction;
      const deg = Math.round(((dir % 360) + 360) % 360);
      const mag = Math.abs(wind.magnitude);
      const bb = size * 0.64; // the barb's box (see index.tsx)
      out.push({
        text: calm
          ? strings.stationFieldWindCalm
          : strings.stationFieldWind(strings.compass8[octant(deg)]!, fmt(mag)),
        // the barb encodes SPEED; a negative magnitude only flips the direction
        value: mag,
        // calm draws no barb — a field with no mark is keyboard-only, never a
        // pointer target (it would steal the disc, which is the sky's mark)
        box: calm ? null : [cx - bb / 2, cy - bb / 2, bb, bb],
      });
    }
    if (cloud != null && Number.isFinite(cloud)) {
      const okta = stationGlyphGeometry({
        cloud,
        wind: null,
        step,
        cx: 0,
        cy: 0,
        coreR: 1,
        barbBox: 30,
      }).oktaIndex;
      out.push({
        text: strings.stationFieldSky(strings.stationSky[okta]!),
        // the fraction of the disc the sector fills (clamped, as drawn)
        value: Math.max(0, Math.min(1, cloud)),
        box: [cx - r, cy - r, r * 2, r * 2],
      });
    }
    if (tempT != null)
      out.push({
        text: strings.stationFieldTemp(fmt(temp!)),
        value: temp!,
        box: textBox(tempT, cx - r - gap, cy - yOff),
      });
    if (dewT != null)
      out.push({
        text: strings.stationFieldDew(fmt(dewpoint!)),
        value: dewpoint!,
        box: textBox(dewT, cx - r - gap, cy + yOff),
      });
    if (presT != null)
      out.push({
        text: strings.stationFieldPressure(fmt(pressure!)),
        value: pressure!,
        box: [
          cx + r + gap - 0.5,
          cy - yOff - font * 0.7,
          textGutter(presT.length, font, 1),
          font * 1.4,
        ],
      });
    return { fields: out, L: lay };
  }, [station, wind, step, cloud, temp, dewpoint, pressure, size, strings, fmt]);

  // Nearest drawn field by squared distance to its box center — the glyph's
  // marks are scattered around the disc, so there is no 1-D ordering to scan.
  const locate = useCallback(
    (x: number, y: number) => {
      let best: number | null = null;
      let bestDist = Infinity;
      fields.forEach((f, i) => {
        if (!f.box) return;
        const d = (f.box[0] + f.box[2] / 2 - x) ** 2 + (f.box[1] + f.box[3] / 2 - y) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [fields],
  );

  // index = position among the PRESENT fields (see the file header).
  const datum = useCallback(
    (i: number) => {
      const f = fields[i];
      return { index: i, value: f?.value ?? null, label: f?.text, formatted: f?.text };
    },
    [fields],
  );

  const { active, selected, bind } = useActivePicker({
    count: fields.length,
    width: L.width,
    height: L.height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const outline = (i: number | null, pinned: boolean) => {
    const b = i === null ? null : fields[i]?.box;
    if (!b) return null;
    // clamp into the viewBox — nothing may paint outside it
    const x = Math.max(0.25, b[0]);
    const y = Math.max(0.25, b[1]);
    return (
      <rect
        x={x}
        y={y}
        width={Math.min(b[2], L.width - 0.25 - x)}
        height={Math.min(b[3], L.height - 0.25 - y)}
        rx={1}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownField = shown === null ? undefined : fields[shown];

  return (
    <span ref={hostRef} {...wrap("mc-station-live", className, style)} {...named(label)} {...bind}>
      <StaticStationGlyph
        {...rest}
        cloud={cloud}
        wind={wind}
        step={step}
        temp={temp}
        dewpoint={dewpoint}
        pressure={pressure}
        station={station}
        size={size}
        format={format}
        locale={locale}
        strings={strings}
        title={title}
        summary={false}
        style={fillFor(style)}
      >
        {selected !== active ? outline(selected, true) : null}
        {outline(active, false)}
        {rest.children}
      </StaticStationGlyph>
      <LiveRegion>{shownField ? shownField.text : ""}</LiveRegion>
      {readout && shownField ? (
        <span
          className="mc-spark-readout"
          style={crosshairReadoutStyle(
            shownField.box ? shownField.box[0] + shownField.box[2] / 2 : L.width / 2,
            L.width,
          )}
        >
          {shownField.text}
        </span>
      ) : null}
    </span>
  );
}
