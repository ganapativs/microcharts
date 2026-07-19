"use client";
// Interactive <PolarClock>. useActivePicker owns interaction: one pointer
// listener + cursor-angle→segment lookup (atan2, 12 o'clock clockwise), ←/→ step
// segments circularly, click / Enter / Space selects (onSelect). Composes the
// static component (canon) — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { annulusSector } from "../../core/arc.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_POLAR_CLOCK, type PolarClockStrings } from "../../core/strings-polar-clock.js";
import { polarClockGeometry } from "./geometry.js";
import {
  PolarClock as StaticPolarClock,
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
   * Opt-in entrance motion (default `false`): the radial segments settle
   * into place when the chart first mounts client-side. Inert on the server
   * and on hydrated server HTML; `prefers-reduced-motion` always wins.
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
    start = 0,
    mode = "length",
    formatSegment,
    size = 24,
    format,
    locale,
    strings = EN_POLAR_CLOCK,
    title,
    summary,
    animate = false,
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
    () => polarClockGeometry({ values: data, size, inner, start, pad: 1, mode, now }),
    [data, size, inner, start, mode, now],
  );
  // The Chart viewBox gains a bottom gutter when the peak numeral is shown; the
  // clock still sits in the top square, so the pointer must map over the full height.
  const vbHeight =
    geo.size + (rest.label === "max" ? Math.ceil((rest.fontSize ?? labelFont(size)) * 1.35) : 0);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const seg = useCallback(
    (i: number) => (formatSegment ? formatSegment(i, n) : defaultSegmentLabel(strings, i, n)),
    [formatSegment, n, strings],
  );

  // Pointer (viewBox space) → data index by cursor angle. The clock occupies the
  // top square; the peak-label gutter (if any) lives below it.
  const locate = useCallback(
    (x: number, y: number) => {
      if (n === 0) return null;
      const dx = x - geo.size / 2;
      const dy = y - geo.size / 2;
      let ang = Math.atan2(dx, -dy); // 0 at 12 o'clock, clockwise
      if (ang < 0) ang += TAU;
      const pos = Math.min(n - 1, Math.floor((ang / TAU) * n));
      return (((pos + start) % n) + n) % n;
    },
    [geo, n, start],
  );

  // Circular roving: ←/→ wrap around the cycle (matches the clock's topology).
  const step = useCallback(
    (cur: number, key: string) => {
      if (n === 0) return null;
      switch (key) {
        case "ArrowRight":
          return (((cur + 1) % n) + n) % n;
        case "ArrowLeft":
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
      };
    },
    [data, seg],
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
        : polarClockSummary(data, { formatSegment, strings, format, locale });
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const sector = (i: number) => {
    const s = geo.segments[i];
    if (!s || s.isNull) return null;
    return annulusSector(geo.size / 2, geo.size / 2, s.rOuter, geo.guide.r, s.a0, s.a1);
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
  const readout =
    shownSeg !== undefined
      ? `${seg(shown!)}: ${typeof shownVal === "number" && Number.isFinite(shownVal) ? fmt(shownVal) : "—"}`
      : "";
  const pinPath = selected !== null && selected !== active ? sector(selected) : null;
  const activePath = active !== null ? sector(active) : null;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-polar-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      {...bind}
    >
      <StaticPolarClock
        {...rest}
        style={FILL}
        data={data}
        now={now}
        inner={inner}
        start={start}
        mode={mode}
        formatSegment={formatSegment}
        size={size}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; focus sector is transient. */}
        {pinPath ? <path d={pinPath} data-mc-ink="accent" data-mc-w="tick" /> : null}
        {activePath ? <path d={activePath} data-mc-ink="accent" /> : null}
        {rest.children}
      </StaticPolarClock>
      <LiveRegion>{announced}</LiveRegion>
      {shownSeg !== undefined ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {readout}
        </span>
      ) : null}
    </span>
  );
}
