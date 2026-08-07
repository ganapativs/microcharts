"use client";
// Interactive <PolarClock>. useActivePicker owns interaction: one pointer
// listener + cursor-angle→segment lookup (atan2, 12 o'clock clockwise). ←/→ step
// segments circularly, click / Enter / Space selects (onSelect).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { annulusSector } from "../../core/arc.js";
import {
  CHIP,
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_POLAR_CLOCK, type PolarClockStrings } from "../../core/strings-polar-clock.js";
import { POLAR_PAD, polarClockGeometry, polarStart } from "./geometry.js";
import {
  PolarClock as StaticPolarClock,
  polarClockLabel,
  polarClockSummary,
  type PolarClockProps,
} from "./index.js";

const TAU = Math.PI * 2;

// Segments/accent/level paths are FILLED shapes (fill, stroke:none per ink
// role) — a stroke-based "draw" reveal would be invisible. Angle encodes the
// cycle position, so the entrance must never rotate (a spin would imply time
// itself is turning): "grow" scales the whole clock concentrically from the
// center outward, leaving every segment at its true hour.

export interface InteractivePolarClockProps extends PolarClockProps, PickerProps {
  strings?: PolarClockStrings;
  /**
   * Opt-in entrance motion (default `false`): the dial grows outward from its
   * centre as it fades in when the chart first mounts client-side. Inert on the
   * server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

function defaultSegmentLabel(strings: PolarClockStrings, index: number, n: number): string {
  if (n === 24) return `${String(index).padStart(2, "0")}:00`;
  if (n === 7) return strings.weekdays[((index % 7) + 7) % 7] ?? String(index);
  return String(index);
}

export function PolarClock(props: InteractivePolarClockProps): React.ReactNode {
  const {
    data,
    now,
    inner = 0.35,
    origin = 0,
    mode = "length",
    segmentFormat,
    size = 24,
    format,
    locale,
    strings = EN_POLAR_CLOCK,
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
  const n = data.length;
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "grow", animate);

  const geo = useMemo(
    () => polarClockGeometry({ values: data, size, inner, origin, pad: POLAR_PAD, mode, now }),
    [data, size, inner, origin, mode, now],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // The Chart viewBox gains a bottom gutter when the peak numeral is shown; the
  // clock still sits in the top square, so the pointer must map over the full
  // height. The static decides that band — including when it drops the numeral
  // for not fitting — so ask it rather than re-deriving the arithmetic here.
  const vbHeight =
    geo.size +
    polarClockLabel({
      data,
      peakIndex: geo.peakIndex,
      box: geo.size,
      fontSize: rest.fontSize,
      labelSize: rest.labelSize,
      label: rest.label ?? "none",
      fmt,
    }).band;
  const seg = useCallback(
    (i: number) => (segmentFormat ? segmentFormat(i, n) : defaultSegmentLabel(strings, i, n)),
    [segmentFormat, n, strings],
  );

  // Pointer (viewBox space) → data index by cursor angle. The clock occupies the
  // top square; the peak-label gutter (if any) lives below it. Both the hit
  // origin and the rotation come from geometry, so the inverse lands on the
  // segment the reader is actually pointing at.
  const start0 = polarStart(origin, n);
  const locate = useCallback(
    (x: number, y: number) => {
      if (n === 0) return null;
      const dx = x - geo.guide.cx;
      const dy = y - geo.guide.cy;
      let ang = Math.atan2(dx, -dy); // 0 at 12 o'clock, clockwise
      if (ang < 0) ang += TAU;
      const pos = Math.min(n - 1, Math.floor((ang / TAU) * n));
      return (pos + start0) % n;
    },
    [geo, n, start0],
  );

  // Circular roving: ←/→ wrap around the cycle (matches the clock's topology).
  const step = useCallback(
    (cur: number, key: string) => {
      if (n === 0) return null;
      switch (key) {
        // ↓/↑ alias forward/back, as on every other radial chart (StarSpoke,
        // TreeRings, MicroDonut via `nav1d`). Returning null for them left the
        // keys unconsumed, so pressing ↑ scrolled the page out from under a
        // reader roving the dial.
        case "ArrowRight":
        case "ArrowDown":
          return (((cur + 1) % n) + n) % n;
        case "ArrowLeft":
        case "ArrowUp":
          return (((cur - 1) % n) + n) % n;
        case "Home":
          return 0;
        case "End":
          return n - 1;
      }
      return null;
    },
    [n],
  );

  // index = data index; value = the segment's number (null when empty); label = its name.
  const datum = useCallback(
    (i: number) => {
      const v = data[i];
      return {
        index: i,
        value: typeof v === "number" && Number.isFinite(v) ? v : null,
        label: seg(i),
        formatted: `${seg(i)}: ${typeof v === "number" && Number.isFinite(v) ? fmt(v) : "—"}`,
      };
    },
    [data, seg, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: n,
    width: geo.size,
    height: vbHeight,
    locate,
    datum,
    step,
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
        : polarClockSummary(data, { segmentFormat, strings, format, locale });
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const sector = (i: number) => {
    const s = geo.segments[i];
    if (!s || s.isNull) return null;
    return annulusSector(geo.guide.cx, geo.guide.cy, s.rOuter, geo.guide.r, s.a0, s.a1);
  };

  const shown = active ?? selected;
  const shownSeg = shown !== null ? geo.segments[shown] : undefined;
  const shownVal = shown !== null ? data[shown] : undefined;
  const announced =
    shownSeg !== undefined
      ? typeof shownVal === "number" && Number.isFinite(shownVal)
        ? strings.polarClockAt(seg(shown!), fmt(shownVal))
        : strings.polarClockAt(seg(shown!), "—")
      : "";
  const chip =
    shownSeg !== undefined
      ? `${seg(shown!)}: ${typeof shownVal === "number" && Number.isFinite(shownVal) ? fmt(shownVal) : "—"}`
      : "";
  const pinPath = selected !== null && selected !== active ? sector(selected) : null;
  const activePath = active !== null ? sector(active) : null;

  return (
    <span ref={hostRef} {...wrap("mc-polar-live", className, style)} {...named(label)} {...bind}>
      <StaticPolarClock
        {...rest}
        style={fillFor(style)}
        data={data}
        now={now}
        inner={inner}
        origin={origin}
        mode={mode}
        segmentFormat={segmentFormat}
        size={size}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {pinPath ? <path d={pinPath} data-mc-ink="accent" data-mc-w="tick" /> : null}
        {activePath ? <path d={activePath} data-mc-ink="accent" /> : null}
        {rest.children}
      </StaticPolarClock>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownSeg !== undefined ? (
        <span className="mc-spark-readout" {...CHIP}>
          {chip}
        </span>
      ) : null}
    </span>
  );
}
