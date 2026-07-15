"use client";
// Interactive <HeartbeatBlip>. Motion IS the encoding: the trace
// advances in real time so old spikes drift left and new events enter at the
// right — the blip frequency IS the event rate. Every spike is ONE real event;
// nothing is synthesized on a timer (a fake pulse on a dead service is the one
// unforgivable lie here). Gated on reduced-motion (→ the static frame, re-rendered
// on data change) and on-screen (paused off-viewport). Composes the static (canon).
import { useEffect, useMemo, useRef, useState } from "react";
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
    ...rest
  } = props;

  const reduced = usePrefersReducedMotion();
  const [wrapRef, inView] = useInViewport<HTMLSpanElement>();
  const baseNow = useMemo(() => latest(events, now), [events, now]);
  // The live clock: starts at the latest event, advances while motion is active,
  // and resets to the latest whenever the data changes (new events anchor at now).
  const [liveNow, setLiveNow] = useState(baseNow);
  const [announced, setAnnounced] = useState("");
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

  return (
    <span
      ref={wrapRef}
      className="mc-heartbeat-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
    >
      <StaticHeartbeatBlip
        {...rest}
        events={events}
        window={win}
        now={liveNow}
        strings={strings}
        summary={false}
      />
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
