"use client";
// Interactive <Delta>. The static glyph+value plus a
// `live` mode: when the value changes it re-announces the new figure through a
// polite region (for updating KPI cards) and gives a one-shot pulse. Motion is
// gated on reduced-motion in CSS; the announcement always fires.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { Delta as StaticDelta, deltaModel, type DeltaProps } from "./index.js";

// Fresh-client-mount detector, mirroring the motion gate's hydration latch: the
// value change edge is `true` on the very first render only while hydrating
// server HTML, so a hydrated mount never re-enters. Kept local (the engine's
// snapshot helpers are private) — three trivial constants, no shared coupling.
const subscribeNever = (): (() => void) => () => {};
const clientSnap = (): boolean => false;
const serverSnap = (): boolean => true;

export interface InteractiveDeltaProps extends DeltaProps {
  /** Announce + pulse when the value changes (default true). */
  live?: boolean;
  /**
   * Opt-in entrance motion (default `false`): the glyph fades and scales in
   * when the chart first mounts client-side. Independent of the existing
   * value-change pulse (a separate CSS animation on the number span, not the
   * glyph svg) — the two never touch the same element. Inert on the server
   * and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. One value = one unit,
   * so this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the glyph, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** Click/tap or Enter/Space on the glyph — `{ index: 0, value: the signed change }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function Delta({
  live = true,
  animate = false,
  onActive,
  onSelect,
  ...props
}: InteractiveDeltaProps): React.ReactNode {
  const [pulse, setPulse] = useState(false);
  const prev = useRef(props.value);
  const { summary, shown, display } = deltaModel(props);
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "pop", animate);

  // The `pop` entrance above animates only the glyph svg; the primary number is
  // an HTML sibling outside it. Cast the number into the same mount entrance so
  // it lifts+scales in beside the glyph instead of teleporting. Gated exactly
  // like the glyph: opt-in, fresh client mount only (never over hydrated HTML),
  // and `prefers-reduced-motion` strips the keyframe (motion layer).
  const hydrating = useSyncExternalStore(subscribeNever, clientSnap, serverSnap);
  const ssr = useRef(hydrating);
  const enter = animate && !ssr.current;

  useEffect(() => {
    if (prev.current === props.value) return;
    prev.current = props.value;
    if (!live) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 450);
    return () => clearTimeout(t);
  }, [props.value, live]);

  // One value, one selectable unit (index 0) — no roving. The decorative form
  // (`summary={false}`) stays inert: nothing to name, so nothing to focus,
  // activate or report.
  const inert = props.summary === false;
  const datum = (): MicroDatum => ({ index: 0, value: shown, formatted: display });
  const pick = onSelect && !inert ? (): void => onSelect(datum()) : undefined;
  // `onActive` fires on the enter/leave EDGE only: pointer-enter then focus both
  // mean "active", and the same unit must not be announced twice.
  const report = onActive && !inert ? onActive : undefined;
  const shownActive = useRef(false);
  const activate = (on: boolean): void => {
    if (!report || shownActive.current === on) return;
    shownActive.current = on;
    report(on ? datum() : null);
  };

  return (
    <span
      ref={hostRef}
      className="mc-delta-live"
      data-pulse={pulse ? "1" : undefined}
      data-enter={enter ? "1" : undefined}
      tabIndex={pick || report ? 0 : undefined}
      onPointerEnter={() => activate(true)}
      onPointerLeave={() => activate(false)}
      onFocus={() => activate(true)}
      onBlur={() => activate(false)}
      onClick={pick}
      onKeyDown={
        pick
          ? (e): void => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              pick();
            }
          : undefined
      }
    >
      <StaticDelta {...props} />
      <LiveRegion>{live && props.summary !== false ? summary : ""}</LiveRegion>
    </span>
  );
}
