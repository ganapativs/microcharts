"use client";
// Interactive <HeatStrip>. One pointer listener; cell by x-band
// lookup. ←/→ roving cell focus with the ActivityGrid focus-ring style — the
// 1-D restriction of its 2-D nav, same wording, same overlay; click / Enter /
// Space selects a cell (onSelect). useActivePicker owns interaction (the strip
// is a single row of cells, so the kernel's default 1-D nav applies — no custom
// `step`), composing the static component (canon).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
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
import { describeSeries, EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { EN_SLOTS, type SlotStrings } from "../../core/strings-slots.js";
import { heatStripGeometry } from "./geometry.js";
import { HeatStrip as StaticHeatStrip, type HeatStripProps } from "./index.js";

export interface InteractiveHeatStripProps extends HeatStripProps, PickerProps {
  strings?: SeriesStrings & SlotStrings;
  /**
   * Opt-in entrance motion (default `false`): the strip wipes in left to right
   * on first client-side mount — a time-forward reveal for the 1×N cells (an
   * index cascade over many cells collapses under the stagger cap into a
   * near-simultaneous fade). Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const DEFAULT_STRINGS = { ...EN_SERIES, ...EN_SLOTS };

export function HeatStrip(props: InteractiveHeatStripProps): React.ReactNode {
  const {
    data,
    steps = 5,
    shape = "square",
    domain,
    width = 60,
    height = 10,
    format,
    locale,
    strings = DEFAULT_STRINGS,
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

  const hostRef = useRef<HTMLSpanElement>(null);
  // Time runs along x: cells light up in turn, oldest→newest. `order:"x"` +
  // `window` spreads the cascade across the strip (it does NOT flatten under
  // the default stagger cap), reading as time advancing cell by cell.
  useEntrance(hostRef, "reveal", animate, {
    selector: 'rect[data-mc-ink="cell"]',
    order: "x",
    window: 400,
  });

  const geo = useMemo(
    () => heatStripGeometry({ width, height, values: data, domain, steps, shape }),
    [width, height, data, domain, steps, shape],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Pointer (viewBox space) → cell index by x-band lookup; `null` past the end.
  const locate = useCallback(
    (x: number) => {
      if (geo.cells.length === 0 || geo.pitch === 0) return null;
      const i = Math.floor(x / geo.pitch);
      return i >= 0 && i < geo.cells.length ? i : null;
    },
    [geo],
  );

  // index = cell index along the strip. 1:1 with `data` until the series
  // exceeds HEAT_STRIP_MAX_CELLS, when cells are max-per-bucket rollups.
  const datum = useCallback(
    (i: number) => {
      const c = geo.cells[i];
      return {
        index: i,
        value: c?.value ?? null,
        formatted: c ? (c.value === null ? "—" : fmt(c.value)) : undefined,
      };
    },
    [geo, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.cells.length,
    width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : describeSeries(data, { format: fmt, strings });
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const c = geo.cells[i];
    if (!c) return null;
    return (
      <rect
        x={c.x - 0.5}
        y={c.y - 0.5}
        width={c.w + 1}
        height={c.h + 1}
        rx={c.rx + 0.5}
        fill="none"
        stroke="var(--mc-accent)"
        strokeWidth={1.5}
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownCell = shown !== null ? geo.cells[shown] : undefined;
  const announced = shownCell
    ? shownCell.value === null
      ? strings.pointEmpty(shownCell.index + 1, geo.cells.length)
      : strings.point(shownCell.index + 1, geo.cells.length, fmt(shownCell.value))
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-heat-strip-live", className, style)}
      {...named(label)}
      {...bind}
    >
      <StaticHeatStrip
        {...rest}
        style={fillFor(style)}
        data={data}
        steps={steps}
        shape={shape}
        domain={domain}
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
      </StaticHeatStrip>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownCell ? (
        <span
          className="mc-spark-readout"
          style={crosshairReadoutStyle(shownCell.x + shownCell.w / 2, width)}
        >
          {shownCell.value === null ? "—" : fmt(shownCell.value)}
        </span>
      ) : null}
    </span>
  );
}
