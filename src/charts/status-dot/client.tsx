"use client";
// Interactive <StatusDot>. `live` announces state changes through
// a polite region ("Deploys: warning."). No pointer math — a single 8-px state
// mark has nothing to reveal on hover that the summary doesn't already say
// (documented skip).
import { memo, useEffect, useRef, useState } from "react";
import { named, useScalarActive, type MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { resolveStatus, StatusDot as StaticStatusDot, type StatusDotProps } from "./index.js";

// Memoized: hover only flips wrapper state, so the static SVG must not re-render.
const Static = memo(StaticStatusDot);

export interface InteractiveStatusDotProps extends StatusDotProps {
  /** Announce when the status changes (default true). */
  live?: boolean;
  strings?: ScalarStrings;
  /**
   * Opt-in entrance motion (default `false`): the dot fades and scales in
   * when the chart first mounts client-side. Independent of the optional
   * `pulse` halo (a continuous CSS animation on a child `.mc-status-halo`
   * circle, not the root svg the entrance drives) — different element, no
   * property collision. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. One state mark = one
   * unit, so this fires once with `{ index: 0, … }` on pointer enter or focus and
   * once with `null` when that clears — never repeatedly while the pointer moves
   * inside the dot, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** Click/tap or Enter/Space on the dot — `{ index: 0, value: null, label: state }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function StatusDot(props: InteractiveStatusDotProps): React.ReactNode {
  const {
    live = true,
    animate = false,
    strings = EN_SCALAR,
    title,
    summary,
    onActive,
    onSelect,
    ...rest
  } = props;
  const state = resolveStatus(rest.status, rest.states);
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "pop", animate);
  const summaryText = strings.status(state.label);
  const accName =
    summary === false ? undefined : typeof summary === "string" ? summary : summaryText;
  const generated = [title, summaryText].filter(Boolean).join(". ");
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // Announce only real changes, not the initial mount (an aria-live region's
  // first content is read anyway by some SRs; keep the channel quiet until the
  // state actually moves).
  const [announced, setAnnounced] = useState("");
  const prev = useRef(state.label);
  useEffect(() => {
    if (prev.current === state.label) return;
    prev.current = state.label;
    if (live) setAnnounced(generated);
  }, [state.label, generated, live]);

  // One state mark, one selectable unit (index 0). A status encodes no number,
  // so `value` is null and the state's name rides in `label`. One builder, so
  // `onActive` and `onSelect` can never report a different state.
  const datum = (): MicroDatum => ({ index: 0, value: null, label: state.label });
  const { bind } = useScalarActive(datum, onActive, onSelect);

  return (
    <span ref={hostRef} className="mc-status-live" data-mc-host="" {...named(label)} {...bind}>
      <Static {...rest} strings={strings} summary={false} />
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
    </span>
  );
}
