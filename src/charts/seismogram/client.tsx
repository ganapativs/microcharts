"use client";
// Interactive <Seismogram>. useActivePicker owns interaction: ONE pointer
// listener + slot-by-x-band over the rendered series, ←/→ step slots, Home/End
// jump to the first/last EVENT (quiet slots are skippable context), click /
// Enter / Space selects (onSelect). Announces via the shared point template; a
// quiet slot reads as the zero it is, and only a non-finite slot takes the
// pointEmpty wording. Composes the static component (canon) — the SVG is never
// re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { maxPerBucket } from "../../core/downsample.js";
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
import { EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { EN_SLOTS, type SlotStrings } from "../../core/strings-slots.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import { isFiniteValue } from "../../core/types.js";
import {
  Seismogram as StaticSeismogram,
  seismogramSummary,
  type SeismogramProps,
} from "./index.js";

export interface InteractiveSeismogramProps extends SeismogramProps, PickerProps {
  strings?: DistStrings;
  /** Slot announcement templates (shared point wording). */
  seriesStrings?: SeriesStrings & SlotStrings;
  /**
   * Opt-in entrance motion (default `false`): the strip wipes on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const DEFAULT_SERIES_STRINGS = { ...EN_SERIES, ...EN_SLOTS };

export function Seismogram(props: InteractiveSeismogramProps): React.ReactNode {
  const {
    data,
    mode = "intensity",
    domain,
    width = 60,
    height = 16,
    format,
    locale,
    strings = EN_DIST,
    seriesStrings = DEFAULT_SERIES_STRINGS,
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
  useEntrance(hostRef, "wipe", animate);

  // the rendered series (mirrors the static entry's downsampling)
  const rendered = useMemo(() => {
    const maxSlots = Math.max(1, Math.floor(width));
    return data.length > maxSlots ? maxPerBucket(data, maxSlots, { abs: true }) : [...data];
  }, [data, width]);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const slotW = rendered.length > 0 ? width / rendered.length : 0;

  const eventSlots = useMemo(
    () =>
      rendered
        .map((v, i) => ({ v, i }))
        .filter((e) => isFiniteValue(e.v) && e.v !== 0)
        .map((e) => e.i),
    [rendered],
  );

  // Pointer x → slot band over the rendered series. Navigable unit = the SLOT
  // (index into the rendered, possibly downsampled, series).
  const locate = useCallback(
    (x: number) => {
      if (rendered.length === 0) return null;
      const i = Math.floor(x / (width / rendered.length));
      return i >= 0 && i < rendered.length ? i : null;
    },
    [rendered, width],
  );

  // ←/→ step slots; Home/End jump to the first/last EVENT (skipping quiet slots).
  const step = useCallback(
    (cur: number, key: string) => {
      const n = rendered.length;
      if (n === 0) return null;
      switch (key) {
        case "ArrowRight":
          return Math.min(n - 1, cur + 1);
        case "ArrowLeft":
          return cur <= 0 ? 0 : cur - 1;
        case "Home":
          return eventSlots[0] ?? 0;
        case "End":
          return eventSlots[eventSlots.length - 1] ?? n - 1;
      }
      return null;
    },
    [rendered, eventSlots],
  );

  // datum index = rendered SLOT index; value = the slot's intensity (0 = quiet),
  // or `null` for a non-finite slot.
  const datum = useCallback(
    (i: number) => {
      const v = rendered[i];
      return {
        index: i,
        value: isFiniteValue(v) ? v : null,
        formatted: isFiniteValue(v) ? fmt(v) : "—",
      };
    },
    [rendered, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: rendered.length,
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

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : seismogramSummary(data, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const shown = active ?? selected;
  const shownValue = shown !== null ? rendered[shown] : undefined;
  const announced =
    shown === null
      ? ""
      : // A quiet slot reads ZERO, not "no data" — 0 is a measurement (nothing
        // happened), null is the absence of one, and the two were announced with
        // the same words. `pointEmpty` is now reserved for non-finite slots.
        isFiniteValue(shownValue)
        ? seriesStrings.point(shown + 1, rendered.length, fmt(shownValue))
        : seriesStrings.pointEmpty(shown + 1, rendered.length);

  return (
    <span ref={hostRef} {...wrap("mc-seismo-live", className, style)} {...named(label)} {...bind}>
      <StaticSeismogram
        {...rest}
        data={data}
        mode={mode}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? (
          <line
            x1={slotW * (selected + 0.5)}
            y1={0}
            x2={slotW * (selected + 0.5)}
            y2={height}
            stroke="var(--mc-accent)"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {shown !== null ? (
          <line
            x1={slotW * (shown + 0.5)}
            y1={0}
            x2={slotW * (shown + 0.5)}
            y2={height}
            data-mc-ink="muted"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticSeismogram>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shown !== null ? (
        <span
          className="mc-spark-readout"
          style={crosshairReadoutStyle(slotW * (shown + 0.5), width)}
        >
          {isFiniteValue(shownValue) ? fmt(shownValue) : "—"}
        </span>
      ) : null}
    </span>
  );
}
