"use client";
// Interactive <PictogramRow>. Two independent behaviours:
//   1. `live` announces value CHANGES ("6 of 8.") — the row's one datum.
//   2. useActivePicker owns unit-level interaction: one pointer listener +
//      nearest-unit lookup, ←/→ (and ↑/↓) rove the units, click / Enter / Space
//      selects (onSelect) — the star-rating gesture, and the reason the units
//      are navigable at all. Roving SPEAKS: each unit announces its position and
//      fullness via `pictogramUnit`, which (unlike the boolean `iconArrayUnit`)
//      can describe a partly-filled unit honestly. With no unit active the live
//      region falls back to (1)'s value-change text.
// Composes the static component (canon) — the SVG is never re-implemented.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_PICTOGRAM, type PictogramStrings } from "../../core/strings-pictogram.js";
import { pictogramGeometry } from "./geometry.js";
import {
  PictogramRow as StaticPictogramRow,
  pictogramSummary,
  type PictogramRowProps,
} from "./index.js";

export interface InteractivePictogramRowProps extends PictogramRowProps, PickerProps {
  /** Announce when the value changes (default true). */
  live?: boolean;
  /**
   * Superset of `ScalarStrings`: the interactive entry also needs the per-unit
   * `pictogramUnit` template that its roving keyboard announces.
   */
  strings?: PictogramStrings;
  /**
   * Opt-in entrance motion (default `false`): each unit settles into place,
   * staggered, when the chart first mounts client-side. Inert on the server
   * and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function PictogramRow(props: InteractivePictogramRowProps): React.ReactNode {
  const {
    live = true,
    animate = false,
    strings = EN_PICTOGRAM,
    title,
    format,
    locale,
    className,
    style,
    value,
    total,
    // Mirror the static's defaults exactly — the client must never invent its
    // own size or viewBox, or the overlay rings drift off the units.
    shape = "dot",
    fractional = "clip",
    width = 60,
    height = 12,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pctFmt = useMemo(
    () => makeFormatter({ style: "percent", maximumFractionDigits: 0 }, locale),
    [locale],
  );
  const text = pictogramSummary(value, total, fmt, strings);
  const hostRef = useRef<HTMLSpanElement>(null);
  // "settle" — each unit (dot or square) fades + scales in like a marker, the
  // best-read entrance for a row of repeated glyph units. Filled units carry
  // their ink role on the fill mark itself (circle/rect/path), unfilled units
  // carry it on the ring — a custom selector catches every unit regardless of
  // shape or fill state (the default "settle" selector only matches circles).
  // Index order over a 450ms window gives the row a counting feel (units
  // settle one at a time, reading order) instead of a uniform staggered fade.
  useEntrance(hostRef, "settle", animate, {
    selector: "circle[data-mc-ink], rect[data-mc-ink], path[data-mc-ink]",
    order: "index",
    window: 450,
  });

  const geo = useMemo(
    () => pictogramGeometry({ width, height, value, total, shape, fractional }),
    [width, height, value, total, shape, fractional],
  );

  // The chart takes a scalar, not an array: `datum.index` is the UNIT POSITION
  // (0…total-1, reading order), NOT a data index. `value` is that unit's fill
  // fraction — 0 empty, 1 filled, else the true partial (the last unit in
  // `fractional="clip"`), which is exactly what the unit encodes.
  const locate = useCallback(
    (x: number) => {
      let best: number | null = null;
      let bestD = Infinity;
      for (let i = 0; i < geo.units.length; i++) {
        const d = Math.abs(geo.units[i]!.cx - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    },
    [geo],
  );
  const datum = useCallback(
    (i: number) => ({ index: i, value: geo.units[i]?.fill ?? null }),
    [geo],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.units.length,
    width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const [announced, setAnnounced] = useState("");
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (live) setAnnounced(text);
  }, [value, text, live]);

  const label = [title, text].filter(Boolean).join(". ") || undefined;

  // What the live region says while roving. A unit is full, empty, or genuinely
  // partial (`fractional="clip"`) — the percentage is only spoken in that third
  // case, and comes from a percent formatter (never the consumer's `format`,
  // which is written for the row's own values).
  const shown = active ?? selected;
  const fill = shown === null ? null : (geo.units[shown]?.fill ?? null);
  const unitSpoken =
    shown === null || fill === null
      ? ""
      : strings.pictogramUnit(
          shown + 1,
          geo.units.length,
          fill >= 1 ? "full" : fill <= 0 ? "none" : "part",
          pctFmt(fill),
        );

  const ring = (i: number, pinned: boolean) => {
    const u = geo.units[i];
    if (!u) return null;
    const w = pinned ? "tick" : "full";
    // The ring hugs the drawn unit, whatever its shape.
    return shape === "dot" ? (
      <circle
        cx={u.cx}
        cy={u.cy}
        r={u.r + 1}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={w}
        vectorEffect="non-scaling-stroke"
      />
    ) : (
      <rect
        x={u.cx - u.r - 1}
        y={u.cy - u.r - 1}
        width={(u.r + 1) * 2}
        height={(u.r + 1) * 2}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={w}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  return (
    <span
      ref={hostRef}
      {...wrap("mc-pictogram-live", className, style)}
      {...named(label)}
      {...bind}
    >
      <StaticPictogramRow
        {...rest}
        style={fillFor(style)}
        value={value}
        total={total}
        shape={shape}
        fractional={fractional}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticPictogramRow>
      {live ? <LiveRegion>{shown === null ? announced : unitSpoken}</LiveRegion> : null}
    </span>
  );
}
