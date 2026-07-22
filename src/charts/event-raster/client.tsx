"use client";
// Interactive <EventRaster>. useActivePicker owns interaction: one pointer
// listener (lane from y, nearest event from x), 2-D roving keyboard (↑/↓ lanes,
// ←/→ events within a lane — ActivityGrid model), click / Enter / Space selects
// (onSelect). Composes the static component (canon).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, type Format } from "../../core/format.js";
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
import { EN_EVENT_RASTER } from "../../core/strings-event-raster.js";
import { LANE_CAP, rasterDomain, rasterLabels } from "./geometry.js";
import {
  EventRaster as StaticEventRaster,
  eventRasterSummary,
  type EventRasterProps,
} from "./index.js";

// Mirrors the static entry's lane unit exactly — the interactive default height
// must equal the static default height or the two render at different sizes.
const LANE_UNIT = 14;

export interface InteractiveEventRasterProps extends EventRasterProps, PickerProps {
  /**
   * Number format/locale for the hover/focus readout. Interactive-only: the
   * static entry renders lane names and marks, never a number.
   */
  format?: Format;
  locale?: string | string[];
  /**
   * Opt-in entrance motion (default `false`): lanes fade in top-to-bottom on
   * first client-side mount. Inert on the server and on hydrated server
   * HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function EventRaster(props: InteractiveEventRasterProps): React.ReactNode {
  const {
    data,
    labels: labelsProp,
    domain: domainProp,
    width = 120,
    height: heightProp,
    format,
    locale,
    strings = EN_EVENT_RASTER,
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
  // Each lane's events are merged into one raster path (or, when binned, a
  // handful of count rects) rather than discrete per-event elements —
  // settle's per-mark scale would shift tick x-positions non-uniformly
  // within a lane. wipe (a left→right clip) uncovers events in chronological
  // order along the shared time axis, matching how a raster is read.
  useEntrance(hostRef, "wipe", animate);

  const lanes = useMemo(() => data.slice(0, LANE_CAP), [data]);
  const n = Math.max(1, lanes.length);
  const height = heightProp ?? n * LANE_UNIT;
  const laneH = height / n;
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const domain = useMemo(() => domainProp ?? rasterDomain(data), [domainProp, data]);

  const sorted = useMemo(
    () => lanes.map((l) => [...l.events].filter((e) => Number.isFinite(e)).sort((a, b) => a - b)),
    [lanes],
  );
  // Widest lane label, in chars. Memoised away from the render path (a scrub
  // re-renders per unit crossed); the gutter itself is cheap arithmetic on top.
  const labelCh = useMemo(() => {
    let max = 1;
    for (const l of lanes) max = Math.max(max, l.label.length);
    return max;
  }, [lanes]);
  // Same drop rule as static — a mismatch would offset every tick.
  const { gutter } = rasterLabels({
    labels: labelsProp ?? n <= 8,
    width,
    height,
    lanes: n,
    maxChars: labelCh,
  });
  const plotX0 = gutter;
  const plotW = Math.max(1, width - gutter - 1);
  const span = domain[1] - domain[0] || 1;
  const xOf = useCallback(
    (t: number) => plotX0 + ((t - domain[0]) / span) * plotW,
    [plotX0, plotW, span, domain],
  );

  // Unit = one EVENT, flattened lane-major across lanes (lane 0's events first,
  // then lane 1's…): the raster is 2-D (lane × time) but the contract's index is
  // a single number, so it addresses the event, not a lane×slot pair. `starts`
  // holds each lane's first unit index (and `starts[n]` the total).
  const starts = useMemo(() => {
    const out = [0];
    for (let i = 0; i < sorted.length; i++) out.push(out[i]! + sorted[i]!.length);
    return out;
  }, [sorted]);
  const count = starts[starts.length - 1]!;
  const laneOf = useCallback(
    (i: number) => {
      for (let l = sorted.length - 1; l >= 0; l--) if (i >= starts[l]!) return l;
      return 0;
    },
    [sorted, starts],
  );

  const locate = useCallback(
    (x: number, y: number) => {
      const lane = Math.max(0, Math.min(sorted.length - 1, Math.floor(y / laneH)));
      const evs = sorted[lane];
      // An empty lane holds no navigable unit — nothing to report.
      if (!evs || evs.length === 0) return null;
      let best = 0;
      let bestD = Infinity;
      evs.forEach((t, i) => {
        const d = Math.abs(xOf(t) - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return starts[lane]! + best;
    },
    [sorted, laneH, xOf, starts],
  );

  // 2-D roving: ↑/↓ jump to the first event of the nearest populated lane, ←/→
  // walk events INSIDE the current lane. All four arrows are intercepted so a
  // sideways key can never cross a lane boundary.
  const step = useCallback(
    (cur: number, key: string) => {
      if (count === 0) return null;
      if (cur < 0) return key === "End" ? count - 1 : 0;
      const lane = laneOf(cur);
      const ev = cur - starts[lane]!;
      const len = sorted[lane]!.length;
      const laneJump = (dir: number) => {
        for (let l = lane + dir; l >= 0 && l < sorted.length; l += dir)
          if (sorted[l]!.length > 0) return starts[l]!;
        return cur; // boundary: consume the key without moving
      };
      switch (key) {
        case "ArrowUp":
          return laneJump(-1);
        case "ArrowDown":
          return laneJump(1);
        case "ArrowLeft":
          return ev > 0 ? cur - 1 : cur;
        case "ArrowRight":
          return ev < len - 1 ? cur + 1 : cur;
        case "Home":
          return 0;
        case "End":
          return count - 1;
      }
      return null;
    },
    [count, laneOf, starts, sorted],
  );

  // value = the event's TIME on the shared axis (what its tick x encodes);
  // label = its lane.
  const datum = useCallback(
    (i: number) => {
      const lane = laneOf(i);
      const t = sorted[lane]![i - starts[lane]!] ?? null;
      return {
        index: i,
        value: t,
        label: lanes[lane]?.label,
        formatted: t === null ? undefined : `${lanes[lane]!.label} · ${fmt(t)}`,
      };
    },
    [laneOf, sorted, starts, lanes, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count,
    width,
    height,
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
        : eventRasterSummary(data, [], strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // unit index → its lane + event time (undefined when out of range)
  const at = (i: number | null): { lane: number; t: number } | undefined => {
    if (i === null || i < 0 || i >= count) return undefined;
    const lane = laneOf(i);
    const t = sorted[lane]?.[i - starts[lane]!];
    return t === undefined ? undefined : { lane, t };
  };
  const shown = active ?? selected;
  const cur = at(shown);
  const shownLane = cur ? cur.lane : null;
  const t = cur ? cur.t : undefined;
  const pin = selected !== null && selected !== active ? at(selected) : undefined;
  const pinX = pin ? pin.t : undefined;
  const announced =
    shownLane !== null && t !== undefined
      ? strings.eventRasterAt(
          lanes[shownLane]!.label,
          fmt(t),
          shown! - starts[shownLane]! + 1,
          sorted[shownLane]!.length,
        )
      : "";

  return (
    <span ref={hostRef} {...wrap("mc-raster-live", className, style)} {...named(label)} {...bind}>
      <StaticEventRaster
        {...rest}
        data={data}
        labels={labelsProp}
        domain={domain}
        width={width}
        height={height}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {pinX !== undefined ? (
          <line
            x1={xOf(pinX)}
            x2={xOf(pinX)}
            y1={0.5}
            y2={height - 0.5}
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {shownLane !== null ? (
          <rect
            x={plotX0 - 0.5}
            y={shownLane * laneH + 0.3}
            width={plotW + 1}
            height={laneH - 0.6}
            fill="none"
            stroke="var(--mc-accent)"
            strokeOpacity={0.5}
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {t !== undefined ? (
          <line
            x1={xOf(t)}
            x2={xOf(t)}
            y1={0.5}
            y2={height - 0.5}
            data-mc-ink="muted"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticEventRaster>
      <LiveRegion>{announced}</LiveRegion>
      {readout && t !== undefined && shownLane !== null ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(xOf(t), width)}>
          {`${lanes[shownLane]!.label} · ${fmt(t)}`}
        </span>
      ) : null}
    </span>
  );
}
