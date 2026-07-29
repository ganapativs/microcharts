"use client";
// Interactive <TimeInRange>. useActivePicker owns interaction: one pointer
// listener + zone-by-x/y lookup, roving keyboard (←/→ horizontal, ↑/↓
// vertical, Home/End ends). touch tap-to-pin, and the onActive/onSelect
// contract. Each zone announces "{zone}: {pct}".
import { useCallback, useMemo, useRef } from "react";
import type { ZoneKey } from "./geometry.js";
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
import { chartSide } from "../../core/types.js";
import { EN_TIME_IN_RANGE } from "../../core/strings-time-in-range.js";
import { timeInRangeGeometry } from "./geometry.js";
import {
  TimeInRange as StaticTimeInRange,
  timeInRangeSummary,
  tirPercent,
  zonePercentMap,
  type TimeInRangeProps,
} from "./index.js";

export interface InteractiveTimeInRangeProps extends TimeInRangeProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the zone segments reveal on
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function TimeInRange(props: InteractiveTimeInRangeProps): React.ReactNode {
  const {
    data,
    orientation = "horizontal",
    width: widthProp = 80,
    height: heightProp = 12,
    locale,
    strings = EN_TIME_IN_RANGE,
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
  const horizontal = orientation !== "vertical";
  // Same clamp the static applies, or the picker hit-tests a scale the frame
  // never had: a NaN side would paint zones at 80×12 and locate them at NaN.
  const width = chartSide(widthProp, 80);
  const height = chartSide(heightProp, 12);

  const hostRef = useRef<HTMLSpanElement>(null);
  // A composition bar should ASSEMBLE, not fade in place: each zone grows from
  // the leading edge and the zones cascade in order, so the whole bar builds
  // up the way its siblings (SegmentedBar, LikertStrip) do. Direction follows
  // orientation — sweep across x when horizontal, rise up y when vertical.
  useEntrance(hostRef, horizontal ? "sweep" : "rise", animate, {
    selector: "rect[data-mc-ink], rect[data-mc-cat]",
    order: horizontal ? "x" : "y",
  });

  const geo = useMemo(
    () => timeInRangeGeometry({ data, width, height, orientation }),
    [data, width, height, orientation],
  );
  const pct = useMemo(() => zonePercentMap(data), [data]);
  // The same percent formatter the static paints its in-zone label with, so the
  // chip, the announcement and the painted label can never disagree.
  const pctFmt = useMemo(() => tirPercent(locale), [locale]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : timeInRangeSummary(data, strings, pctFmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const nameByKey = useMemo<Record<ZoneKey, string>>(
    () => ({
      severeBelow: strings.tirNames[0]!,
      below: strings.tirNames[1]!,
      in: strings.tirNames[2]!,
      above: strings.tirNames[3]!,
      severeAbove: strings.tirNames[4]!,
    }),
    [strings],
  );

  // Pointer (viewBox space) → zone index by the zone's own extent.
  const locate = useCallback(
    (x: number, y: number) => {
      const i = horizontal
        ? geo.zones.findIndex((z) => x >= z.x && x <= z.x + z.width)
        : geo.zones.findIndex((z) => y >= z.y && y <= z.y + z.height);
      return i >= 0 ? i : null;
    },
    [geo, horizontal],
  );

  // Roving in zone-index space, but the arrow keys follow the visual axis:
  // ←/→ when horizontal, ↑/↓ when vertical (↑ advances toward severe-high, the
  // top). Home/End jump the ends. First arrow from nothing lands on zone 0.
  const step = useCallback(
    (cur: number, key: string) => {
      const n = geo.zones.length;
      if (n === 0) return null;
      const fwd = horizontal ? "ArrowRight" : "ArrowUp";
      const back = horizontal ? "ArrowLeft" : "ArrowDown";
      switch (key) {
        case fwd:
          return cur < 0 ? 0 : Math.min(n - 1, cur + 1);
        case back:
          return cur <= 0 ? 0 : cur - 1;
        case "Home":
          return 0;
        case "End":
          return n - 1;
      }
      return null;
    },
    [geo, horizontal],
  );

  // Navigable unit = a zone; `index` its zone index, `value` its integer
  // percent share (what the strip encodes), `label` the zone's human name.
  const datum = useCallback(
    (i: number) => {
      const z = geo.zones[i];
      return {
        index: i,
        value: z ? (pct[z.key] ?? null) : null,
        label: z ? nameByKey[z.key] : undefined,
        formatted: z ? `${nameByKey[z.key]} ${pctFmt(pct[z.key]!)}` : undefined,
      };
    },
    [geo, pct, pctFmt, nameByKey],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.zones.length,
    width,
    height,
    locate,
    step,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const outline = (i: number, pinned: boolean) => {
    const z = geo.zones[i];
    if (!z) return null;
    return (
      <rect
        x={z.x - 0.5}
        y={z.y - 0.5}
        width={z.width + 1}
        height={z.height + 1}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const zone = shown !== null ? geo.zones[shown] : undefined;
  const announced = zone ? strings.tirZone(nameByKey[zone.key]!, pctFmt(pct[zone.key]!)) : "";
  // Horizontal: clamp to the zone mid-x. Vertical: float ABOVE the column —
  // a centered chip sits inside a ~34px KPI and collides with the default
  // `bottom: 100%` rule, so the value never appears.
  const chipPos = zone
    ? horizontal
      ? crosshairReadoutStyle(zone.x + zone.width / 2, width)
      : { left: "50%", bottom: "100%", top: "auto", transform: "translateX(-50%)" }
    : undefined;
  const chipText = zone ? `${nameByKey[zone.key]} ${pctFmt(pct[zone.key]!)}` : "";

  return (
    <span ref={hostRef} {...wrap("mc-tir-live", className, style)} {...named(label)} {...bind}>
      <StaticTimeInRange
        {...rest}
        data={data}
        orientation={orientation}
        width={width}
        height={height}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticTimeInRange>
      <LiveRegion>{announced}</LiveRegion>
      {readout && zone ? (
        <span className="mc-spark-readout" style={chipPos}>
          {chipText}
        </span>
      ) : null}
    </span>
  );
}
