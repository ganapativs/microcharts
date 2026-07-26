"use client";
// Interactive <HeartbeatBlip>. Motion IS the encoding: the trace
// advances in real time so old spikes drift left and new events enter at the
// right — the blip frequency IS the event rate. Every spike is ONE real event;
// nothing is synthesized on a timer (a fake pulse on a dead service is the one
// unforgivable lie here). Gated on reduced-motion (→ the static frame, re-rendered
// on data change) and on-screen (paused off-viewport). Composes the static (canon).
import { useEffect, useMemo, useRef, useState } from "react";
import { named, fillFor, wrap } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import { heartbeatGeometry } from "./geometry.js";
import { usePrefersReducedMotion, useInViewport } from "../../shared/motion.js";
import { EN_HEARTBEAT, type HeartbeatStrings } from "../../core/strings-heartbeat.js";
import { LiveRegion } from "../../shared/live-region.js";
import {
  HeartbeatBlip as StaticHeartbeatBlip,
  heartbeatSummary,
  type HeartbeatBlipProps,
} from "./index.js";

export interface InteractiveHeartbeatBlipProps extends HeartbeatBlipProps {
  strings?: HeartbeatStrings;
  /**
   * Show the floating count chip on hover/focus (default `true`). `false`
   * suppresses only the chip. Inert when `label="count"` already prints it.
   */
  readout?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. One trace = one unit,
   * so this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the trace, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** The trace was activated (click, tap, Enter or Space): `{ index: 0, value, label }` — the in-window event count. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

const TICK_MS = 250; // drift cadence — coarse, so it's a readable sweep not a jitter

function latest(events: readonly number[], now?: number): number {
  if (typeof now === "number" && Number.isFinite(now)) return now;
  let max = 0;
  let seen = false;
  for (const t of events)
    if (Number.isFinite(t) && (!seen || t > max)) {
      max = t;
      seen = true;
    }
  return seen ? max : 0;
}

export function HeartbeatBlip(props: InteractiveHeartbeatBlipProps): React.ReactNode {
  const {
    events,
    window: win = 60_000,
    now,
    strings = EN_HEARTBEAT,
    title,
    summary,
    readout = true,
    onActive,
    onSelect,
    className,
    style,
    ...rest
  } = props;

  const reduced = usePrefersReducedMotion();
  const [wrapRef, inView] = useInViewport<HTMLSpanElement>();
  const baseNow = useMemo(() => latest(events, now), [events, now]);
  // The live clock: starts at the latest event, advances while motion is active,
  // and resets to the latest whenever the data changes (new events anchor at now).
  const [liveNow, setLiveNow] = useState(baseNow);
  const [announced, setAnnounced] = useState("");
  const [hover, setHover] = useState(false);
  const prevLen = useRef(events.length);
  const mounted = useRef(false);

  useEffect(() => {
    setLiveNow(baseNow);
  }, [baseNow]);

  // Advance the clock so the trace sweeps left (only when motion is allowed).
  useEffect(() => {
    if (reduced || !inView) return;
    const id = setInterval(() => setLiveNow((n) => n + TICK_MS), TICK_MS);
    return () => clearInterval(id);
  }, [reduced, inView]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : heartbeatSummary(events, { window: win, now, strings });
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // Announce on data change (not per tick); pulse the endpoint on a new event.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prevLen.current = events.length;
      return;
    }
    if (events.length !== prevLen.current) {
      const grew = events.length > prevLen.current;
      prevLen.current = events.length;
      setAnnounced(heartbeatSummary(events, { window: win, now, strings }));
      if (grew && !reduced && inView) {
        const dot = wrapRef.current?.querySelector<SVGCircleElement>(".mc-heartbeat-now");
        if (dot) {
          dot.style.transformBox = "fill-box";
          dot.style.transformOrigin = "center";
          // ≤200ms, canonical strong ease-out (Emil ruling — motion-typed chart).
          dot.animate(
            [{ transform: "scale(1)" }, { transform: "scale(2.6)" }, { transform: "scale(1)" }],
            { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
          );
        }
      }
    }
  }, [events, win, now, strings, reduced, inView, wrapRef]);

  // The count in the window at the frame currently on screen — the number the
  // spike density only implies, and the number `label="count"` would print.
  const count = heartbeatGeometry({
    events,
    window: win,
    now: liveNow,
    width: 60,
    height: 16,
    pad: 1,
  }).count;
  // Bare `3` is ambiguous at a glance; the chip names the unit. The permanent
  // `label="count"` stays the tight numeral (space beside the glyph).
  const readoutText = strings.heartbeatChip(count);

  // Drill-down: the rate read the trace encodes — how many events are in the
  // window at the frame currently on screen — named by that window. One builder,
  // so `onActive` and `onSelect` can never report a different count or a
  // different string than the chip paints.
  const datum = (): MicroDatum => ({
    index: 0,
    value: count,
    label: strings.heartbeatWindow(win),
    formatted: readoutText,
  });
  const select = (): void => onSelect?.(datum());
  // ONE unit: `onActive` fires on the enter/leave EDGE only. `hover` alone can't
  // gate it — pointer-enter then focus both set it `true`, which would announce
  // the same unit twice — so the last emitted state is tracked here. (The count
  // keeps drifting with the clock; that is a value change, not a unit change, so
  // it never re-fires.)
  const shown = useRef(false);
  const activate = (on: boolean): void => {
    setHover(on);
    if (shown.current === on) return;
    shown.current = on;
    onActive?.(on ? datum() : null);
  };

  return (
    <span
      ref={wrapRef}
      {...wrap("mc-heartbeat-live", className, style)}
      {...named(ariaLabel)}
      onPointerEnter={() => activate(true)}
      onPointerLeave={() => activate(false)}
      onFocus={() => activate(true)}
      onBlur={() => activate(false)}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      }}
    >
      <StaticHeartbeatBlip
        {...rest}
        style={fillFor(style)}
        events={events}
        window={win}
        now={liveNow}
        strings={strings}
        summary={false}
      />
      <LiveRegion>{announced}</LiveRegion>
      {/* Spike density IS the rate, but the count behind it is invisible unless
          `label="count"` prints it. Hover/focus reveals it. */}
      {readout && hover && props.label !== "count" ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {readoutText}
        </span>
      ) : null}
    </span>
  );
}
